from rest_framework import status
from django.urls import reverse
from decimal import Decimal
from apps.common.test_utils import AuthenticatedAPITestCase
from apps.sessions.models import Rate


class AdminRateViewSetTests(AuthenticatedAPITestCase):
    """Test AdminRateViewSet for rate CRUD operations"""

    def setUp(self):
        super().setUp()
        self.api_client = self.client

        # Create students for testing
        self.test_student1 = self.create_student(client=self.client_user)
        self.test_student2 = self.create_student(client=self.client_user)

        # Create rates for testing
        self.rate1 = self.create_rate(
            tutor=self.tutor,
            student=self.test_student1,
            student_rate="60.00",
            tutor_pay_rate="40.00",
        )

        self.rate2 = self.create_rate(
            tutor=self.tutor,
            student=self.test_student2,
            student_rate="70.00",
            tutor_pay_rate="50.00",
        )

    def test_list_rates(self):
        """Admin can list all rates"""
        url = reverse("admin-rates-list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)
        self.assertGreaterEqual(len(res.data), 2)

    def test_list_rates_filter_by_tutor(self):
        """Admin can filter rates by tutor_id"""
        url = reverse("admin-rates-list")
        res = self.api_client.get(url, {"tutor_id": self.tutor.id})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)  # Both rates are for self.tutor

    def test_list_rates_filter_by_student(self):
        """Admin can filter rates by student_id"""
        url = reverse("admin-rates-list")
        res = self.api_client.get(url, {"student_id": self.test_student1.id})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["student"], self.test_student1.id)

    def test_retrieve_rate(self):
        """Admin can retrieve a specific rate"""
        url = reverse("admin-rates-detail", args=[self.rate1.id])
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], self.rate1.id)
        self.assertEqual(res.data["student_rate"], "60.00")
        self.assertEqual(res.data["tutor_pay_rate"], "40.00")

    def test_create_rate(self):
        """Admin can create a new rate"""
        new_student = self.create_student(client=self.client_user)
        url = reverse("admin-rates-list")
        data = {
            "tutor": self.tutor.id,
            "student": new_student.id,
            "student_rate": "75.00",
            "tutor_pay_rate": "55.00",
        }
        res = self.api_client.post(url, data)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["student_rate"], "75.00")
        self.assertEqual(res.data["tutor_pay_rate"], "55.00")

        # Verify rate was created
        self.assertTrue(
            Rate.objects.filter(tutor=self.tutor, student=new_student).exists()
        )

    def test_update_rate(self):
        """Admin can update a rate"""
        url = reverse("admin-rates-detail", args=[self.rate1.id])
        data = {
            "student_rate": "80.00",
            "tutor_pay_rate": "60.00",
        }
        res = self.api_client.patch(url, data)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["student_rate"], "80.00")
        self.assertEqual(res.data["tutor_pay_rate"], "60.00")

        # Verify rate was updated
        self.rate1.refresh_from_db()
        self.assertEqual(self.rate1.student_rate, Decimal("80.00"))
        self.assertEqual(self.rate1.tutor_pay_rate, Decimal("60.00"))

    def test_delete_rate(self):
        """Admin can delete a rate"""
        url = reverse("admin-rates-detail", args=[self.rate1.id])
        res = self.api_client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # Verify rate was deleted
        self.assertFalse(Rate.objects.filter(id=self.rate1.id).exists())

    def test_list_rates_non_admin_forbidden(self):
        """Non-admin users cannot list rates"""
        self.authenticate_as_client()
        url = reverse("admin-rates-list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_rate_non_admin_forbidden(self):
        """Non-admin users cannot create rates"""
        self.authenticate_as_tutor()
        url = reverse("admin-rates-list")
        data = {
            "tutor": self.tutor.id,
            "student": self.test_student1.id,
            "student_rate": "75.00",
            "tutor_pay_rate": "55.00",
        }
        res = self.api_client.post(url, data)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_rate_non_admin_forbidden(self):
        """Non-admin users cannot update rates"""
        self.authenticate_as_tutor()
        url = reverse("admin-rates-detail", args=[self.rate1.id])
        data = {"student_rate": "80.00"}
        res = self.api_client.patch(url, data)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_rate_non_admin_forbidden(self):
        """Non-admin users cannot delete rates"""
        self.authenticate_as_client()
        url = reverse("admin-rates-detail", args=[self.rate1.id])
        res = self.api_client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_rate_invalid_data(self):
        """Creating rate with invalid data returns error"""
        url = reverse("admin-rates-list")
        data = {
            "tutor": self.tutor.id,
            "student": 99999,  # Non-existent student
            "student_rate": "75.00",
            "tutor_pay_rate": "55.00",
        }
        res = self.api_client.post(url, data)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_non_existent_rate(self):
        """Retrieving non-existent rate returns 404"""
        url = reverse("admin-rates-detail", args=[99999])
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_rates_ordered_by_created_at(self):
        """Rates are returned in descending order by created_at"""
        url = reverse("admin-rates-list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # rate2 was created after rate1, so it should come first
        rate_ids = [r["id"] for r in res.data]
        self.assertEqual(rate_ids[0], self.rate2.id)
        self.assertEqual(rate_ids[1], self.rate1.id)
