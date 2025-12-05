from rest_framework import status
from django.urls import reverse
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from apps.common.test_utils import (
    AuthenticatedAPITestCase,
    assert_response_has_keys,
    assert_error_response,
)


class SessionStatsTests(AuthenticatedAPITestCase):
    """Tests for session statistics (GET /admin/session-stats/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("admin-session-stats-list")

        self.tutor1 = self.create_tutor()
        self.tutor2 = self.create_tutor()
        self.tutor3 = self.create_tutor()
        self.client_user = self.create_client_user()
        self.student1 = self.create_student(client=self.client_user)
        self.student2 = self.create_student(client=self.client_user)

        now = timezone.now()

        # Create past completed sessions
        self.completed_session1 = self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=now - timedelta(days=2, hours=2),
            duration_minutes=60,
        )
        self.completed_session2 = self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=now - timedelta(days=1, hours=2),
            duration_minutes=90,
        )
        self.completed_session3 = self.create_session(
            tutor=self.tutor2,
            student=self.student2,
            start_time=now - timedelta(days=3, hours=2),
            duration_minutes=120,
        )

        # Create upcoming sessions
        self.upcoming_session1 = self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=now + timedelta(days=1),
            duration_minutes=60,
        )
        self.upcoming_session2 = self.create_session(
            tutor=self.tutor2,
            student=self.student2,
            start_time=now + timedelta(days=2),
            duration_minutes=90,
        )

        # Create in-progress session (started 10 minutes ago, lasts 60 minutes)
        self.in_progress_session = self.create_session(
            tutor=self.tutor3,
            student=self.student1,
            start_time=now - timedelta(minutes=10),
            duration_minutes=60,
        )

    def test_admin_can_get_session_stats(self):
        """Admin should be able to get session statistics"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(
            self,
            response.data,
            "total_sessions",
            "completed_sessions",
            "upcoming_sessions",
            "in_progress_sessions",
            "total_hours",
            "top_tutors",
            "bottom_tutors",
            "start_date",
            "end_date",
        )

    def test_session_counts_are_correct(self):
        """Session counts should be calculated correctly"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_sessions"], 6)
        self.assertEqual(response.data["completed_sessions"], 3)
        self.assertEqual(response.data["upcoming_sessions"], 2)
        self.assertEqual(response.data["in_progress_sessions"], 1)

    def test_total_hours_calculated_correctly(self):
        """Total hours should be sum of all session durations / 60"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 60 + 90 + 120 + 60 + 90 + 60 = 480 minutes = 8.0 hours
        expected_hours = Decimal("480") / Decimal("60")
        self.assertEqual(
            response.data["total_hours"], str(expected_hours.quantize(Decimal("0.1")))
        )

    def test_top_tutors_ordered_correctly(self):
        """Top tutors should be ordered by session count (most active first)"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        top_tutors = response.data["top_tutors"]
        self.assertGreater(len(top_tutors), 0)

        # Tutor1 should be first (has 3 sessions)
        self.assertEqual(top_tutors[0]["tutor"]["id"], self.tutor1.id)
        self.assertEqual(top_tutors[0]["session_count"], 3)

        # Tutor2 should be second (has 2 sessions)
        self.assertEqual(top_tutors[1]["tutor"]["id"], self.tutor2.id)
        self.assertEqual(top_tutors[1]["session_count"], 2)

        # Verify counts are in descending order
        counts = [t["session_count"] for t in top_tutors]
        self.assertEqual(counts, sorted(counts, reverse=True))

    def test_bottom_tutors_ordered_correctly(self):
        """Bottom tutors should be ordered by session count (least active first)"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        bottom_tutors = response.data["bottom_tutors"]
        self.assertGreater(len(bottom_tutors), 0)

        # Tutor3 should be first (has 1 session)
        self.assertEqual(bottom_tutors[0]["tutor"]["id"], self.tutor3.id)
        self.assertEqual(bottom_tutors[0]["session_count"], 1)

        # Verify counts are in ascending order
        counts = [t["session_count"] for t in bottom_tutors]
        self.assertEqual(counts, sorted(counts))

    def test_tutor_info_structure(self):
        """Tutor info should have correct structure"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for tutor in response.data["top_tutors"]:
            assert_response_has_keys(self, tutor, "tutor", "session_count")
            assert_response_has_keys(
                self, tutor["tutor"], "id", "first_name", "last_name", "email"
            )

    def test_date_filtering_excludes_outside_sessions(self):
        """Sessions outside the date range should be excluded"""
        self.authenticate_as_admin()

        # Create a session 30 days ago
        old_session = self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=timezone.now() - timedelta(days=30),
            duration_minutes=60,
        )

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should still be 6 sessions (not 7)
        self.assertEqual(response.data["total_sessions"], 6)

    def test_missing_dates_returns_all_sessions(self):
        """Missing dates should return all sessions (all time)"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(
            self,
            response.data,
            "total_sessions",
            "completed_sessions",
            "upcoming_sessions",
            "in_progress_sessions",
            "total_hours",
            "top_tutors",
            "bottom_tutors",
        )
        # Should return all sessions
        self.assertEqual(response.data["total_sessions"], 6)

    def test_partial_date_works(self):
        """Providing only start_date or end_date should work"""
        self.authenticate_as_admin()

        # Only start_date - should return None, None, None from parse_and_validate_dates
        response = self.client.get(self.url, {"start_date": "2024-01-01"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Only end_date
        response = self.client.get(self.url, {"end_date": "2024-12-31"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_date_format_returns_error(self):
        """Invalid date format should return error"""
        self.authenticate_as_admin()

        response = self.client.get(
            self.url, {"start_date": "2024/01/01", "end_date": "2024-12-31"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "ISO 8601 datetime")

    def test_start_date_after_end_date_returns_error(self):
        """start_date after end_date should return error"""
        self.authenticate_as_admin()

        response = self.client.get(
            self.url, {"start_date": "2024-12-31", "end_date": "2024-01-01"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(
            self, response.data, "start_date must be before or equal to end_date"
        )

    def test_empty_date_range_returns_zero_stats(self):
        """Date range with no sessions should return zero stats"""
        self.authenticate_as_admin()

        future_date = (datetime.now().date() + timedelta(days=365)).isoformat()
        far_future_date = (datetime.now().date() + timedelta(days=400)).isoformat()

        response = self.client.get(
            self.url, {"start_date": future_date, "end_date": far_future_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_sessions"], 0)
        self.assertEqual(response.data["completed_sessions"], 0)
        self.assertEqual(response.data["upcoming_sessions"], 0)
        self.assertEqual(response.data["in_progress_sessions"], 0)
        self.assertEqual(response.data["total_hours"], "0.0")
        self.assertEqual(len(response.data["top_tutors"]), 0)
        self.assertEqual(len(response.data["bottom_tutors"]), 0)

    def test_tutor_cannot_access_session_stats(self):
        """Tutors should not be able to access session statistics"""
        self.authenticate_as_tutor()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)

    def test_client_cannot_access_session_stats(self):
        """Clients should not be able to access session statistics"""
        self.authenticate_as_client()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)

    def test_unauthenticated_cannot_access_session_stats(self):
        """Unauthenticated users should not be able to access session statistics"""
        self.logout()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_same_start_and_end_date(self):
        """Same start and end date should work correctly"""
        self.authenticate_as_admin()

        # Create a session today
        session_date = timezone.now().replace(
            hour=10, minute=0, second=0, microsecond=0
        )
        self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=session_date,
            duration_minutes=60,
        )

        date_str = session_date.date().isoformat()

        response = self.client.get(
            self.url, {"start_date": date_str, "end_date": date_str}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data["total_sessions"], 0)

    def test_top_tutors_limited_to_five(self):
        """Top tutors should be limited to 5 entries"""
        self.authenticate_as_admin()

        # Create more tutors to test the limit
        for i in range(10):
            tutor = self.create_tutor()
            self.create_session(
                tutor=tutor,
                student=self.student1,
                start_time=timezone.now() - timedelta(days=1),
                duration_minutes=60,
            )

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data["top_tutors"]), 5)

    def test_bottom_tutors_limited_to_five(self):
        """Bottom tutors should be limited to 5 entries"""
        self.authenticate_as_admin()

        # Create more tutors to test the limit
        for i in range(10):
            tutor = self.create_tutor()
            self.create_session(
                tutor=tutor,
                student=self.student1,
                start_time=timezone.now() - timedelta(days=1),
                duration_minutes=60,
            )

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data["bottom_tutors"]), 5)

    def test_decimal_precision_maintained(self):
        """Total hours should maintain proper precision (1 decimal place)"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        total_hours = Decimal(response.data["total_hours"])
        # Check that it has at most 1 decimal place
        self.assertLessEqual(abs(total_hours.as_tuple().exponent), 1)

    def test_no_sessions_returns_zero_hours(self):
        """When there are no sessions, total_hours should be 0.0"""
        self.authenticate_as_admin()

        # Query a date range with no sessions
        future_date = (datetime.now().date() + timedelta(days=365)).isoformat()
        far_future_date = (datetime.now().date() + timedelta(days=400)).isoformat()

        response = self.client.get(
            self.url, {"start_date": future_date, "end_date": far_future_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_hours"], "0.0")

    def test_date_params_included_in_response(self):
        """The provided date parameters should be included in the response"""
        self.authenticate_as_admin()

        start_date = "2024-01-01"
        end_date = "2024-12-31"

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["start_date"], start_date)
        self.assertEqual(response.data["end_date"], end_date)

    def test_none_dates_when_not_provided(self):
        """When dates are not provided, they should be None in response"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["start_date"])
        self.assertIsNone(response.data["end_date"])
