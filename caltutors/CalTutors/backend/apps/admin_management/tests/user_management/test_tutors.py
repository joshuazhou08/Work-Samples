from rest_framework import status
from django.urls import reverse
from apps.common.test_utils import AuthenticatedAPITestCase


class AdminTutorsListViewTests(AuthenticatedAPITestCase):
    def setUp(self):
        super().setUp()
        # Use api_client instead of client to avoid confusion
        self.api_client = self.client

        # Create additional test tutors with Faker-generated data
        self.test_tutor1 = self.create_tutor()
        self.test_tutor2 = self.create_tutor()

    def test_list_tutors(self):
        """Admin can list all tutors"""
        url = reverse("tutors_list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("tutors", res.data)
        self.assertIn("count", res.data)

        # Should have at least 3 tutors (self.tutor from base + 2 created here)
        self.assertGreaterEqual(res.data["count"], 3)

        # Verify the tutors we created are in the list
        tutor_emails = [tutor["email"] for tutor in res.data["tutors"]]
        self.assertIn(self.tutor.email, tutor_emails)
        self.assertIn(self.test_tutor1.email, tutor_emails)
        self.assertIn(self.test_tutor2.email, tutor_emails)

    def test_list_tutors_non_admin_forbidden(self):
        """Non-admin users cannot access tutors list"""
        self.authenticate_as_client()
        url = reverse("tutors_list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_tutors_unauthenticated_forbidden(self):
        """Unauthenticated users cannot access tutors list"""
        self.logout()
        url = reverse("tutors_list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_tutors_only_returns_tutors(self):
        """List should only return users with user_type='tutor'"""
        url = reverse("tutors_list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verify all returned users are tutors
        for tutor in res.data["tutors"]:
            self.assertEqual(tutor["user_type"], "tutor")

    def test_list_tutors_tutor_cannot_access(self):
        """Tutors cannot access the admin tutors list endpoint"""
        self.authenticate_as_tutor()
        url = reverse("tutors_list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
