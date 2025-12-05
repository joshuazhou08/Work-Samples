from unittest.mock import patch
from rest_framework import status
from django.urls import reverse
from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer
from apps.common.test_utils import (
    BaseAPITestCase,
    assert_response_has_keys,
    assert_error_response,
)


class UserRegistrationTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("user_register")
        self.password = "strongpassword123"
        self.valid_data = {
            "email": "tutor@example.com",
            "first_name": "Alice",
            "last_name": "Smith",
            "password": self.password,
            "password_confirm": self.password,
            "phone_number": "+19499230529",
            "username": "alice123",
            "user_type": "tutor",
        }

        self.client_valid_data = {
            "email": "client@example.com",
            "first_name": "Bob",
            "last_name": "Client",
            "password": self.password,
            "password_confirm": self.password,
            "phone_number": "+19496682782",
            "username": "bob123",
            "user_type": "client",
        }

    def test_valid_tutor_registration(self):
        response = self.client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email=self.valid_data["email"])
        self.assertEqual(user.user_type, "tutor")
        self.assertEqual(user.phone_number, self.valid_data["phone_number"])

        # Response shape
        assert_response_has_keys(self, response.data, "message", "token", "user")
        self.assertEqual(response.data["user"]["email"], self.valid_data["email"])

    @patch("stripe.Customer.retrieve")
    @patch("stripe.Customer.create_balance_transaction")
    @patch("stripe.Customer.create")
    @patch("stripe.Customer.list")
    def test_valid_client_gets_free_credit(self, mock_list, mock_create, mock_balance_txn, mock_retrieve):
        mock_list.return_value = {"data": []}
        mock_create.return_value = {"id": "cus_test_123"}
        mock_balance_txn.return_value = {}
        mock_retrieve.return_value = {"balance": -3000}

        response = self.client.post(self.url, self.client_valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email=self.client_valid_data["email"])
        self.assertEqual(user.user_type, "client")
        self.assertEqual(response.data["user"]["balance"], "30.00")

    def test_password_mismatch(self):
        data = {**self.valid_data, "password_confirm": "different"}
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Passwords do not match")

    def test_duplicate_email(self):
        self.client.post(self.url, self.valid_data, format="json")
        response = self.client.post(self.url, self.valid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(
            self, response.data, "A user with this email already exists"
        )

    def test_duplicate_username(self):
        self.client.post(self.url, self.valid_data, format="json")
        data = {**self.valid_data, "email": "new@example.com"}
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(
            self, response.data, "A user with this username already exists"
        )

    def test_invalid_email_format(self):
        data = {**self.valid_data, "email": "not-an-email"}
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Enter a valid email address")

    def test_short_password(self):
        data = {**self.valid_data, "password": "short", "password_confirm": "short"}
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(
            self, response.data, "Password must be at least 8 characters long"
        )

    def test_phone_number_required(self):
        data = self.valid_data.copy()
        data.pop("phone_number")
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Phone number is required")

    def test_valid_e164_phone_numbers(self):
        phones = ["+14155552671", "+447911123456", "+33123456789"]
        for i, phone in enumerate(phones):
            data = {
                **self.valid_data,
                "email": f"test{i}@example.com",
                "username": f"user{i}",
                "phone_number": phone,
            }
            response = self.client.post(self.url, data, format="json")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_invalid_phone_number_formats(self):
        invalid_phones = ["+1234"]
        for i, phone in enumerate(invalid_phones):
            data = {
                **self.valid_data,
                "email": f"bad{i}@example.com",
                "username": f"baduser{i}",
                "phone_number": phone,
            }
            response = self.client.post(self.url, data, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            assert_error_response(
                self,
                response.data,
                "Phone number must be in E.164 format (e.g., +15551234567)",
            )

    @patch("stripe.Customer.retrieve")
    @patch("stripe.Customer.create")
    @patch("stripe.Customer.list")
    @patch("stripe.Customer.create_balance_transaction")
    def test_client_registration_creates_stripe_customer(self, mock_balance_txn, mock_list, mock_create, mock_retrieve):
        """
        Ensure that registering a client results in a Stripe customer being created.
        """

        # Simulate: no existing customer found by email
        mock_list.return_value = {"data": []}
        mock_balance_txn.return_value = {}
        # Simulate: Stripe successfully creates a customer
        mock_create.return_value = {"id": "cus_test_123"}
        mock_retrieve.return_value = {"balance": -3000}

        response = self.client.post(self.url, self.client_valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Fetch user
        user = User.objects.get(email=self.client_valid_data["email"])

        # stripe_customer_id should be set
        self.assertEqual(user.stripe_customer_id, "cus_test_123")

        # Check Stripe API calls
        mock_list.assert_called_once_with(email=user.email, limit=1)
        mock_create.assert_called_once()
        mock_balance_txn.assert_called_once_with(
            "cus_test_123",
            amount=-3000,
            currency="usd",
            description="Welcome bonus: $30 tutoring credits",
        )

        # Check billing status (created with no PM)
        self.assertEqual(user.billing_status, User.BillingStatus.MISSING)


class LoginTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.login_url = reverse("user_login")

        # Create users with factories - they use testpass123 by default
        self.superuser = self.create_superuser()
        self.tutor = self.create_tutor()
        self.client_user = self.create_client_user()

    def test_superuser_login(self):
        response = self.client.post(
            self.login_url,
            {"email": self.superuser.email, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "token", "user")

        # Compare user payload against serializer, not hardcoded dict
        expected_user = UserSerializer(self.superuser).data
        self.assertEqual(response.data["user"], expected_user)

    def test_tutor_login(self):
        response = self.client.post(
            self.login_url,
            {"email": self.tutor.email, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "token", "user")

        # Compare user payload against serializer, not hardcoded dict
        expected_user = UserSerializer(self.tutor).data
        self.assertEqual(response.data["user"], expected_user)

    def test_client_login(self):
        response = self.client.post(
            self.login_url,
            {"email": self.client_user.email, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "token", "user")

        # Compare user payload against serializer, not hardcoded dict
        expected_user = UserSerializer(self.client_user).data
        self.assertEqual(response.data["user"], expected_user)

    def test_invalid_password(self):
        response = self.client.post(
            self.login_url,
            {"email": self.tutor.email, "password": "wrongpassword"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Invalid email or password.")

    def test_login_with_bad_email(self):
        response = self.client.post(
            self.login_url,
            {"email": "not-an-email", "password": self.password},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Enter a valid email address.")

    @patch("stripe.Customer.retrieve")
    @patch("stripe.Customer.create")
    @patch("stripe.Customer.list")
    def test_client_registration_creates_stripe_customer(self, mock_list, mock_create, mock_retrieve):
        """
        Ensure that registering a client results in a Stripe customer being created.
        """

        # Simulate: no existing customer found by email
        mock_list.return_value = {"data": []}

        # Simulate: Stripe successfully creates a customer
        mock_create.return_value = {"id": "cus_test_123"}
        mock_retrieve.return_value = {"balance": 0}

        response = self.client.post(self.url, self.client_valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Fetch user
        user = User.objects.get(email=self.client_valid_data["email"])

        # stripe_customer_id should be set
        self.assertEqual(user.stripe_customer_id, "cus_test_123")

        # Check Stripe API calls
        mock_list.assert_called_once_with(email=user.email, limit=1)
        mock_create.assert_called_once()

        # Check billing status (created with no PM)
        self.assertEqual(user.billing_status, User.BillingStatus.MISSING)

class UserProfileUpdateViewTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("user_profile")
        self.user = self.create_client_user()
        self.authenticate_as(self.user)

    def test_patch_updates_user_profile(self):
        data = {"username": "updatedusername"}
        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "updatedusername")
        assert_response_has_keys(self, response.data, "message", "user")
        self.assertEqual(response.data["user"]["username"], "updatedusername")

    def test_duplicate_email_returns_flattened_errors(self):
        other_user = self.create_client_user()
        response = self.client.patch(
            self.url, {"email": other_user.email}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Profile update failed.")
        self.assertIn("messages", response.data)
        self.assertTrue(
            any(
                "A user with this email already exists." in str(msg)
                or "user with this email already exists." in str(msg)
                for msg in response.data["messages"]
            ),
            f"Unexpected messages: {response.data.get('messages')}",
        )

    def test_blank_first_name_returns_error(self):
        response = self.client.patch(
            self.url, {"first_name": "   "}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Profile update failed.")
        self.assertIn("messages", response.data)
        self.assertTrue(
            any(
                "First name cannot be empty." in str(msg)
                or "This field may not be blank." in str(msg)
                for msg in response.data["messages"]
            ),
            f"Unexpected messages: {response.data.get('messages')}",
        )

    def test_invalid_phone_number_returns_error(self):
        response = self.client.patch(
            self.url, {"phone_number": "12345"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Profile update failed.")
        self.assertIn("messages", response.data)
        self.assertTrue(
            any(
                "Phone number must be in E.164 format (e.g., +15551234567)"
                in str(msg)
                or "Phone number must be entered in the format" in str(msg)
                for msg in response.data["messages"]
            ),
            f"Unexpected messages: {response.data.get('messages')}",
        )

    def test_invalid_timezone_returns_error(self):
        response = self.client.patch(
            self.url, {"timezone": "Invalid/Zone"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Invalid timezone selected.")
        self.assertEqual(response.data["error"], "Profile update failed.")
        self.assertIn("messages", response.data)
        self.assertIn("Invalid timezone selected.", response.data["messages"])

    @patch("stripe.Customer.retrieve")
    @patch("stripe.Customer.modify")
    def test_email_update_updates_stripe_customer(self, mock_modify, mock_retrieve):
        self.user.stripe_customer_id = "cus_test_123"
        self.user.save(update_fields=["stripe_customer_id"])
        mock_retrieve.return_value = {"balance": 0}

        new_email = "updated@example.com"
        response = self.client.patch(
            self.url, {"email": new_email}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, new_email)
        mock_modify.assert_called_once_with("cus_test_123", email=new_email)
