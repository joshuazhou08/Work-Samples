from rest_framework import status
from django.urls import reverse
from apps.common.test_utils import (
    AuthenticatedAPITestCase,
    assert_response_has_keys,
    assert_error_response,
)


class StudentRatesTests(AuthenticatedAPITestCase):
    """Tests for student rates endpoint (GET /sessions/rates/student/{student_id}/)"""

    def setUp(self):
        super().setUp()
        # Create test data
        self.client1 = self.create_client_user()
        self.client2 = self.create_client_user()
        self.tutor1 = self.create_tutor()
        self.tutor2 = self.create_tutor()

        # Create students
        self.student1 = self.create_student(client=self.client1)
        self.student2 = self.create_student(client=self.client2)

        # Create rates
        self.rate1 = self.create_rate(
            tutor=self.tutor1,
            student=self.student1,
            student_rate="60.00",
            tutor_pay_rate="40.00",
        )
        self.rate2 = self.create_rate(
            tutor=self.tutor2,
            student=self.student1,
            student_rate="70.00",
            tutor_pay_rate="45.00",
        )
        self.rate3 = self.create_rate(
            tutor=self.tutor1,
            student=self.student2,
            student_rate="65.00",
            tutor_pay_rate="42.00",
        )

        self.url1 = reverse("student-rates", kwargs={"student_id": self.student1.id})
        self.url2 = reverse("student-rates", kwargs={"student_id": self.student2.id})

    def test_admin_can_view_student_rates(self):
        """Admin should be able to view any student's rates"""
        self.authenticate_as_admin()
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # student1 has 2 rates

    def test_client_can_view_own_student_rates(self):
        """Client should be able to view their own student's rates"""
        self.authenticate_as(self.client1)
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # Verify the rates belong to the correct student
        for rate in response.data:
            self.assertEqual(rate["student"], self.student1.id)

    def test_client_cannot_view_other_client_student_rates(self):
        """Client should not be able to view another client's student's rates"""
        self.authenticate_as(self.client1)
        response = self.client.get(self.url2)  # Try to access client2's student

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(
            self, response.data, "only view rates for your own students"
        )

    def test_tutor_cannot_view_student_rates(self):
        """Tutors should not be able to view student rates"""
        self.authenticate_as_tutor()
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Only admins and clients can view")

    def test_nonexistent_student_returns_404(self):
        """Requesting rates for a nonexistent student should return 404"""
        self.authenticate_as_admin()
        url = reverse("student-rates", kwargs={"student_id": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        assert_error_response(self, response.data, "Student not found")

    def test_unauthenticated_cannot_access_student_rates(self):
        """Unauthenticated users should not be able to access student rates"""
        self.logout()
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_with_no_rates_returns_empty_list(self):
        """Student with no rates should return an empty list"""
        self.authenticate_as_admin()
        student_no_rates = self.create_student(client=self.client1)
        url = reverse("student-rates", kwargs={"student_id": student_no_rates.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)


class TutorRatesTests(AuthenticatedAPITestCase):
    """Tests for tutor rates endpoint (GET /sessions/rates/tutor/{tutor_id}/)"""

    def setUp(self):
        super().setUp()
        # Create test data
        self.client1 = self.create_client_user()
        self.tutor1 = self.create_tutor()
        self.tutor2 = self.create_tutor()

        # Create students
        self.student1 = self.create_student(client=self.client1)
        self.student2 = self.create_student(client=self.client1)

        # Create rates
        self.rate1 = self.create_rate(
            tutor=self.tutor1,
            student=self.student1,
            student_rate="60.00",
            tutor_pay_rate="40.00",
        )
        self.rate2 = self.create_rate(
            tutor=self.tutor1,
            student=self.student2,
            student_rate="65.00",
            tutor_pay_rate="42.00",
        )
        self.rate3 = self.create_rate(
            tutor=self.tutor2,
            student=self.student1,
            student_rate="70.00",
            tutor_pay_rate="45.00",
        )

        self.url1 = reverse("tutor-rates", kwargs={"tutor_id": self.tutor1.id})
        self.url2 = reverse("tutor-rates", kwargs={"tutor_id": self.tutor2.id})

    def test_admin_can_view_tutor_rates(self):
        """Admin should be able to view any tutor's rates"""
        self.authenticate_as_admin()
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # tutor1 has 2 rates

    def test_tutor_can_view_own_rates(self):
        """Tutor should be able to view their own rates"""
        self.authenticate_as(self.tutor1)
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # Verify all rates belong to the correct tutor
        for rate in response.data:
            self.assertEqual(rate["tutor"], self.tutor1.id)

    def test_tutor_cannot_view_other_tutor_rates(self):
        """Tutor should not be able to view another tutor's rates"""
        self.authenticate_as(self.tutor1)
        response = self.client.get(self.url2)  # Try to access tutor2's rates

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "only view your own rates")

    def test_client_cannot_view_tutor_rates(self):
        """Clients should not be able to view tutor rates"""
        self.authenticate_as_client()
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "only view your own rates")

    def test_nonexistent_tutor_returns_404(self):
        """Requesting rates for a nonexistent tutor should return 404"""
        self.authenticate_as_admin()
        url = reverse("tutor-rates", kwargs={"tutor_id": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        assert_error_response(self, response.data, "Tutor not found")

    def test_non_tutor_user_returns_404(self):
        """Requesting rates for a non-tutor user should return 404"""
        self.authenticate_as_admin()
        # Try to get rates for a client user (not a tutor)
        url = reverse("tutor-rates", kwargs={"tutor_id": self.client1.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        assert_error_response(self, response.data, "Tutor not found")

    def test_unauthenticated_cannot_access_tutor_rates(self):
        """Unauthenticated users should not be able to access tutor rates"""
        self.logout()
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tutor_with_no_rates_returns_empty_list(self):
        """Tutor with no rates should return an empty list"""
        self.authenticate_as_admin()
        tutor_no_rates = self.create_tutor()
        url = reverse("tutor-rates", kwargs={"tutor_id": tutor_no_rates.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_rate_serialization_includes_required_fields(self):
        """Verify that rate data includes all required fields"""
        self.authenticate_as_admin()
        response = self.client.get(self.url1)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Check first rate has required fields
        rate = response.data[0]
        assert_response_has_keys(
            self, rate, "id", "student", "tutor", "student_rate", "tutor_pay_rate"
        )
