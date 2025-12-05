import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)
DEFAULT_INFO_SENDER = "info@caltutors.org"
DEFAULT_DASHBOARD_URL = "https://caltutors.org/dashboard"


def send_info_email(recipient: str, subject: str, message: str) -> bool:
    """Send a plain-text email from the info account."""

    try:
        full_message = (
            f"{message}\n\nTo manage your account, please visit: {DEFAULT_DASHBOARD_URL}"
            "\n\nBest,\nCalTutors Team"
        )
        num_sent = send_mail(
            subject=subject,
            message=full_message,
            from_email=DEFAULT_INFO_SENDER,
            recipient_list=[recipient],
        )
        return num_sent == 1
    except Exception as exc:  # pragma: no cover - logging only
        logger.error("❌ Email send failed: %s", exc)
        return False
