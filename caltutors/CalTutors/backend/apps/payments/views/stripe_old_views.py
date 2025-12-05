import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Dict, Iterable, List

import stripe
from django.conf import settings
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.emails.invoices import send_invoice_email
from apps.payments.models import Charge
from apps.sessions.models import Hours

logger = logging.getLogger(__name__)

# Initialize Stripe with secret key
stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")


@dataclass(frozen=True)
class CheckoutPayload:
    """Normalized request data for a checkout session."""

    amount: int
    currency: str
    description: str
    sessions: List[Dict]
    metadata: Dict[str, str]
    is_credit_package: bool


@dataclass(frozen=True)
class PaymentBreakdown:
    """Computed payment values after applying user credits."""

    original_amount: int
    credits_applied: int
    final_amount: int

    @property
    def payment_required(self) -> bool:
        return self.final_amount > 0


def _extract_session_ids(raw_value) -> List[int]:
    """Parse session identifiers from metadata payload."""
    if not raw_value:
        return []

    if isinstance(raw_value, str):
        tokens: Iterable[str] = raw_value.split(",")
    else:
        tokens = raw_value

    session_ids: List[int] = []
    for token in tokens:
        try:
            session_id = int(str(token).strip())
        except (TypeError, ValueError):
            continue
        if session_id:
            session_ids.append(session_id)
    return session_ids


def _parse_checkout_payload(data: Dict) -> CheckoutPayload:
    """Normalize and validate incoming checkout request data."""
    amount = data.get("amount")
    if not amount or int(amount) <= 0:
        raise ValueError("Valid amount is required")

    sessions = data.get("sessions") or []
    metadata = data.get("metadata") or {}

    return CheckoutPayload(
        amount=int(amount),
        currency=str(data.get("currency", "usd")).lower(),
        description=str(data.get("description", "")),
        sessions=sessions,
        metadata=dict(metadata),
        is_credit_package=len(sessions) == 0,
    )


def _calculate_payment_breakdown(
    user_balance: Decimal, payload: CheckoutPayload
) -> PaymentBreakdown:
    """Determine how much of the payment is covered by credits."""
    if payload.is_credit_package:
        return PaymentBreakdown(
            original_amount=payload.amount, credits_applied=0, final_amount=payload.amount
        )

    balance_cents = int(user_balance * 100)
    credits_applied = min(balance_cents, payload.amount)
    final_amount = max(payload.amount - credits_applied, 0)
    return PaymentBreakdown(
        original_amount=payload.amount,
        credits_applied=credits_applied,
        final_amount=final_amount,
    )


def _process_balance_only_payment(
    user: User, payload: CheckoutPayload, breakdown: PaymentBreakdown
) -> Response:
    """Handle payments that are fully covered by the user's balance."""

    session_ids = _extract_session_ids(payload.metadata.get("session_ids"))
    sessions = list(_process_payment_sessions(False, session_ids))

    amount_dollars = Decimal(breakdown.original_amount) / Decimal("100")

    with transaction.atomic():
        _update_user_balance(
            user,
            is_credit_package=False,
            original_amount=breakdown.original_amount,
            credits_applied=breakdown.credits_applied,
        )

        charge = Charge.objects.create(
            user=user,
            stripe_checkout_id=None,
            amount=amount_dollars,
            credits_applied=amount_dollars,
            final_amount=Decimal("0"),
            currency=payload.currency,
            status="paid",
        )

        if sessions:
            charge.sessions.set(sessions)
            for session in sessions:
                session.mark_student_charged()
                session.mark_student_rate()
                session.mark_tutor_charged()
                session.mark_tutor_rate()

    logger.info(
        "Processed balance-only payment for user %s - Amount: $%.2f, Charge: %s",
        user.id,
        amount_dollars,
        charge.id,
    )

    return Response(
        {
            "message": "Payment covered by account balance",
            "url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/dashboard?payment=success",
            "original_amount": breakdown.original_amount,
            "credits_applied": breakdown.original_amount,
            "final_amount": 0,
            "payment_required": False,
        }
    )


def _build_line_items(
    payload: CheckoutPayload, breakdown: PaymentBreakdown, user_balance: Decimal
) -> List[Dict]:
    """Create line items for the Stripe Checkout Session."""
    original_amount_dollars = Decimal(breakdown.original_amount) / Decimal("100")
    credits_applied_dollars = Decimal(breakdown.credits_applied) / Decimal("100")

    if payload.is_credit_package:
        credits_received = original_amount_dollars
        savings = Decimal("0")
        if original_amount_dollars == Decimal("280"):
            credits_received = Decimal("300")
            savings = Decimal("20")
        elif original_amount_dollars == Decimal("550"):
            credits_received = Decimal("600")
            savings = Decimal("50")

        product_name = f"Credit Package - ${credits_received:.0f} Credits"
        description = (
            f"Credit Package: ${credits_received:.2f} credits for ${original_amount_dollars:.2f} "
            f"(Save ${savings:.2f}!) | Balance After: "
            f"${Decimal(user_balance) + credits_received:.2f}"
        )
    else:
        session_count = len(payload.sessions)
        product_name = f"Tutoring Session{'s' if session_count != 1 else ''}"

        if breakdown.credits_applied > 0:
            remaining_balance = (
                Decimal(user_balance) - credits_applied_dollars
            )
            description = (
                f"Amount: ${original_amount_dollars:.2f} | "
                f"Credits Applied: ${credits_applied_dollars:.2f} | "
                f"Credits Remaining: ${remaining_balance:.2f}"
            )
        else:
            description = (
                f"Amount: ${original_amount_dollars:.2f} | "
                f"Credits Remaining: ${Decimal(user_balance):.2f}"
            )

    return [
        {
            "price_data": {
                "currency": payload.currency,
                "product_data": {
                    "name": product_name,
                    "description": description,
                },
                "unit_amount": breakdown.final_amount,
            },
            "quantity": 1,
        }
    ]


def _build_stripe_metadata(
    user: User, payload: CheckoutPayload, breakdown: PaymentBreakdown
) -> Dict[str, str]:
    """Prepare metadata for the Stripe Checkout Session."""
    metadata = {
        str(key): str(value) for key, value in payload.metadata.items()
    }
    metadata.update(
        {
            "user_id": str(user.id),
            "user_email": user.email,
            "user_name": f"{user.first_name} {user.last_name}",
            "original_amount": str(breakdown.original_amount),
            "credits_applied": str(breakdown.credits_applied),
            "final_amount": str(breakdown.final_amount),
        }
    )
    if payload.is_credit_package:
        metadata["is_credit_package"] = "true"
    return metadata


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """
    Create a Stripe Checkout Session for processing payments.

    Expected payload:
    {
        "amount": 1000,  # Amount in cents
        "currency": "usd",
        "description": "Payment for tutoring sessions",
        "sessions": [...],  # Session details from frontend
        "metadata": {
            "session_ids": "1,2,3",
            "payment_type": "student_session_payment"
        }
    }
    """
    try:
        payload = _parse_checkout_payload(request.data)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        breakdown = _calculate_payment_breakdown(request.user.balance, payload)

        if not breakdown.payment_required:
            return _process_balance_only_payment(request.user, payload, breakdown)

        line_items = _build_line_items(payload, breakdown, request.user.balance)
        stripe_metadata = _build_stripe_metadata(request.user, payload, breakdown)

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/dashboard?payment=success",
            cancel_url=f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/dashboard?payment=cancelled",
            metadata=stripe_metadata,
        )

        original_amount_dollars = Decimal(breakdown.original_amount) / Decimal("100")
        credits_applied_dollars = Decimal(breakdown.credits_applied) / Decimal("100")
        final_amount_dollars = Decimal(breakdown.final_amount) / Decimal("100")

        logger.info(
            "Created Checkout Session %s for user %s - Original: $%.2f, Credits: $%.2f, Final: $%.2f",
            session.id,
            request.user.id,
            original_amount_dollars,
            credits_applied_dollars,
            final_amount_dollars,
        )

        return Response(
            {
                "id": session.id,
                "url": session.url,
                "original_amount": breakdown.original_amount,
                "credits_applied": breakdown.credits_applied,
                "final_amount": breakdown.final_amount,
                "payment_required": True,
            }
        )

    except stripe.error.StripeError as exc:
        logger.error("Stripe error creating Checkout Session: %s", exc)
        return Response(
            {"error": f"Stripe error: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("Error creating Checkout Session: %s", exc)
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """
    Handle Stripe webhook events.
    """
    event = _parse_webhook_event(request)
    if isinstance(event, JsonResponse):
        return event

    handlers = {
        "checkout.session.completed": _handle_checkout_session_completed,
        "checkout.session.expired": _handle_checkout_session_expired,
    }

    handler = handlers.get(event["type"], _handle_unhandled_event)
    handler(event)
    return JsonResponse({"status": "success"})


def _parse_webhook_event(request):
    """Verify and construct the Stripe webhook event."""
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")

    try:
        return stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        logger.error("Invalid payload in Stripe webhook")
        return JsonResponse({"error": "Invalid payload"}, status=400)
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid signature in Stripe webhook")
        return JsonResponse({"error": "Invalid signature"}, status=400)


def _handle_checkout_session_completed(event):
    """Process a completed checkout session webhook."""
    stripe_session = event["data"]["object"]
    metadata = stripe_session.get("metadata") or {}

    logger.info("Checkout Session %s completed via webhook", stripe_session.get("id"))

    session_ids = _extract_session_ids(metadata.get("session_ids", ""))
    user_id = metadata.get("user_id")

    def _int_from_metadata(key: str) -> int:
        try:
            return int(metadata.get(key, "0"))
        except (TypeError, ValueError):
            return 0

    original_amount = _int_from_metadata("original_amount")
    credits_applied = _int_from_metadata("credits_applied")
    final_amount = _int_from_metadata("final_amount")

    is_credit_package = metadata.get("is_credit_package") == "true"

    logger.info(
        "Payment completed for user %s, sessions: %s, is_credit_package: %s",
        user_id,
        session_ids,
        is_credit_package,
    )

    try:
        with transaction.atomic():
            user = User.objects.get(id=user_id)

            sessions_qs = _process_payment_sessions(is_credit_package, session_ids)
            session_list = list(sessions_qs)

            charge, created = Charge.objects.get_or_create(
                user=user,
                stripe_checkout_id=stripe_session.get("id"),
                defaults={
                    "amount": Decimal(original_amount) / Decimal("100"),
                    "credits_applied": Decimal(credits_applied) / Decimal("100"),
                    "final_amount": Decimal(final_amount) / Decimal("100"),
                    "currency": "usd",
                    "status": "paid",
                },
            )

            if not created:
                logger.debug(
                    "Charge %s already exists for checkout session %s",
                    charge.id,
                    stripe_session.get("id"),
                )
                return

            # sometimes stripe sends duplicate webhooks, so this ensures we don't do it twice
            logger.info(
                "Created charge %s for %d sessions - Amount: $%s, Credits: $%s, Final: $%s",
                charge.id,
                len(session_list),
                charge.amount,
                charge.credits_applied,
                charge.final_amount,
            )

            if session_list:
                charge.sessions.set(session_list)
                for session in session_list:
                    session.mark_student_charged()
                    session.mark_student_rate()
                    session.mark_tutor_charged()
                    session.mark_tutor_rate()

            _update_user_balance(
                user, is_credit_package, original_amount, credits_applied
            )

            def _send_invoice():
                if not send_invoice_email(charge, user):
                    logger.warning(
                        "Invoice email for charge %s (%s) was not sent successfully.",
                        charge.id,
                        charge.stripe_checkout_id or charge.id,
                    )

            transaction.on_commit(_send_invoice)

            logger.info(
                "Successfully processed payment for user %s, charge %s",
                user_id,
                charge.id,
            )

    except User.DoesNotExist:
        logger.error("User with ID %s not found", user_id)
    except IntegrityError:
        # Another thread might have inserted same charge concurrently
        pass
    except Exception as exc:
        logger.error("Error processing payment success: %s", exc)
        # Don't return an error to Stripe - we don't want them to retry


def _handle_checkout_session_expired(event):
    """Log checkout session expiration."""
    stripe_session = event["data"]["object"]
    logger.warning(
        "Checkout Session %s expired via webhook", stripe_session.get("id")
    )


def _handle_unhandled_event(event):
    """Log unhandled webhook events."""
    logger.info("Unhandled Stripe webhook event type: %s", event.get("type"))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payment_status(request, payment_intent_id):
    """
    Get the status of a PaymentIntent.
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        # Verify the PaymentIntent belongs to the current user
        if intent.metadata.get("user_id") != str(request.user.id):
            return Response(
                {"error": "Unauthorized access to payment"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {
                "id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "amount_received": intent.amount_received,
                "currency": intent.currency,
                "created": intent.created,
                "metadata": intent.metadata,
            }
        )

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error retrieving payment status: {str(e)}")
        return Response(
            {"error": f"Stripe error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error retrieving payment status: {str(e)}")
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def _process_payment_sessions(is_credit_package, session_ids):
    """Process sessions for payment - return empty queryset for credit packages."""
    if is_credit_package:
        return Hours.objects.none()

    sessions = Hours.objects.filter(id__in=session_ids).select_related(
        "student", "tutor"
    )

    if not sessions.exists():
        logger.error(f"No sessions found for IDs: {session_ids}")

    return sessions


def _update_user_balance(user, is_credit_package, original_amount, credits_applied):
    """Update user balance based on payment type."""
    if is_credit_package:
        # Add credits for credit packages
        cost = Decimal(str(original_amount / 100))
        if cost == Decimal("280"):
            credits_to_add = Decimal("300")  # $280 → $300 credits
        elif cost == Decimal("550"):
            credits_to_add = Decimal("600")  # $500 → $600 credits
        else:
            # Fallback for other amounts
            credits_to_add = cost

        user.balance += credits_to_add
        user.save()
        logger.info(
            f"Added ${credits_to_add:.2f} credits to user {user.id} balance for ${cost:.2f} credit package"
        )
    else:
        # Deduct applied credits for session payments
        if credits_applied > 0:
            credits_in_dollars = Decimal(str(credits_applied / 100))
            user.balance -= credits_in_dollars
            user.save()
            logger.info(
                f"Deducted ${credits_in_dollars:.2f} from user {user.id} balance"
            )
