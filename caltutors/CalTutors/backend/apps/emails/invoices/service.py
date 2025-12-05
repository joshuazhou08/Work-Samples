from __future__ import annotations

import io
import logging
from dataclasses import asdict
from decimal import Decimal
from typing import Dict, List

from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML

from apps.accounts.models import User
from apps.payments.models import Charge

from .helpers import (
    BuildSessionResult,
    SessionLineItem,
    format_decimal,
    format_duration_hours,
    format_timezone_label,
    localize_session_time,
    resolve_timezone_name,
)

logger = logging.getLogger(__name__)
DEFAULT_INFO_SENDER = "info@caltutors.org"
PDF_FILENAME_PATTERN = "invoice_{number}.pdf"
LOGO_URL = "https://caltutors.org/logo.png"


def build_session_items(charge: Charge, timezone_name: str) -> BuildSessionResult:
    sessions = list(charge.sessions.select_related("student", "tutor").all())
    if not sessions:
        return [], Decimal("0.00"), 0

    subtotal = Decimal("0.00")
    items: List[SessionLineItem] = []
    session_count = len(sessions)

    for session in sessions:
        duration_minutes = session.duration_minutes or 0
        duration_hours = format_duration_hours(duration_minutes)

        if session.student_rate is not None:
            rate = Decimal(session.student_rate)
            line_total = rate * Decimal(duration_hours)
        else:
            line_total = Decimal(charge.amount) / Decimal(session_count)

        line_total = line_total.quantize(Decimal("0.01"))
        subtotal += line_total

        localized_start = localize_session_time(session.start_time, timezone_name)
        items.append(
            SessionLineItem(
                description=(
                    f"Tutoring for {session.student.get_full_name()} "
                    f"with {session.tutor.get_full_name()}"
                ),
                quantity=duration_hours,
                price=format_decimal(line_total),
                time=f"{localized_start.strftime('%b %d, %Y %I:%M %p')} \n"
                f"Timezone: {format_timezone_label(timezone_name)}",
            )
        )

    return items, subtotal, session_count


def build_invoice_context(charge: Charge, user: User) -> Dict[str, object]:
    timezone_name = resolve_timezone_name(getattr(user, "timezone", None))
    items, sessions_subtotal, session_count = build_session_items(charge, timezone_name)
    credits_applied = Decimal(charge.credits_applied or 0)

    if credits_applied > 0:
        items.append(
            SessionLineItem(
                description="Credits Applied",
                quantity="—",
                price=f"-{format_decimal(credits_applied)}",
                time="—",
            )
        )

    if not items:
        items.append(
            SessionLineItem(
                description="Tutoring services",
                quantity="—",
                price=format_decimal(Decimal(charge.amount)),
                time="—",
            )
        )

    invoice_number = str(charge.id)
    invoice_date = timezone.localtime(charge.created_at).strftime("%B %d, %Y")
    customer_name = user.get_full_name().strip() or user.email
    amount_due = Decimal(charge.final_amount or 0)
    if amount_due < 0:
        amount_due = Decimal("0.00")

    return {
        "number": invoice_number,
        "date": invoice_date,
        "customer_name": customer_name,
        "amount": format_decimal(amount_due),
        "items": [asdict(item) for item in items],
        "sessions_subtotal": format_decimal(sessions_subtotal),
        "credits_applied": format_decimal(credits_applied),
        "has_sessions": session_count > 0,
        "has_credits": credits_applied > 0,
        "logo_url": LOGO_URL,
        "timezone": timezone_name,
        "timezone_label": format_timezone_label(timezone_name),
    }


def render_invoice_html(context: Dict[str, object]) -> str:
    return render_to_string("invoice.html", {"invoice": context})


def generate_invoice_pdf(context: Dict[str, object]) -> bytes:
    html = render_invoice_html(context)
    buffer = io.BytesIO()
    HTML(string=html).write_pdf(buffer)
    return buffer.getvalue()


def send_invoice_email(charge: Charge, user: User) -> bool:
    if not user.email:
        logger.error("Cannot send invoice email: user %s has no email", user.id)
        return False

    try:
        context = build_invoice_context(charge, user)
        pdf_bytes = generate_invoice_pdf(context)

        subject = f"CalTutors Invoice #{context['number']}"
        greeting_name = user.first_name or context["customer_name"]
        body = (
            f"Hi {greeting_name},\n\n"
            f"Thank you for choosing CalTutors. "
            f"Your invoice #{context['number']} for "
            f"${context['amount']} is attached.\n\n"
            "Let us know if you have any questions.\n\n"
            "Best,\n"
            "The CalTutors Team"
        )

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=DEFAULT_INFO_SENDER,
            to=[user.email],
        )
        email.attach(
            filename=PDF_FILENAME_PATTERN.format(number=context["number"]),
            content=pdf_bytes,
            mimetype="application/pdf",
        )
        email.send()
        logger.info(
            "Sent invoice email for charge %s (%s) to %s",
            charge.id,
            context["number"],
            user.email,
        )
        return True
    except Exception as exc:  # pragma: no cover - network/IO heavy
        logger.exception(
            "Failed to send invoice email for charge %s to %s: %s",
            charge.id,
            user.email,
            exc,
        )
        return False
