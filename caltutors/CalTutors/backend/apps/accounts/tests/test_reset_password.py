from unittest.mock import patch

from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from apps.common.test_utils.base import BaseAPITestCase


class PasswordResetRequestViewTests(BaseAPITestCase):
    def test_request_sends_email_when_user_exists(self):
        user = self.create_client_user()
        url = reverse("password_reset_request")
        with patch("apps.accounts.views.send_info_email", return_value=True) as mock_send:
            response = self.client.post(url, {"email": user.email}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertIn("you will receive password reset instructions", response.data["message"].lower())
        mock_send.assert_called_once()
        args, _ = mock_send.call_args
        self.assertEqual(args[0], user.email)
        self.assertIn("password reset - caltutors", args[1].lower())
        self.assertIn("password reset", args[2].lower())

    def test_request_returns_error_when_email_missing(self):
        url = reverse("password_reset_request")
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "Password reset request failed.")
        self.assertIn("Email field is required.", response.data["messages"])

    def test_request_still_succeeds_without_user(self):
        url = reverse("password_reset_request")
        with patch("apps.accounts.views.send_info_email") as mock_send:
            response = self.client.post(url, {"email": "missing@example.com"}, format="json")

        self.assertEqual(response.status_code, 200)
        mock_send.assert_not_called()


class PasswordResetConfirmViewTests(BaseAPITestCase):
    def test_confirm_resets_password_with_valid_token(self):
        user = self.create_client_user()
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        url = reverse("password_reset_confirm")
        new_password = "newsecurepassword123"

        response = self.client.post(
            url,
            {
                "uid": uid,
                "token": token,
                "new_password": new_password,
                "new_password_confirm": new_password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password(new_password))

    def test_confirm_rejects_password_mismatch(self):
        user = self.create_client_user()
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        url = reverse("password_reset_confirm")

        response = self.client.post(
            url,
            {
                "uid": uid,
                "token": token,
                "new_password": "pass-one",
                "new_password_confirm": "pass-two",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "Password reset failed.")
        self.assertIn("Passwords do not match.", response.data["messages"])
