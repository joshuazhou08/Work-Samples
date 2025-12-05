from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone

TIMEZONE_LABELS: Dict[str, str] = {
    "America/New_York": "Eastern (EST)",
    "America/Chicago": "Central (CST)",
    "America/Denver": "Mountain (MST)",
    "America/Los_Angeles": "Pacific (PST)",
    "America/Anchorage": "Alaska (AKST)",
    "Pacific/Honolulu": "Hawaii-Aleutian (HST)",
}


def format_decimal(amount: Decimal) -> str:
    return f"{amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):.2f}"


def format_duration_hours(minutes: int) -> str:
    hours = (Decimal(minutes) / Decimal("60")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    return f"{hours:.2f}"


def resolve_timezone_name(user_timezone: str | None) -> str:
    return user_timezone or settings.TIME_ZONE


def format_timezone_label(timezone_name: str) -> str:
    return TIMEZONE_LABELS.get(timezone_name, timezone_name)


def localize_session_time(session_start, timezone_name: str):
    if not timezone_name:
        return timezone.localtime(session_start)

    try:
        target_zone = ZoneInfo(timezone_name)
        return session_start.astimezone(target_zone)
    except Exception:  # pragma: no cover - defensive fallback
        return timezone.localtime(session_start)


@dataclass
class SessionLineItem:
    description: str
    quantity: str
    price: str
    time: str


BuildSessionResult = Tuple[List[SessionLineItem], Decimal, int]
