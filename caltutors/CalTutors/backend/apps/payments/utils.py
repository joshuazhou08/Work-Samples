import logging
from apps.accounts.models import User
import stripe

logger = logging.getLogger(__name__)
def update_user_billing_status(customer_id: str, status_value: str) -> None:
    if not customer_id:
        return

    updated = User.objects.filter(stripe_customer_id=customer_id).update(
        billing_status=status_value
    )
    if updated == 0:
        logger.info(
            "No user found while updating billing status for customer %s", customer_id
        )

def sync_billing_status_from_customer(customer_id: str) -> None:
    if not customer_id:
        return

    # Expands to avoid caching issues
    try:
        pm_list = stripe.PaymentMethod.list(
            customer=customer_id,
            type="card",
            expand=["data.customer"],
        )
    except stripe.error.StripeError as exc:
        logger.warning(
            "Unable to list payment methods for customer %s: %s",
            customer_id,
            exc,
        )
        return

    # Secondary check for bank accounts etc.
    if len(pm_list.data) == 0:
        try:
            pm_list = stripe.PaymentMethod.list(
                customer=customer_id,
                type="us_bank_account",
                expand=["data.customer"],
            )
        except stripe.error.StripeError:
            pass

    has_pm = len(pm_list.data) > 0

    # Clean up stale default PM
    try:
        customer = stripe.Customer.retrieve(customer_id)
        default_pm_id = customer.get("invoice_settings", {}).get("default_payment_method")

        if default_pm_id:
            try:
                stripe.PaymentMethod.retrieve(default_pm_id)
            except stripe.error.InvalidRequestError:
                stripe.Customer.modify(
                    customer_id,
                    invoice_settings={"default_payment_method": None},
                )
    except stripe.error.StripeError:
        pass

    new_status = User.BillingStatus.VALID if has_pm else User.BillingStatus.MISSING
    update_user_billing_status(customer_id, new_status)