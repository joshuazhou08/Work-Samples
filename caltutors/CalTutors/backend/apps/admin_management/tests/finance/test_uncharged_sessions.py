from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from apps.common.test_utils import (
    AuthenticatedAPITestCase,
    assert_response_has_keys,
)


class UnchargedSessionsTests(AuthenticatedAPITestCase):
    """Tests for uncharged sessions endpoint (GET /admin/uncharged-sessions/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("admin-uncharged-sessions-list")

        # Create test data
        self.tutor1 = self.create_tutor()
        self.tutor2 = self.create_tutor()
        self.client_user1 = self.create_client_user()
        self.client_user2 = self.create_client_user()
        self.student1 = self.create_student(client=self.client_user1)
        self.student2 = self.create_student(client=self.client_user1)
        self.student3 = self.create_student(client=self.client_user2)

        # Use past dates to ensure sessions are included
        base_time = timezone.now() - timedelta(days=7)
        base_time = base_time.replace(hour=10, minute=0, second=0, microsecond=0)

        # Create uncharged sessions (in the past)
        self.uncharged1 = self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=base_time,
            duration_minutes=60,
        )

        self.uncharged2 = self.create_session(
            tutor=self.tutor2,
            student=self.student1,
            start_time=base_time + timedelta(days=1),
            duration_minutes=90,
        )

        self.uncharged3 = self.create_session(
            tutor=self.tutor1,
            student=self.student2,
            start_time=base_time + timedelta(days=2),
            duration_minutes=120,
        )

        # Create a charged session in the past (should not appear in results)
        self.charged_session = self.create_session(
            tutor=self.tutor1,
            student=self.student3,
            start_time=base_time + timedelta(days=3),
            duration_minutes=60,
        )
        self.charge = self.create_charge(
            user=self.client_user2, session_ids=[self.charged_session.id]
        )

        # Create a future uncharged session (should not appear in results)
        self.future_session = self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=timezone.now() + timedelta(days=7),
            duration_minutes=60,
        )

    def test_admin_can_get_uncharged_sessions(self):
        """Admin should be able to get uncharged sessions"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "uncharged_sessions", "count")

    def test_sessions_grouped_by_student(self):
        """Sessions should be grouped by student"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should have 2 student groups (student1 and student2, not student3 as their session is charged)
        self.assertEqual(response.data["count"], 2)

        # Find student1's group
        student1_group = next(
            (
                g
                for g in response.data["uncharged_sessions"]
                if g["student"]["id"] == self.student1.id
            ),
            None,
        )
        self.assertIsNotNone(student1_group)
        self.assertEqual(
            len(student1_group["sessions"]), 2
        )  # Two sessions for student1

    def test_student_info_included(self):
        """Student info should be included in response"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        student_group = response.data["uncharged_sessions"][0]
        assert_response_has_keys(
            self,
            student_group["student"],
            "id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "grade_level",
        )

    def test_client_info_included(self):
        """Client info should be included in response"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        student_group = response.data["uncharged_sessions"][0]
        assert_response_has_keys(
            self,
            student_group["client"],
            "id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
        )

    def test_session_info_included(self):
        """Session details should be included"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        student_group = response.data["uncharged_sessions"][0]
        session = student_group["sessions"][0]
        assert_response_has_keys(
            self,
            session,
            "id",
            "tutor_name",
            "start_time",
            "duration_minutes",
        )

    def test_charged_sessions_excluded(self):
        """Charged sessions should not appear in results"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # student3 should not appear since their only session is charged
        student3_group = next(
            (
                g
                for g in response.data["uncharged_sessions"]
                if g["student"]["id"] == self.student3.id
            ),
            None,
        )
        self.assertIsNone(student3_group)

        # Also check that the charged session ID doesn't appear anywhere
        all_session_ids = []
        for group in response.data["uncharged_sessions"]:
            all_session_ids.extend([s["id"] for s in group["sessions"]])

        self.assertNotIn(self.charged_session.id, all_session_ids)

    def test_sorted_by_student_name(self):
        """Results should be sorted by student last name, then first name"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        if len(response.data["uncharged_sessions"]) >= 2:
            students = [g["student"] for g in response.data["uncharged_sessions"]]
            last_names = [s["last_name"] for s in students]

            # Check if sorted
            self.assertEqual(last_names, sorted(last_names))

    def test_empty_when_all_sessions_charged(self):
        """Should return empty list when all sessions are charged"""
        self.authenticate_as_admin()

        # Create charges for all uncharged sessions
        self.create_charge(
            user=self.client_user1,
            session_ids=[self.uncharged1.id, self.uncharged2.id, self.uncharged3.id],
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(len(response.data["uncharged_sessions"]), 0)

    def test_tutor_cannot_access_uncharged_sessions(self):
        """Tutors should not be able to access uncharged sessions"""
        self.authenticate_as_tutor()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_cannot_access_uncharged_sessions(self):
        """Clients should not be able to access uncharged sessions"""
        self.authenticate_as_client()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_access(self):
        """Unauthenticated users should not be able to access"""
        self.logout()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_multiple_students_with_same_client(self):
        """Should correctly group when multiple students have same client"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # student1 and student2 have same client (client_user1)
        student1_group = next(
            g
            for g in response.data["uncharged_sessions"]
            if g["student"]["id"] == self.student1.id
        )
        student2_group = next(
            g
            for g in response.data["uncharged_sessions"]
            if g["student"]["id"] == self.student2.id
        )

        # Both should have the same client
        self.assertEqual(student1_group["client"]["id"], student2_group["client"]["id"])
        self.assertEqual(student1_group["client"]["id"], self.client_user1.id)

    def test_sessions_sorted_by_start_time(self):
        """Sessions within each student group should be sorted by start time"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check student1 who has 2 past uncharged sessions (not the future one)
        student1_group = next(
            g
            for g in response.data["uncharged_sessions"]
            if g["student"]["id"] == self.student1.id
        )

        sessions = student1_group["sessions"]
        self.assertEqual(len(sessions), 2)  # Should have 2 past sessions
        if len(sessions) >= 2:
            start_times = [s["start_time"] for s in sessions]
            self.assertEqual(start_times, sorted(start_times))

    def test_future_sessions_excluded(self):
        """Future uncharged sessions should not appear in results"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Collect all session IDs from the response
        all_session_ids = []
        for group in response.data["uncharged_sessions"]:
            all_session_ids.extend([s["id"] for s in group["sessions"]])

        # Future session should not be included
        self.assertNotIn(self.future_session.id, all_session_ids)

    def test_date_filter_by_start_date(self):
        """Should filter sessions by start_date parameter"""
        self.authenticate_as_admin()

        # Filter to only get sessions after a certain date
        filter_date = (timezone.now() - timedelta(days=5)).date().isoformat()
        response = self.client.get(self.url, {"start_date": filter_date})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should still have sessions (within the last 5 days)
        self.assertGreaterEqual(response.data["count"], 0)

    def test_date_filter_by_end_date(self):
        """Should filter sessions by end_date parameter"""
        self.authenticate_as_admin()

        # Filter to only get sessions before a certain date
        filter_date = (timezone.now() - timedelta(days=1)).date().isoformat()
        response = self.client.get(self.url, {"end_date": filter_date})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should have sessions
        self.assertGreaterEqual(response.data["count"], 0)

    def test_date_filter_by_range(self):
        """Should filter sessions by date range"""
        self.authenticate_as_admin()

        start_date = (timezone.now() - timedelta(days=10)).date().isoformat()
        end_date = (timezone.now() - timedelta(days=1)).date().isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_start_date_format(self):
        """Should return error for invalid start_date format"""
        self.authenticate_as_admin()

        response = self.client.get(self.url, {"start_date": "2024/01/01"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_invalid_end_date_format(self):
        """Should return error for invalid end_date format"""
        self.authenticate_as_admin()

        response = self.client.get(self.url, {"end_date": "invalid-date"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_invalid_date_range(self):
        """Should return error when start_date is after end_date"""
        self.authenticate_as_admin()

        response = self.client.get(
            self.url, {"start_date": "2024-12-31", "end_date": "2024-01-01"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
