from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from apps.common.test_utils import (
    AuthenticatedAPITestCase,
    assert_response_has_keys,
    assert_error_response,
)


class HoursListTests(AuthenticatedAPITestCase):
    """Tests for listing sessions (GET /sessions/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("hours-list")

        # Create test data
        self.client1 = self.create_client_user()
        self.tutor1 = self.create_tutor()
        self.tutor2 = self.create_tutor()

        self.student1 = self.create_student(client=self.client1)
        self.student2 = self.create_student(client=self.client1)

        # Create sessions
        self.session1 = self.create_session(
            tutor=self.tutor1, student=self.student1, duration_minutes=60
        )
        self.session2 = self.create_session(
            tutor=self.tutor2, student=self.student2, duration_minutes=90
        )

    def test_admin_can_list_all_sessions(self):
        """Admin should be able to list all sessions"""
        self.authenticate_as_admin()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)

    def test_tutor_can_list_own_sessions(self):
        """Tutor should only see their own sessions"""
        self.authenticate_as(self.tutor1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["tutor"], self.tutor1.id)

    def test_client_can_list_own_students_sessions(self):
        """Client should only see sessions for their students"""
        self.authenticate_as(self.client1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_sessions_filtered_by_tutor(self):
        """Should filter sessions by tutor_id"""
        self.authenticate_as_admin()
        response = self.client.get(self.url, {"tutor_id": self.tutor1.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["tutor"], self.tutor1.id)

    def test_list_sessions_filtered_by_student(self):
        """Should filter sessions by student_id"""
        self.authenticate_as_admin()
        response = self.client.get(self.url, {"student_id": self.student1.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["student"], self.student1.id)

    def test_list_sessions_filtered_by_client(self):
        """Should filter sessions by client_id"""
        self.authenticate_as_admin()
        response = self.client.get(self.url, {"client_id": self.client1.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_unauthenticated_cannot_list_sessions(self):
        """Unauthenticated users should not be able to list sessions"""
        self.logout()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HoursCreateTests(AuthenticatedAPITestCase):
    """Tests for creating sessions (POST /sessions/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("hours-list")

        self.client_user = self.create_client_user()
        self.tutor_user = self.create_tutor()
        self.student = self.create_student(client=self.client_user)

    def test_tutor_can_create_session(self):
        """Tutor should be able to create a session"""
        self.authenticate_as(self.tutor_user)
        start_time = timezone.now() + timedelta(hours=1)
        data = {
            "tutor": self.tutor_user.id,
            "student": self.student.id,
            "start_time": start_time.isoformat(),
            "duration_minutes": 60,
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        assert_response_has_keys(
            self, response.data, "id", "tutor", "student", "duration_minutes"
        )

    def test_admin_can_create_session(self):
        """Admin should be able to create a session"""
        self.authenticate_as_admin()
        start_time = timezone.now() + timedelta(hours=1)
        data = {
            "tutor": self.tutor_user.id,
            "student": self.student.id,
            "start_time": start_time.isoformat(),
            "duration_minutes": 90,
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_client_cannot_create_session(self):
        """Clients should not be able to create sessions"""
        self.authenticate_as_client()
        start_time = timezone.now() + timedelta(hours=1)
        data = {
            "tutor": self.tutor_user.id,
            "student": self.student.id,
            "start_time": start_time.isoformat(),
            "duration_minutes": 60,
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(
            self, response.data, "Only tutors and admins can create sessions"
        )

    def test_create_session_with_invalid_data(self):
        """Creating a session with invalid data should fail with proper error structure"""
        self.authenticate_as(self.tutor_user)
        data = {
            "tutor": self.tutor_user.id,
            "student": self.student.id,
            "start_time": "invalid-date",
            "duration_minutes": 60,
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Session creation failed")

    def test_unauthenticated_cannot_create_session(self):
        """Unauthenticated users should not be able to create sessions"""
        self.logout()
        start_time = timezone.now() + timedelta(hours=1)
        data = {
            "tutor": self.tutor_user.id,
            "student": self.student.id,
            "start_time": start_time.isoformat(),
            "duration_minutes": 60,
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HoursRetrieveTests(AuthenticatedAPITestCase):
    """Tests for retrieving a single session (GET /sessions/{id}/)"""

    def setUp(self):
        super().setUp()
        self.client_user = self.create_client_user()
        self.tutor_user = self.create_tutor()
        self.student = self.create_student(client=self.client_user)
        self.session = self.create_session(
            tutor=self.tutor_user, student=self.student, duration_minutes=60
        )
        self.url = reverse("hours-detail", kwargs={"pk": self.session.id})

    def test_admin_can_retrieve_any_session(self):
        """Admin should be able to retrieve any session"""
        self.authenticate_as_admin()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.session.id)

    def test_tutor_can_retrieve_own_session(self):
        """Tutor should be able to retrieve their own session"""
        self.authenticate_as(self.tutor_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["tutor"], self.tutor_user.id)

    def test_client_can_retrieve_own_student_session(self):
        """Client should be able to retrieve their student's session"""
        self.authenticate_as(self.client_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["student"], self.student.id)

    def test_tutor_cannot_retrieve_other_tutor_session(self):
        """Tutor should not be able to retrieve another tutor's session"""
        other_tutor = self.create_tutor()
        self.authenticate_as(other_tutor)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "permission to access this session")

    def test_retrieve_nonexistent_session(self):
        """Retrieving a nonexistent session should return 404"""
        self.authenticate_as_admin()
        url = reverse("hours-detail", kwargs={"pk": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_cannot_retrieve_session(self):
        """Unauthenticated users should not be able to retrieve sessions"""
        self.logout()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HoursUpdateTests(AuthenticatedAPITestCase):
    """Tests for updating sessions (PUT/PATCH /sessions/{id}/)"""

    def setUp(self):
        super().setUp()
        self.client_user = self.create_client_user()
        self.tutor_user = self.create_tutor()
        self.student = self.create_student(client=self.client_user)
        self.session = self.create_session(
            tutor=self.tutor_user, student=self.student, duration_minutes=60
        )
        self.url = reverse("hours-detail", kwargs={"pk": self.session.id})

    def test_tutor_can_update_own_session(self):
        """Tutor should be able to update their own session"""
        self.authenticate_as(self.tutor_user)
        data = {"duration_minutes": 90}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["duration_minutes"], 90)

    def test_admin_can_update_any_session(self):
        """Admin should be able to update any session"""
        self.authenticate_as_admin()
        data = {"duration_minutes": 120}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["duration_minutes"], 120)

    def test_client_cannot_update_session(self):
        """Clients should not be able to update sessions"""
        self.authenticate_as(self.client_user)
        data = {"duration_minutes": 90}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Only the tutor or admin can modify")

    def test_tutor_cannot_update_other_tutor_session(self):
        """Tutor should not be able to update another tutor's session"""
        other_tutor = self.create_tutor()
        self.authenticate_as(other_tutor)
        data = {"duration_minutes": 90}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_nonexistent_session(self):
        """Updating a nonexistent session should return 404"""
        self.authenticate_as_admin()
        url = reverse("hours-detail", kwargs={"pk": 99999})
        data = {"duration_minutes": 90}

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_with_invalid_data(self):
        """Updating with invalid data should return proper error structure"""
        self.authenticate_as(self.tutor_user)
        data = {"duration_minutes": -10}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Session update failed")


class HoursDeleteTests(AuthenticatedAPITestCase):
    """Tests for deleting sessions (DELETE /sessions/{id}/)"""

    def setUp(self):
        super().setUp()
        self.client_user = self.create_client_user()
        self.tutor_user = self.create_tutor()
        self.student = self.create_student(client=self.client_user)
        self.session = self.create_session(
            tutor=self.tutor_user, student=self.student, duration_minutes=60
        )
        self.url = reverse("hours-detail", kwargs={"pk": self.session.id})

    def test_tutor_can_delete_own_session(self):
        """Tutor should be able to delete their own session"""
        self.authenticate_as(self.tutor_user)
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "message")

    def test_admin_can_delete_any_session(self):
        """Admin should be able to delete any session"""
        self.authenticate_as_admin()
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "message")

    def test_client_cannot_delete_session(self):
        """Clients should not be able to delete sessions"""
        self.authenticate_as(self.client_user)
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Only the tutor or admin can modify")

    def test_tutor_cannot_delete_other_tutor_session(self):
        """Tutor should not be able to delete another tutor's session"""
        other_tutor = self.create_tutor()
        self.authenticate_as(other_tutor)
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_nonexistent_session(self):
        """Deleting a nonexistent session should return 404"""
        self.authenticate_as_admin()
        url = reverse("hours-detail", kwargs={"pk": 99999})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MyUpcomingSessionsTests(AuthenticatedAPITestCase):
    """Tests for my-upcoming-sessions endpoint (GET /sessions/my-upcoming/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("hours-my-upcoming-sessions")

        self.client_user = self.create_client_user()
        self.tutor_user = self.create_tutor()
        self.student = self.create_student(client=self.client_user)

        # Create past and future sessions
        past_time = timezone.now() - timedelta(hours=2)
        future_time = timezone.now() + timedelta(hours=2)

        self.past_session = self.create_session(
            tutor=self.tutor_user,
            student=self.student,
            start_time=past_time,
            duration_minutes=60,
        )
        self.future_session = self.create_session(
            tutor=self.tutor_user,
            student=self.student,
            start_time=future_time,
            duration_minutes=60,
        )

    def test_tutor_sees_own_upcoming_sessions(self):
        """Tutor should see their own upcoming sessions only"""
        self.authenticate_as(self.tutor_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.future_session.id)

    def test_client_sees_own_students_upcoming_sessions(self):
        """Client should see their students' upcoming sessions"""
        self.authenticate_as(self.client_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.future_session.id)

    def test_tutor_without_upcoming_sessions_sees_empty_list(self):
        """Tutor with no upcoming sessions should see empty list"""
        other_tutor = self.create_tutor()
        self.authenticate_as(other_tutor)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_unauthenticated_cannot_access_upcoming_sessions(self):
        """Unauthenticated users should not be able to access upcoming sessions"""
        self.logout()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SessionStatsTests(AuthenticatedAPITestCase):
    """Tests for session stats endpoint (GET /sessions/stats/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("hours-session-stats")

        self.client_user = self.create_client_user()
        self.tutor_user = self.create_tutor()
        self.student = self.create_student(client=self.client_user)

        # Create sessions
        past_time = timezone.now() - timedelta(hours=2)
        future_time = timezone.now() + timedelta(hours=2)

        self.past_session = self.create_session(
            tutor=self.tutor_user,
            student=self.student,
            start_time=past_time,
            duration_minutes=60,
        )
        self.future_session = self.create_session(
            tutor=self.tutor_user,
            student=self.student,
            start_time=future_time,
            duration_minutes=90,
        )

    def test_tutor_gets_correct_stats(self):
        """Tutor should get correct session statistics"""
        self.authenticate_as(self.tutor_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(
            self,
            response.data,
            "total_sessions",
            "upcoming_sessions",
            "past_sessions",
            "total_hours",
            "sessions_as_tutor",
            "sessions_as_student",
        )
        self.assertEqual(response.data["total_sessions"], 2)
        self.assertEqual(response.data["upcoming_sessions"], 1)
        self.assertEqual(response.data["sessions_as_tutor"], 2)

    def test_client_gets_correct_stats(self):
        """Client should get correct session statistics for their students"""
        self.authenticate_as(self.client_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_sessions"], 2)
        self.assertEqual(response.data["sessions_as_student"], 2)
        self.assertEqual(response.data["sessions_as_tutor"], 0)

    def test_user_without_sessions_gets_zero_stats(self):
        """User without sessions should get all zeros"""
        other_tutor = self.create_tutor()
        self.authenticate_as(other_tutor)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_sessions"], 0)
        self.assertEqual(response.data["upcoming_sessions"], 0)
        self.assertEqual(response.data["past_sessions"], 0)

    def test_unauthenticated_cannot_access_stats(self):
        """Unauthenticated users should not be able to access session stats"""
        self.logout()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AvailableStudentsTests(AuthenticatedAPITestCase):
    """Tests for available students endpoint (GET /sessions/available-students/) used to create sessions with the right students"""

    def setUp(self):
        super().setUp()
        self.url = reverse("hours-available-students")

        self.tutor1 = self.create_tutor()
        self.tutor2 = self.create_tutor()
        self.client1 = self.create_client_user()

        self.student1 = self.create_student(client=self.client1)
        self.student2 = self.create_student(client=self.client1)
        self.student3 = self.create_student(client=self.client1)

        self.rate1 = self.create_rate(tutor=self.tutor1, student=self.student1)
        self.rate2 = self.create_rate(tutor=self.tutor1, student=self.student2)
        self.rate3 = self.create_rate(tutor=self.tutor2, student=self.student3)

    def test_tutor_sees_only_students_with_rates(self):
        """Tutor should only see students they have rates with"""
        self.authenticate_as(self.tutor1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "students")
        self.assertEqual(len(response.data["students"]), 2)

        student_ids = [s["id"] for s in response.data["students"]]
        self.assertIn(self.student1.id, student_ids)
        self.assertIn(self.student2.id, student_ids)
        self.assertNotIn(self.student3.id, student_ids)

    def test_different_tutors_see_different_students(self):
        """Different tutors should see only their own students"""
        self.authenticate_as(self.tutor2)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["students"]), 1)

        student_ids = [s["id"] for s in response.data["students"]]
        self.assertIn(self.student3.id, student_ids)
        self.assertNotIn(self.student1.id, student_ids)

    def test_response_includes_student_info(self):
        """Response should include student and client information"""
        self.authenticate_as(self.tutor1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student = response.data["students"][0]
        assert_response_has_keys(
            self, student, "id", "first_name", "last_name", "email", "client_name"
        )

    def test_inactive_students_not_included(self):
        """Inactive students should not be included"""
        self.student1.is_active = False
        self.student1.save()

        self.authenticate_as(self.tutor1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["students"]), 1)

        student_ids = [s["id"] for s in response.data["students"]]
        self.assertNotIn(self.student1.id, student_ids)
        self.assertIn(self.student2.id, student_ids)

    def test_tutor_with_no_rates_sees_empty_list(self):
        """Tutor with no rates should see empty list"""
        tutor_no_rates = self.create_tutor()
        self.authenticate_as(tutor_no_rates)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["students"]), 0)

    def test_admin_cannot_access_endpoint(self):
        """Admin should not be able to access this endpoint"""
        self.authenticate_as_admin()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Only tutors can access")

    def test_client_cannot_access_endpoint(self):
        """Clients should not be able to access this endpoint"""
        self.authenticate_as_client()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Only tutors can access")

    def test_unauthenticated_cannot_access(self):
        """Unauthenticated users should not be able to access"""
        self.logout()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
