from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, time, timezone as dt_timezone
from typing import Optional
from django.utils import timezone


def flatten_serializer_errors(errors) -> str:
    """
    Flatten DRF serializer.errors into a single string.

    Args:
        errors (dict): serializer.errors (field -> list of errors)

    Returns:
        str: list of errors as flat list
    """
    messages = []
    for field, field_errors in errors.items():
        # field_errors is usually a list of strings
        for err in field_errors:
            messages.append(str(err))
    return messages


def check_admin_access(user):
    """
    Check if user has admin access.

    Args:
        user: The user to check

    Returns:
        Response object with error if access denied, None otherwise
    """
    if not user.is_staff:
        return Response(
            {
                "error": "Access denied.",
                "messages": ["Admin privileges required."],
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _parse_datetime(value: str, *, is_end: bool) -> Optional[datetime]:
    """
    Parse a query parameter into a timezone-aware UTC datetime.
    Supports YYYY-MM-DD and ISO 8601 datetime strings.
    """

    if not value:
        return None

    current_tz = timezone.get_current_timezone()

    try:
        if "T" in value:
            cleaned = value.replace("Z", "+00:00")
            parsed = datetime.fromisoformat(cleaned)
            if parsed.tzinfo is None:
                parsed = timezone.make_aware(parsed, current_tz)
            return parsed.astimezone(dt_timezone.utc)

        date_only = datetime.strptime(value, "%Y-%m-%d").date()
        boundary = datetime.combine(date_only, time.max if is_end else time.min)
        aware_boundary = timezone.make_aware(boundary, current_tz)
        return aware_boundary.astimezone(dt_timezone.utc)
    except (ValueError, TypeError):
        return None


def parse_and_validate_dates(start_date_str, end_date_str, require_dates=True):
    """
    Parse and validate start and end date/datetime strings.
    Returns UTC-aware datetimes representing the inclusive boundaries.
    """

    if not require_dates and (not start_date_str or not end_date_str):
        return None, None, None

    if require_dates and (not start_date_str or not end_date_str):
        return (
            None,
            None,
            Response(
                {
                    "error": "Missing required parameters.",
                    "messages": ["Both start_date and end_date are required."],
                },
                status=status.HTTP_400_BAD_REQUEST,
            ),
        )

    start_datetime = _parse_datetime(start_date_str, is_end=False)
    end_datetime = _parse_datetime(end_date_str, is_end=True)

    if start_datetime is None or end_datetime is None:
        return (
            None,
            None,
            Response(
                {
                    "error": "Invalid date format.",
                    "messages": [
                        "Dates must be in YYYY-MM-DD format or ISO 8601 datetime."
                    ],
                },
                status=status.HTTP_400_BAD_REQUEST,
            ),
        )

    if start_datetime > end_datetime:
        return (
            None,
            None,
            Response(
                {
                    "error": "Invalid date range.",
                    "messages": ["start_date must be before or equal to end_date."],
                },
                status=status.HTTP_400_BAD_REQUEST,
            ),
        )

    return start_datetime, end_datetime, None
