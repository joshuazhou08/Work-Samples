import logging

import stripe
from django.conf import settings
from django.http import HttpRequest
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.payments.utils import update_user_billing_status, sync_billing_status_from_customer
from apps.accounts.models import User
from apps.emails import send_info_email
from apps.sessions.models import Hours
from apps.payments.models import Charge
from decimal import Decimal
from apps.payments.models import StripeEvent
import json
from apps.emails.invoices.service import send_invoice_email

logger = logging.getLogger(__name__)

stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_billing_portal_session(request):
    """
    Create a Stripe Billing Portal session so the user can manage saved payment methods.
    """

    user: User = request.user
    payload = request.data or {}
    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip(
        "/"
    )
    default_return = f"{frontend_base}/dashboard"
    return_url = payload.get("return_url", default_return)

    if not return_url:
        return Response(
            {
                "error": "Invalid request.",
                "messages": ["A return_url must be provided."],
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.stripe_customer_id:
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.get_full_name(),
                metadata={"user_id": str(user.id)},
            )
            user.stripe_customer_id = customer.get("id")
            user.save(update_fields=["stripe_customer_id"])
        except stripe.error.StripeError as exc:
            logger.exception(
                "Unable to create Stripe customer for user %s: %s", user.id, exc
            )
            return Response(
                {
                    "error": "Billing portal unavailable.",
                    "messages": [
                        "Unable to create a Stripe customer at this time. Please try again later."
                    ],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url,
        )
    except stripe.error.StripeError as exc:
        logger.exception(
            "Unable to create billing portal session for user %s: %s", user.id, exc
        )
        return Response(
            {
                "error": "Billing portal unavailable.",
                "messages": [
                    "Unable to open the Stripe customer portal right now. Please try again later."
                ],
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"url": session.get("url")})


@api_view(["POST"])
@permission_classes([AllowAny])
def stripe_webhook(request: HttpRequest):
    """
    Handle Stripe webhook notifications to keep billing status in sync.
    """

    if not STRIPE_WEBHOOK_SECRET:
        logger.error("Stripe webhook secret not configured.")
        return Response(
            {
                "error": "Webhook misconfiguration.",
                "messages": ["Stripe webhook secret is not configured."],
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        return Response(status=400)
    

    event_id = event.get("id")
    # IDempotency check
    if StripeEvent.objects.filter(event_id=event_id).exists():
        logger.info("Ignoring duplicate Stripe event %s", event_id)
        return Response(status=200)
    
    StripeEvent.objects.create(event_id=event_id)

    event_type = event.get("type")
    data = event.get("data", {}).get("object", {})
    prev = event.get("data", {}).get("previous_attributes", {})

    logger.info("Processing Stripe webhook event: %s", event_type)

    if event_type == "invoice.payment_succeeded":
        _handle_payment_succeeded(data)
    elif event_type == "invoice.payment_failed":
        _handle_payment_failed(data)
    elif event_type in {
        "customer.updated",
        "payment_method.detached",
        "payment_method.attached",
        "payment_method.updated",
    }:
        
        customer_id = (
            data.get("customer")            # PM events
            or data.get("id")               # customer.updated
            or prev.get("customer")        # fallback for updated/detached events
        )

        sync_billing_status_from_customer(customer_id)
    else:
        logger.info("Unhandled Stripe webhook event type: %s", event_type)

    return Response({"status": "ok"})

def _handle_payment_succeeded(data: dict) -> None:
    """
    Handles invoice.payment_succeeded events.
    Stripe Credits automatically applied.
    """
    # Invoice object
    invoice_id = data.get("id")
    customer_id = data.get("customer")

    # Stripe updates billing status
    update_user_billing_status(customer_id, User.BillingStatus.VALID)

    # Metadata sent from Go
    meta_data = data.get("metadata", {})
    client_id = meta_data.get("client_id")
    currency = data.get("currency", "usd")

    # Prefer metadata values (sent by Go) for amounts; fall back to Stripe invoice fields.
    original_amount_cents = data.get("total", 0)
    if meta_data.get("total_amount") is not None:
        try:
            original_amount_cents = int(meta_data.get("total_amount"))
        except (TypeError, ValueError):
            pass

    credits_applied_cents = max(0, original_amount_cents - data.get("amount_paid", 0))
    if meta_data.get("credits_applied") is not None:
        try:
            credits_applied_cents = int(meta_data.get("credits_applied"))
        except (TypeError, ValueError):
            pass

    final_amount_cents = data.get("amount_paid", 0)
    if meta_data.get("final_amount") is not None:
        try:
            final_amount_cents = int(meta_data.get("final_amount"))
        except (TypeError, ValueError):
            pass

    # Get client user
    if not client_id:
        logger.warning(
            "Missing client in invoice.payment_succeeded for invoice %s", invoice_id
        )
        return

    client = User.objects.filter(id=client_id).first()
    if not client:
        logger.warning("Client %s not found for invoice %s", client_id, invoice_id)
        return

    # Deduct applied credits from local balance
    if credits_applied_cents > 0:
        credits_applied = Decimal(credits_applied_cents) / Decimal("100")
        new_balance = client.balance - credits_applied
        if new_balance < 0:
            new_balance = Decimal("0")
        User.objects.filter(id=client.id).update(balance=new_balance)
        client.balance = new_balance

    # Create Charge record (one per invoice) before processing sessions
    charge_obj, created = Charge.objects.get_or_create(
        user=client,
        stripe_checkout_id=invoice_id,
        defaults={
            "amount": Decimal(original_amount_cents) / Decimal("100"),
            "credits_applied": Decimal(credits_applied_cents) / Decimal("100"),
            "final_amount": Decimal(final_amount_cents) / Decimal("100"),
            "currency": currency,
            "status": "paid",
        },
    )

    if not created:
        logger.warning("Charge for invoice %s already exists for client %s.", invoice_id, client_id)

    # sessions metadata: JSON array of objects with id, student_rate, tutor_rate
    sessions_json = meta_data.get("sessions")
    if not sessions_json:
        logger.warning("Missing sessions metadata in invoice.payment_succeeded for invoice %s", invoice_id)
        return

    parsed_sessions = []
    try:
        for sess in json.loads(sessions_json):
            sid = sess.get("id")
            srate = sess.get("student_rate")
            trate = sess.get("tutor_rate")
            if sid is None:
                continue
            parsed_sessions.append(
                (int(sid), Decimal(str(srate)), Decimal(str(trate)))
            )
    except (TypeError, ValueError, json.JSONDecodeError, ArithmeticError):
        logger.warning("Unable to parse sessions metadata for invoice %s", invoice_id)
        return

    if not parsed_sessions:
        logger.warning("No sessions parsed for invoice %s", invoice_id)
        return

    sessions_by_id = Hours.objects.in_bulk([sid for sid, _, _ in parsed_sessions])
    linked_sessions = []

    for sid, student_rate, tutor_rate in parsed_sessions:
        session = sessions_by_id.get(int(sid)) if str(sid).isdigit() else None
        if not session:
            logger.warning("Session %s not found while processing invoice %s", sid, invoice_id)
            continue

        session.mark_student_charged()
        session.mark_student_rate(student_rate)
        session.mark_tutor_rate(tutor_rate)
        linked_sessions.append(session)

    if linked_sessions:
        charge_obj.sessions.set(linked_sessions)

    send_invoice_email(charge_obj, client)

def _handle_payment_failed(data: dict) -> None:
    customer_id = data.get("customer")
    if not customer_id:
        return
    invoice_id = data.get("id")

    # void it so the user does not have the option to pay manually
    stripe.Invoice.void_invoice(invoice_id)

    user = (
        User.objects.filter(stripe_customer_id=customer_id)
        .only("email")
        .first()
    )
    if not user:
        logger.warning(
            "Payment failed for unknown Stripe customer %s", customer_id
        )
        return

    update_user_billing_status(customer_id, User.BillingStatus.INVALID)

    send_info_email(
        recipient=user.email,
        subject="Payment Failed – Please Update Your Card",
        message=(
            "Hi! Your recent payment to CalTutors failed. "
            "Please update your card in your billing portal."
        ),
    )
