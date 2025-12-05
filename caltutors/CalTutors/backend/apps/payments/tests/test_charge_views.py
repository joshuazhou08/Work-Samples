from rest_framework import status
from django.urls import reverse
from apps.payments.models import Charge
from apps.common.test_utils import (
    AuthenticatedAPITestCase,
    assert_response_has_keys,
    assert_error_response,
)


class ChargeListTests(AuthenticatedAPITestCase):
    """Tests for listing charges (GET /payments/charges/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("payments:charges-list")

        # Create test data
        self.client1 = self.create_client_user()
        self.client2 = self.create_client_user()

        self.charge1 = self.create_charge(user=self.client1, amount="100.00")
        self.charge2 = self.create_charge(
            user=self.client2, amount="50.00", status="paid"
        )

    def test_admin_can_list_all_charges(self):
        """Admin should be able to list all charges"""
        self.authenticate_as_admin()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "charges")
        self.assertEqual(len(response.data["charges"]), 2)

    def test_list_charges_filtered_by_user(self):
        """Admin should be able to filter charges by user_id"""
        self.authenticate_as_admin()
        response = self.client.get(self.url, {"user_id": self.client1.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["charges"]), 1)
        self.assertEqual(response.data["charges"][0]["user"], self.client1.id)

    def test_list_charges_filtered_by_status(self):
        """Admin should be able to filter charges by status"""
        self.authenticate_as_admin()
        response = self.client.get(self.url, {"status": "paid"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["charges"]), 1)
        self.assertEqual(response.data["charges"][0]["status"], "paid")

    def test_tutor_cannot_list_charges(self):
        """Tutors should not be able to list charges"""
        self.authenticate_as_tutor()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")

    def test_client_cannot_list_all_charges(self):
        """Clients should not be able to list all charges"""
        self.authenticate_as_client()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")

    def test_unauthenticated_cannot_list_charges(self):
        """Unauthenticated users should not be able to list charges"""
        self.logout()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChargeCreateTests(AuthenticatedAPITestCase):
    """Tests for creating charges (POST /payments/charges/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("payments:charges-list")

        # Create test data
        self.client_user = self.create_client_user()
        self.student = self.create_student(client=self.client_user)
        self.tutor_user = self.create_tutor()

        # Create sessions
        self.session1 = self.create_session(
            tutor=self.tutor_user, student=self.student, duration_minutes=60
        )
        self.session2 = self.create_session(
            tutor=self.tutor_user, student=self.student, duration_minutes=90
        )

    def test_admin_can_create_charge(self):
        """Admin should be able to create a charge"""
        self.authenticate_as_admin()
        data = {
            "user": self.client_user.id,
            "amount": "100.00",
            "credits_applied": "10.00",
            "currency": "usd",
            "status": "pending",
            "session_ids": [self.session1.id, self.session2.id],
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        assert_response_has_keys(self, response.data, "message", "charge")

        # Check charge data
        charge_data = response.data["charge"]
        self.assertEqual(charge_data["user"], self.client_user.id)
        self.assertEqual(charge_data["amount"], "100.00")
        self.assertEqual(charge_data["credits_applied"], "10.00")
        self.assertEqual(charge_data["final_amount"], "90.00")
        self.assertEqual(charge_data["session_count"], 2)

        # Verify charge was created in database
        charge = Charge.objects.get(id=charge_data["id"])
        self.assertEqual(charge.sessions.count(), 2)

    def test_create_charge_without_sessions(self):
        """Admin should be able to create a charge without sessions (credit package)"""
        self.authenticate_as_admin()
        data = {
            "user": self.client_user.id,
            "amount": "200.00",
            "credits_applied": "0.00",
            "currency": "usd",
            "status": "pending",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        charge_data = response.data["charge"]
        self.assertEqual(charge_data["session_count"], 0)

    def test_create_charge_with_invalid_session_ids(self):
        """Creating a charge with invalid session IDs should fail"""
        self.authenticate_as_admin()
        data = {
            "user": self.client_user.id,
            "amount": "100.00",
            "session_ids": [99999],  # Non-existent session
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "session IDs are invalid")

    def test_create_charge_with_already_charged_session(self):
        """Creating a charge with sessions that are already charged should fail"""
        self.authenticate_as_admin()

        # Create first charge with session1
        self.create_charge(
            user=self.client_user, session_ids=[self.session1.id], amount="50.00"
        )

        # Try to create another charge with the same session
        data = {
            "user": self.client_user.id,
            "amount": "100.00",
            "session_ids": [self.session1.id],
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "already been charged")

    def test_create_charge_negative_amount(self):
        """Creating a charge with negative amount should fail"""
        self.authenticate_as_admin()
        data = {
            "user": self.client_user.id,
            "amount": "-100.00",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(self, response.data, "Amount cannot be negative")

    def test_create_charge_credits_exceed_amount(self):
        """Creating a charge where credits exceed amount should fail"""
        self.authenticate_as_admin()
        data = {
            "user": self.client_user.id,
            "amount": "50.00",
            "credits_applied": "100.00",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(
            self, response.data, "Credits applied cannot exceed the charge amount"
        )

    def test_tutor_cannot_create_charge(self):
        """Tutors should not be able to create charges"""
        self.authenticate_as_tutor()
        data = {
            "user": self.client_user.id,
            "amount": "100.00",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")

    def test_client_cannot_create_charge(self):
        """Clients should not be able to create charges"""
        self.authenticate_as_client()
        data = {
            "user": self.client_user.id,
            "amount": "100.00",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")


class ChargeRetrieveTests(AuthenticatedAPITestCase):
    """Tests for retrieving a single charge (GET /payments/charges/{id}/)"""

    def setUp(self):
        super().setUp()
        self.client_user = self.create_client_user()
        self.charge = self.create_charge(user=self.client_user, amount="100.00")
        self.url = reverse("payments:charges-detail", kwargs={"pk": self.charge.id})

    def test_admin_can_retrieve_charge(self):
        """Admin should be able to retrieve a charge"""
        self.authenticate_as_admin()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "charge")
        self.assertEqual(response.data["charge"]["id"], self.charge.id)
        self.assertEqual(response.data["charge"]["amount"], "100.00")

    def test_retrieve_nonexistent_charge(self):
        """Retrieving a nonexistent charge should return 404"""
        self.authenticate_as_admin()
        url = reverse("payments:charges-detail", kwargs={"pk": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        assert_error_response(self, response.data, "Charge not found")

    def test_tutor_cannot_retrieve_charge(self):
        """Tutors should not be able to retrieve charges"""
        self.authenticate_as_tutor()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")

    def test_client_cannot_retrieve_charge(self):
        """Clients should not be able to retrieve charges through this endpoint"""
        self.authenticate_as_client()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")


class ChargeUpdateTests(AuthenticatedAPITestCase):
    """Tests for updating charges (PATCH /payments/charges/{id}/)"""

    def setUp(self):
        super().setUp()
        self.client_user = self.create_client_user()
        self.charge = self.create_charge(user=self.client_user, amount="100.00")
        self.url = reverse("payments:charges-detail", kwargs={"pk": self.charge.id})

    def test_admin_can_update_charge_status(self):
        """Admin should be able to update charge status"""
        self.authenticate_as_admin()
        data = {"status": "paid"}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "message", "charge")
        self.assertEqual(response.data["charge"]["status"], "paid")

        # Verify in database
        self.charge.refresh_from_db()
        self.assertEqual(self.charge.status, "paid")

    def test_admin_can_update_stripe_checkout_id(self):
        """Admin should be able to update stripe_checkout_id"""
        self.authenticate_as_admin()
        data = {"stripe_checkout_id": "cs_test_123456"}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["charge"]["stripe_checkout_id"], "cs_test_123456"
        )

    def test_admin_can_update_credits_applied(self):
        """Admin should be able to update credits_applied"""
        self.authenticate_as_admin()
        data = {"credits_applied": "20.00"}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["charge"]["credits_applied"], "20.00")
        # final_amount should be recalculated
        self.assertEqual(response.data["charge"]["final_amount"], "80.00")

    def test_update_nonallowed_field_ignored(self):
        """Updating non-allowed fields should be ignored"""
        self.authenticate_as_admin()
        original_amount = self.charge.amount
        data = {"amount": "500.00"}  # amount is not in allowed_fields

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Amount should remain unchanged
        self.charge.refresh_from_db()
        self.assertEqual(self.charge.amount, original_amount)

    def test_update_nonexistent_charge(self):
        """Updating a nonexistent charge should return 404"""
        self.authenticate_as_admin()
        url = reverse("payments:charges-detail", kwargs={"pk": 99999})
        data = {"status": "paid"}

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        assert_error_response(self, response.data, "Charge not found")

    def test_tutor_cannot_update_charge(self):
        """Tutors should not be able to update charges"""
        self.authenticate_as_tutor()
        data = {"status": "paid"}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")

    def test_client_cannot_update_charge(self):
        """Clients should not be able to update charges"""
        self.authenticate_as_client()
        data = {"status": "paid"}

        response = self.client.patch(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")


class ChargeDeleteTests(AuthenticatedAPITestCase):
    """Tests for deleting charges (DELETE /payments/charges/{id}/)"""

    def setUp(self):
        super().setUp()
        self.client_user = self.create_client_user()
        self.charge = self.create_charge(user=self.client_user, amount="100.00")
        self.url = reverse("payments:charges-detail", kwargs={"pk": self.charge.id})

    def test_admin_can_delete_pending_charge(self):
        """Admin should be able to delete a pending charge"""
        self.authenticate_as_admin()
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "message")

        # Verify charge was deleted
        self.assertFalse(Charge.objects.filter(id=self.charge.id).exists())

    def test_cannot_delete_paid_charge(self):
        """Admin should not be able to delete a paid charge"""
        self.authenticate_as_admin()
        self.charge.status = "paid"
        self.charge.save()

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        assert_error_response(
            self, response.data, "Only pending charges can be deleted"
        )

        # Verify charge still exists
        self.assertTrue(Charge.objects.filter(id=self.charge.id).exists())

    def test_delete_nonexistent_charge(self):
        """Deleting a nonexistent charge should return 404"""
        self.authenticate_as_admin()
        url = reverse("payments:charges-detail", kwargs={"pk": 99999})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        assert_error_response(self, response.data, "Charge not found")

    def test_tutor_cannot_delete_charge(self):
        """Tutors should not be able to delete charges"""
        self.authenticate_as_tutor()
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")

    def test_client_cannot_delete_charge(self):
        """Clients should not be able to delete charges"""
        self.authenticate_as_client()
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(self, response.data, "Admin privileges required")


class ClientChargesTests(AuthenticatedAPITestCase):
    """Tests for client-specific charges endpoint (GET /payments/charges/client-charges/)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("payments:charges-client-charges")

        # Create charges for different clients
        self.client1 = self.create_client_user()
        self.client2 = self.create_client_user()

        self.charge1 = self.create_charge(user=self.client1, amount="100.00")
        self.charge2 = self.create_charge(user=self.client1, amount="50.00")
        self.charge3 = self.create_charge(user=self.client2, amount="200.00")

    def test_client_can_view_own_charges(self):
        """Client should be able to view their own charges"""
        self.authenticate_as(self.client1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_response_has_keys(self, response.data, "charges")
        self.assertEqual(len(response.data["charges"]), 2)

        # All charges should belong to client1
        for charge in response.data["charges"]:
            self.assertEqual(charge["user"], self.client1.id)

    def test_client_only_sees_own_charges(self):
        """Client should only see their own charges, not other clients' charges"""
        self.authenticate_as(self.client2)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["charges"]), 1)
        self.assertEqual(response.data["charges"][0]["user"], self.client2.id)

    def test_admin_cannot_use_client_charges_endpoint(self):
        """Admin should not be able to use the client-charges endpoint"""
        self.authenticate_as_admin()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(
            self, response.data, "Only clients can view their charges"
        )

    def test_tutor_cannot_use_client_charges_endpoint(self):
        """Tutor should not be able to use the client-charges endpoint"""
        self.authenticate_as_tutor()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        assert_error_response(
            self, response.data, "Only clients can view their charges"
        )

    def test_unauthenticated_cannot_access_client_charges(self):
        """Unauthenticated users should not be able to access client charges"""
        self.logout()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
