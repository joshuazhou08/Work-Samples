from django.db import models
from django.conf import settings
from datetime import timedelta
from django.utils import timezone

class Charge(models.Model):
    """
    Model to store charges for tutoring sessions with Stripe integration.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        help_text="The user (client) being charged",
    )
    stripe_checkout_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Stripe checkout session ID",
    )
    amount = models.DecimalField(
        max_digits=8, decimal_places=2, help_text="Total sessions amount before credits"
    )
    credits_applied = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Credits applied to reduce the charge",
    )
    final_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Final amount after credits (amount - credits_applied)",
    )
    currency = models.CharField(
        max_length=10, default="usd", help_text="Currency code (e.g., 'usd')"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        help_text="Payment status",
    )

    # Sessions included in this charge
    sessions = models.ManyToManyField(
        "tutoring_sessions.Hours",
        related_name="charges",
        help_text="Sessions included in this charge",
    )

    class Meta:
        db_table = "tutoring_sessions_charge"  # Keep the same table name to avoid schema changes
        verbose_name = "Charge"
        verbose_name_plural = "Charges"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Charge for {self.user.get_full_name()}: ${self.final_amount} ({self.status})"

    def save(self, *args, **kwargs):
        """Auto-calculate final_amount before saving."""
        self.final_amount = self.amount - self.credits_applied
        super().save(*args, **kwargs)

def default_expiration():
    return timezone.now() + timedelta(days=7)


# For idempotency tracking of Stripe events
class StripeEvent(models.Model):
    event_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expiration)
