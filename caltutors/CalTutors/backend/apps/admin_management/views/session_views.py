from apps.sessions.models import Hours
from apps.common.views import AdminStatsViewSet
from django.utils import timezone
from decimal import Decimal
from logging import getLogger

logger = getLogger(__name__)


class AdminSessionStatsViewSet(AdminStatsViewSet):
    """
    Admin-only viewset for calculating session statistics.

    Returns:
    - total_sessions: Total number of sessions
    - completed_sessions: Number of completed sessions (past sessions)
    - upcoming_sessions: Number of upcoming sessions
    - in_progress_sessions: Number of currently in-progress sessions
    - total_hours: Total hours across all sessions
    - top_tutors: List of top 5 most active tutors
    - bottom_tutors: List of bottom 5 least active tutors
    """

    def calculate_stats(self, start_date, end_date, start_date_str, end_date_str):
        """
        Calculate session statistics for the given date range.

        Datetime filtering is performed with UTC-aware boundaries.
        """
        # Get sessions, optionally filtered by date
        sessions = Hours.objects.select_related("tutor", "student").all()

        if start_date:
            sessions = sessions.filter(start_time__gte=start_date)
        if end_date:
            sessions = sessions.filter(start_time__lte=end_date)

        # Calculate basic stats
        now = timezone.now()
        total_sessions = sessions.count()

        # Calculate completed, upcoming, and in-progress sessions
        completed_sessions = 0
        upcoming_sessions = 0
        in_progress_sessions = 0
        total_minutes = 0
        tutor_session_counts = {}

        for session in sessions:
            # Calculate session status
            session_end_time = session.end_time

            if session.start_time > now:
                # Session hasn't started yet
                upcoming_sessions += 1
            elif session.start_time <= now <= session_end_time:
                # Session is currently in progress
                in_progress_sessions += 1
            else:
                # Session has ended
                completed_sessions += 1

            # Accumulate total minutes
            total_minutes += session.duration_minutes

            # Count sessions per tutor
            tutor_id = session.tutor.id
            if tutor_id not in tutor_session_counts:
                tutor_session_counts[tutor_id] = {
                    "tutor": {
                        "id": session.tutor.id,
                        "first_name": session.tutor.first_name,
                        "last_name": session.tutor.last_name,
                        "email": session.tutor.email,
                    },
                    "session_count": 0,
                }
            tutor_session_counts[tutor_id]["session_count"] += 1

        # Calculate total hours
        total_hours = Decimal(total_minutes) / Decimal("60")

        # Sort tutors by session count
        sorted_tutors = sorted(
            tutor_session_counts.values(),
            key=lambda x: x["session_count"],
            reverse=True,
        )

        # Get top 5 and bottom 5 tutors
        top_tutors = sorted_tutors[:5] if len(sorted_tutors) > 0 else []
        bottom_tutors = (
            list(reversed(sorted_tutors[-5:])) if len(sorted_tutors) > 0 else []
        )

        # Build and return response
        return {
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "upcoming_sessions": upcoming_sessions,
            "in_progress_sessions": in_progress_sessions,
            "total_hours": str(total_hours.quantize(Decimal("0.1"))),
            "top_tutors": top_tutors,
            "bottom_tutors": bottom_tutors,
            "start_date": start_date_str,
            "end_date": end_date_str,
        }
