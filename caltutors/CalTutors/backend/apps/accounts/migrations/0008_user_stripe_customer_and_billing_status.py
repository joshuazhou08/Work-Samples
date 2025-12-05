import logging
from decimal import Decimal

import stripe
from django.conf import settings
from django.db import migrations, models

logger = logging.getLogger(__name__)


def create_customers_and_migrate_credits(apps, schema_editor):
    User = apps.get_model("accounts", "User")

    api_key = getattr(settings, "STRIPE_SECRET_KEY", "")
    if not api_key:
        logger.warning("STRIPE_SECRET_KEY missing, skipping Stripe backfill.")
        return

    stripe.api_key = api_key

    for user in User.objects.all().iterator():

        # ---------------------------------------------------------
        # STEP 1: Ensure Stripe customer exists
        # ---------------------------------------------------------
        customer_id = user.stripe_customer_id

        if not customer_id:
            try:
                # Try to find customer by email
                result = stripe.Customer.list(email=user.email, limit=1)
                data = result.get("data", []) if result else []

                if data:
                    # Existing Stripe customer found
                    customer_id = data[0]["id"]
                    logger.info(f"Matched existing Stripe customer for {user.email}")

                else:
                    # Create new Stripe customer
                    created = stripe.Customer.create(
                        email=user.email,
                        name=f"{user.first_name} {user.last_name}",
                        metadata={"user_id": user.id},
                    )
                    customer_id = created["id"]
                    logger.info(f"Created new Stripe customer for {user.email}")

                user.stripe_customer_id = customer_id
                user.save(update_fields=["stripe_customer_id"])

            except stripe.error.StripeError as exc:
                logger.warning(
                    f"Failed to fetch/create Stripe customer for {user.email}: {exc}"
                )
                continue  # skip credit migration for this user

        # ---------------------------------------------------------
        # STEP 2: Migrate local DB credit → Stripe Customer Balance
        # ---------------------------------------------------------
        # Assuming your old credit field is "balance"
        if hasattr(user, "balance") and user.balance and user.balance > Decimal("0"):
            cents = int(user.balance * 100)

            try:
                stripe.Customer.create_balance_transaction(
                    customer_id,
                    amount=-cents,  # negative = credit
                    currency="usd",
                    description="Migrated credit from local 'balance' field",
                )
                logger.info(
                    f"Migrated ${user.balance} credits → Stripe for {user.email}"
                )

            except stripe.error.StripeError as exc:
                logger.warning(
                    f"Failed to migrate user {user.email} credits ({user.balance}): {exc}"
                )

        else:
            logger.info(f"User {user.email} has no local credits to migrate.")


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_user_timezone"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="stripe_customer_id",
            field=models.CharField(
                max_length=255, blank=True, null=True,
                help_text="Stripe customer identifier used for billing."
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="billing_status",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("missing", "Missing"),
                    ("invalid", "Invalid"),
                    ("valid", "Valid"),
                ],
                default="missing",
                help_text="Billing profile status.",
            ),
        ),
        migrations.RunPython(create_customers_and_migrate_credits, noop_reverse),
    ]
