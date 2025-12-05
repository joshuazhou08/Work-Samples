from django.test import TestCase
from apps.payments.models import Charge
from apps.payments.serializers import ChargeSerializer, ChargeCreateSerializer
from apps.common.test_utils import AuthenticatedAPITestCase


class ChargeSerializerTest(AuthenticatedAPITestCase):
    """Tests for ChargeSerializer"""

    def setUp(self):
        super().setUp()
        self.tutor = self.create_tutor()
        self.client_user = self.create_client_user()
        self.student = self.create_student(client=self.client_user)
        self.rate = self.create_rate(
            tutor=self.tutor,
            student=self.student,
            student_rate="60.00",
            tutor_pay_rate="40.00",
        )

        # Create sessions
        self.session1 = self.create_session(
            tutor=self.tutor, student=self.student, duration_minutes=60
        )
        self.session2 = self.create_session(
            tutor=self.tutor, student=self.student, duration_minutes=90
        )

        # Create a charge
        self.charge = Charge.objects.create(
            user=self.client_user,
            amount=90.00,
            credits_applied=0.00,
            currency="usd",
            status="pending",
        )
        self.charge.sessions.set([self.session1, self.session2])

    def test_user_info_structure(self):
        """Test that user_info has the correct structure with first_name, last_name, and email"""
        serializer = ChargeSerializer(self.charge)
        data = serializer.data

        # Check that user_info exists
        self.assertIn("user_info", data)

        # Check that user_info has the correct fields
        user_info = data["user_info"]
        self.assertIn("id", user_info)
        self.assertIn("first_name", user_info)
        self.assertIn("last_name", user_info)
        self.assertIn("email", user_info)

        # Verify the values match the user
        self.assertEqual(user_info["id"], self.client_user.id)
        self.assertEqual(user_info["first_name"], self.client_user.first_name)
        self.assertEqual(user_info["last_name"], self.client_user.last_name)
        self.assertEqual(user_info["email"], self.client_user.email)

        # Ensure there's no combined 'name' field
        self.assertNotIn("name", user_info)

    def test_session_count(self):
        """Test that session_count is calculated correctly"""
        serializer = ChargeSerializer(self.charge)
        data = serializer.data

        self.assertEqual(data["session_count"], 2)

    def test_session_details_structure(self):
        """Test that session_details has the correct structure"""
        serializer = ChargeSerializer(self.charge)
        data = serializer.data

        # Check that session_details exists and has correct count
        self.assertIn("session_details", data)
        self.assertEqual(len(data["session_details"]), 2)

        # Check structure of each session detail
        for session_detail in data["session_details"]:
            self.assertIn("id", session_detail)
            self.assertIn("tutor_name", session_detail)
            self.assertIn("student_name", session_detail)
            self.assertIn("start_time", session_detail)
            self.assertIn("duration_minutes", session_detail)

    def test_all_required_fields(self):
        """Test that all required fields are present in serialized data"""
        serializer = ChargeSerializer(self.charge)
        data = serializer.data

        required_fields = [
            "id",
            "user",
            "stripe_checkout_id",
            "amount",
            "credits_applied",
            "final_amount",
            "currency",
            "status",
            "created_at",
            "sessions",
            "user_info",
            "session_count",
            "session_details",
        ]

        for field in required_fields:
            self.assertIn(field, data)


class ChargeCreateSerializerTest(TestCase):
    """Tests for ChargeCreateSerializer validation"""

    def test_validate_negative_amount(self):
        """Test that negative amounts are rejected"""
        from apps.common.test_utils.factories import ClientFactory

        client = ClientFactory()
        data = {
            "user": client.id,
            "amount": -50.00,
            "credits_applied": 0.00,
            "currency": "usd",
            "status": "pending",
        }

        serializer = ChargeCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("amount", serializer.errors)

    def test_validate_negative_credits(self):
        """Test that negative credits are rejected"""
        from apps.common.test_utils.factories import ClientFactory

        client = ClientFactory()
        data = {
            "user": client.id,
            "amount": 50.00,
            "credits_applied": -10.00,
            "currency": "usd",
            "status": "pending",
        }

        serializer = ChargeCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("credits_applied", serializer.errors)

    def test_validate_credits_exceed_amount(self):
        """Test that credits cannot exceed charge amount"""
        from apps.common.test_utils.factories import ClientFactory

        client = ClientFactory()
        data = {
            "user": client.id,
            "amount": 50.00,
            "credits_applied": 60.00,
            "currency": "usd",
            "status": "pending",
        }

        serializer = ChargeCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
