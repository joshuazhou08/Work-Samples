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


class TutorPaymentStatsTests(AuthenticatedAPITestCase):
    """Tests for tutor payment statistics (GET /admin/tutor-payments/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("admin-tutor-payments-list")

        self.tutor1 = self.create_tutor()
        self.tutor2 = self.create_tutor()
        self.client_user = self.create_client_user()
        self.student1 = self.create_student(client=self.client_user)
        self.student2 = self.create_student(client=self.client_user)

        self.rate1 = self.create_rate(
            tutor=self.tutor1,
            student=self.student1,
            student_rate="60.00",
            tutor_pay_rate="40.00",
        )
        self.rate2 = self.create_rate(
            tutor=self.tutor2,
            student=self.student2,
            student_rate="80.00",
            tutor_pay_rate="50.00",
        )

        base_time = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)

        self.session1 = self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=base_time,
            duration_minutes=60,
        )

        self.session2 = self.create_session(
            tutor=self.tutor1,
            student=self.student1,
            start_time=base_time + timedelta(days=1),
            duration_minutes=90,
        )

        self.session3 = self.create_session(
            tutor=self.tutor2,
            student=self.student2,
            start_time=base_time + timedelta(days=2),
            duration_minutes=120,
        )

    def test_admin_can_get_tutor_payments(self):
        """Admin should be able to get tutor payment statistics"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "tutor_payments", "count")
        self.assertEqual(response.data["count"], 2)

    def test_tutor_payment_calculation_correct(self):
        """Payment calculations should be correct: (duration/60) * tutor_pay_rate"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        tutor1_data = next(
            (
                t
                for t in response.data["tutor_payments"]
                if t["tutor"]["id"] == self.tutor1.id
            ),
            None,
        )
        self.assertIsNotNone(tutor1_data)

        expected_amount = (
            (Decimal("60") / Decimal("60")) * Decimal("40.00")
            + (Decimal("90") / Decimal("60")) * Decimal("40.00")
        ).quantize(Decimal("0.01"))
        self.assertEqual(tutor1_data["total_amount"], str(expected_amount))
        self.assertEqual(tutor1_data["session_count"], 2)

    def test_multiple_tutors_aggregated_separately(self):
        """Each tutor's payments should be aggregated separately"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["tutor_payments"]), 2)

        tutor1_data = next(
            t
            for t in response.data["tutor_payments"]
            if t["tutor"]["id"] == self.tutor1.id
        )
        tutor2_data = next(
            t
            for t in response.data["tutor_payments"]
            if t["tutor"]["id"] == self.tutor2.id
        )

        self.assertEqual(tutor1_data["session_count"], 2)
        self.assertEqual(tutor2_data["session_count"], 1)

        tutor2_expected = (
            (Decimal("120") / Decimal("60")) * Decimal("50.00")
        ).quantize(Decimal("0.01"))
        self.assertEqual(tutor2_data["total_amount"], str(tutor2_expected))

    def test_session_details_included(self):
        """Response should include detailed session information"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        tutor1_data = next(
            t
            for t in response.data["tutor_payments"]
            if t["tutor"]["id"] == self.tutor1.id
        )

        self.assertEqual(len(tutor1_data["sessions"]), 2)

        session_data = tutor1_data["sessions"][0]
        assert_response_has_keys(
            self,
            session_data,
            "id",
            "student_name",
            "start_time",
            "duration_minutes",
            "tutor_name",
            "student_rate",
            "student_charge",
            "tutor_rate",
            "tutor_payment",
            "tutor_pay_rate",
            "session_amount",
        )

    def test_date_filtering_excludes_outside_sessions(self):
        """Sessions outside the date range should be excluded"""
        self.authenticate_as_admin()

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

        tutor1_data = next(
            t
            for t in response.data["tutor_payments"]
            if t["tutor"]["id"] == self.tutor1.id
        )

        self.assertEqual(tutor1_data["session_count"], 2)
        session_ids = [s["id"] for s in tutor1_data["sessions"]]
        self.assertNotIn(old_session.id, session_ids)

    def test_session_without_rate_handled_gracefully(self):
        """Sessions without a rate should be included with 0.00 rate"""
        self.authenticate_as_admin()

        student_no_rate = self.create_student(client=self.client_user)

        session_no_rate = self.create_session(
            tutor=self.tutor1,
            student=student_no_rate,
            start_time=timezone.now(),
            duration_minutes=60,
        )

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        tutor1_data = next(
            t
            for t in response.data["tutor_payments"]
            if t["tutor"]["id"] == self.tutor1.id
        )

        no_rate_session = next(
            s for s in tutor1_data["sessions"] if s["id"] == session_no_rate.id
        )
        self.assertEqual(no_rate_session["student_rate"], "0.00")
        self.assertEqual(no_rate_session["student_charge"], "0.00")
        self.assertEqual(no_rate_session["tutor_rate"], "0.00")
        self.assertEqual(no_rate_session["tutor_payment"], "0.00")
        self.assertEqual(no_rate_session["tutor_pay_rate"], "0.00")
        self.assertEqual(no_rate_session["session_amount"], "0.00")

    def test_missing_dates_returns_all_payments(self):
        """Missing dates should return all tutor payments"""
        self.authenticate_as_admin()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "tutor_payments", "count")

    def test_partial_date_works(self):
        """Providing only start_date or end_date should work"""
        self.authenticate_as_admin()

        # Only start_date
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

    def test_empty_date_range_returns_empty_list(self):
        """Date range with no sessions should return empty list"""
        self.authenticate_as_admin()

        future_date = (datetime.now().date() + timedelta(days=365)).isoformat()
        far_future_date = (datetime.now().date() + timedelta(days=400)).isoformat()

        response = self.client.get(
            self.url, {"start_date": future_date, "end_date": far_future_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(len(response.data["tutor_payments"]), 0)

    def test_tutor_cannot_access_payment_stats(self):
        """Tutors should not be able to access payment statistics"""
        self.authenticate_as_tutor()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)

    def test_client_cannot_access_payment_stats(self):
        """Clients should not be able to access payment statistics"""
        self.authenticate_as_client()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)

    def test_unauthenticated_cannot_access_payment_stats(self):
        """Unauthenticated users should not be able to access payment statistics"""
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
        self.assertGreater(response.data["count"], 0)

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

        for tutor_payment in response.data["tutor_payments"]:
            assert_response_has_keys(
                self,
                tutor_payment,
                "tutor",
                "total_amount",
                "session_count",
                "sessions",
            )
            assert_response_has_keys(
                self,
                tutor_payment["tutor"],
                "id",
                "first_name",
                "last_name",
                "email",
            )

    def test_results_sorted_by_tutor_last_name(self):
        """Results should be sorted by tutor last name"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        if len(response.data["tutor_payments"]) >= 2:
            last_names = [
                t["tutor"]["last_name"] for t in response.data["tutor_payments"]
            ]
            self.assertEqual(last_names, sorted(last_names))

    def test_decimal_precision_maintained(self):
        """Decimal amounts should maintain proper precision"""
        self.authenticate_as_admin()

        today = datetime.now().date()
        start_date = (today - timedelta(days=7)).isoformat()
        end_date = (today + timedelta(days=7)).isoformat()

        response = self.client.get(
            self.url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for tutor_payment in response.data["tutor_payments"]:
            total_amount = Decimal(tutor_payment["total_amount"])
            self.assertEqual(total_amount.as_tuple().exponent, -2)

            for session in tutor_payment["sessions"]:
                student_charge = Decimal(session["student_charge"])
                tutor_payment_amount = Decimal(session["tutor_payment"])
                session_amount = Decimal(session["session_amount"])

                self.assertEqual(student_charge.as_tuple().exponent, -2)
                self.assertEqual(tutor_payment_amount.as_tuple().exponent, -2)
                self.assertEqual(session_amount.as_tuple().exponent, -2)
