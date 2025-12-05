from rest_framework import status
from django.urls import reverse
from apps.common.test_utils import AuthenticatedAPITestCase


class AdminClientViewSetTests(AuthenticatedAPITestCase):
    def setUp(self):
        super().setUp()
        # Use api_client instead of client to avoid confusion
        self.api_client = self.client

        # Create an additional test client with Faker-generated data
        self.test_client_user = self.create_client_user()

    def test_list_clients(self):
        url = reverse("admin-clients-list")
        res = self.api_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("clients", res.data)
        self.assertIn("count", res.data)
        self.assertEqual(res.data["count"], 2)
        emails = [client["email"] for client in res.data["clients"]]
        self.assertIn(self.client_user.email, emails)
        self.assertIn(self.test_client_user.email, emails)

    def test_retrieve_client(self):
        url = reverse("admin-clients-detail", args=[self.test_client_user.id])
        res = self.api_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], self.test_client_user.email)

    def test_update_client_balance(self):
        url = reverse("admin-clients-detail", args=[self.test_client_user.id])
        res = self.api_client.patch(url, {"balance": 200})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.test_client_user.refresh_from_db()
        self.assertEqual(float(self.test_client_user.balance), 200.00)

    def test_update_client_other_field(self):
        url = reverse("admin-clients-detail", args=[self.test_client_user.id])
        res = self.api_client.patch(url, {"first_name": "New"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.test_client_user.refresh_from_db()
        self.assertEqual(self.test_client_user.first_name, "New")

    def test_admin_cannot_create_client(self):
        url = reverse("admin-clients-list")
        res = self.api_client.post(url, {"email": "x@y.com"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data["error"], "Client creation forbidden.")
        self.assertIn("Admins cannot directly create clients.", res.data["messages"])

    def test_non_admin_forbidden(self):
        # Switch authentication to a non-admin user
        self.authenticate_as_client()
        url = reverse("admin-clients-list")
        res = self.api_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
