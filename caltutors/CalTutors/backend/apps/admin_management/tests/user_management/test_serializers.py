from datetime import timedelta
from django.utils import timezone
from apps.accounts.models import User, Student
from apps.sessions.models import Rate
from apps.admin_management.serializers import (
    AdminTutorSerializer,
    AdminClientSerializer,
    AdminStudentSerializer,
)
from apps.common.test_utils import BaseAPITestCase


class AdminTutorSerializerTest(BaseAPITestCase):
    """Test AdminTutorSerializer computed fields"""

    def setUp(self):
        super().setUp()
        self.tutor_with_students = self.create_tutor()
        self.tutor_without_students = self.create_tutor()
        self.client = self.create_client_user()
        self.student = self.create_student(client=self.client)

        # Ensure tutor with students has valid billing for baseline tests
        self.tutor_with_students.billing_status = User.BillingStatus.VALID
        self.tutor_with_students.save(update_fields=["billing_status"])

        # Create rate for tutor with students
        Rate.objects.create(
            tutor=self.tutor_with_students,
            student=self.student,
            student_rate="60.00",
            tutor_pay_rate="40.00",
        )

    def test_hasActiveStudents_true_when_tutor_has_rates(self):
        """Test hasActiveStudents is True when tutor has rate assignments"""
        serializer = AdminTutorSerializer(self.tutor_with_students)
        self.assertTrue(serializer.data["hasActiveStudents"])

    def test_hasActiveStudents_false_when_tutor_has_no_rates(self):
        """Test hasActiveStudents is False when tutor has no rate assignments"""
        serializer = AdminTutorSerializer(self.tutor_without_students)
        self.assertFalse(serializer.data["hasActiveStudents"])

    def test_tutor_notices_include_missing_students_and_invalid_billing(self):
        """Notices should reflect no students and invalid billing"""
        self.tutor_without_students.billing_status = User.BillingStatus.INVALID
        self.tutor_without_students.save(update_fields=["billing_status"])

        serializer = AdminTutorSerializer(self.tutor_without_students)
        self.assertIn("No students", serializer.data["notices"])
        self.assertIn("Missing billing", serializer.data["notices"])

    def test_tutor_notices_empty_when_ok(self):
        """Notices should be empty when tutor has students and billing valid"""
        serializer = AdminTutorSerializer(self.tutor_with_students)
        self.assertEqual(serializer.data["notices"], [])

    def test_is_recently_active_uses_last_session_at(self):
        """Test is_recently_active reflects activity within 30 days"""
        recent_time = timezone.now() - timedelta(days=5)
        old_time = timezone.now() - timedelta(days=35)

        self.tutor_with_students.last_session_at = recent_time
        self.tutor_with_students.save(update_fields=["last_session_at"])
        serializer_recent = AdminTutorSerializer(self.tutor_with_students)
        self.assertTrue(serializer_recent.data["is_recently_active"])

        self.tutor_without_students.last_session_at = old_time
        self.tutor_without_students.save(update_fields=["last_session_at"])
        serializer_old = AdminTutorSerializer(self.tutor_without_students)
        self.assertFalse(serializer_old.data["is_recently_active"])

    def test_serializer_includes_all_required_fields(self):
        """Test that serializer includes all expected fields"""
        serializer = AdminTutorSerializer(self.tutor_with_students)
        data = serializer.data

        self.assertIn("id", data)
        self.assertIn("email", data)
        self.assertIn("first_name", data)
        self.assertIn("hasActiveStudents", data)
        self.assertIn("is_recently_active", data)
        self.assertIn("notices", data)


class AdminClientSerializerTest(BaseAPITestCase):
    """Test AdminClientSerializer computed fields"""

    def setUp(self):
        super().setUp()
        self.client_with_students = self.create_client_user()
        self.client_without_students = self.create_client_user()

        # Set billing to valid for baseline client
        self.client_with_students.billing_status = User.BillingStatus.VALID
        self.client_with_students.save(update_fields=["billing_status"])

        # Create student for first client
        self.create_student(client=self.client_with_students)

    def test_hasStudents_true_when_client_has_students(self):
        """Test hasStudents is True when client has active students"""
        serializer = AdminClientSerializer(self.client_with_students)
        self.assertTrue(serializer.data["hasStudents"])

    def test_hasStudents_false_when_client_has_no_students(self):
        """Test hasStudents is False when client has no students"""
        serializer = AdminClientSerializer(self.client_without_students)
        self.assertFalse(serializer.data["hasStudents"])

    def test_hasStudents_false_when_student_is_inactive(self):
        """Test hasStudents is False when client only has inactive students"""
        client = self.create_client_user()

        # Create inactive student
        Student.objects.create(
            client=client,
            first_name="Inactive",
            last_name="Student",
            is_active=False,
        )

        serializer = AdminClientSerializer(client)
        self.assertFalse(serializer.data["hasStudents"])

    def test_client_notices_include_missing_students_and_invalid_billing(self):
        """Notices should include missing students and invalid billing for clients"""
        self.client_without_students.billing_status = User.BillingStatus.INVALID
        self.client_without_students.save(update_fields=["billing_status"])

        serializer = AdminClientSerializer(self.client_without_students)
        self.assertIn("No students", serializer.data["notices"])
        self.assertIn("Missing billing", serializer.data["notices"])

    def test_client_notices_treat_missing_billing_as_invalid(self):
        """Notices should flag missing billing method as invalid billing"""
        self.client_without_students.billing_status = User.BillingStatus.MISSING
        self.client_without_students.save(update_fields=["billing_status"])

        serializer = AdminClientSerializer(self.client_without_students)
        self.assertIn("Missing billing", serializer.data["notices"])

    def test_client_notices_empty_when_ok(self):
        """Notices should be empty when client has students and billing valid"""
        serializer = AdminClientSerializer(self.client_with_students)
        self.assertEqual(serializer.data["notices"], [])

    def test_is_recently_active_uses_last_session_at(self):
        """Test is_recently_active reflects recent client activity"""
        recent_time = timezone.now() - timedelta(days=10)
        old_time = timezone.now() - timedelta(days=45)

        self.client_with_students.last_session_at = recent_time
        self.client_with_students.save(update_fields=["last_session_at"])
        serializer_recent = AdminClientSerializer(self.client_with_students)
        self.assertTrue(serializer_recent.data["is_recently_active"])

        self.client_without_students.last_session_at = old_time
        self.client_without_students.save(update_fields=["last_session_at"])
        serializer_old = AdminClientSerializer(self.client_without_students)
        self.assertFalse(serializer_old.data["is_recently_active"])

    def test_serializer_includes_all_required_fields(self):
        """Test that serializer includes all expected fields"""
        serializer = AdminClientSerializer(self.client_with_students)
        data = serializer.data

        self.assertIn("id", data)
        self.assertIn("email", data)
        self.assertIn("first_name", data)
        self.assertIn("hasStudents", data)
        self.assertIn("balance", data)
        self.assertIn("is_recently_active", data)
        self.assertIn("notices", data)


class AdminStudentSerializerTest(BaseAPITestCase):
    """Test AdminStudentSerializer computed fields"""

    def setUp(self):
        super().setUp()
        self.client = self.create_client_user()
        self.tutor = self.create_tutor()
        self.student_with_tutors = self.create_student(client=self.client)
        self.student_without_tutors = self.create_student(client=self.client)

        # Create rate for student with tutors
        Rate.objects.create(
            tutor=self.tutor,
            student=self.student_with_tutors,
            student_rate="60.00",
            tutor_pay_rate="40.00",
        )

    def test_hasTutors_true_when_student_has_rates(self):
        """Test hasTutors is True when student has rate assignments"""
        serializer = AdminStudentSerializer(self.student_with_tutors)
        self.assertTrue(serializer.data["hasTutors"])

    def test_hasTutors_false_when_student_has_no_rates(self):
        """Test hasTutors is False when student has no rate assignments"""
        serializer = AdminStudentSerializer(self.student_without_tutors)
        self.assertFalse(serializer.data["hasTutors"])

    def test_client_name_is_included(self):
        """Test that client_name is properly computed"""
        serializer = AdminStudentSerializer(self.student_with_tutors)
        self.assertEqual(serializer.data["client_name"], self.client.get_full_name())

    def test_serializer_includes_all_required_fields(self):
        """Test that serializer includes all expected fields"""
        serializer = AdminStudentSerializer(self.student_with_tutors)
        data = serializer.data

        self.assertIn("id", data)
        self.assertIn("client", data)
        self.assertIn("first_name", data)
        self.assertIn("hasTutors", data)
        self.assertIn("client_name", data)
        self.assertIn("subjects_list", data)


class AdminSerializerIntegrationTest(BaseAPITestCase):
    """Integration tests for all admin serializers working together"""

    def setUp(self):
        super().setUp()
        # Create tutors
        self.tutor1 = self.create_tutor()
        self.tutor2 = self.create_tutor()

        # Create clients
        self.client1 = self.create_client_user()
        self.client2 = self.create_client_user()

        # Create students
        self.student1 = self.create_student(client=self.client1)
        self.student2 = self.create_student(client=self.client1)

        # Create rates
        Rate.objects.create(
            tutor=self.tutor1,
            student=self.student1,
            student_rate="60.00",
            tutor_pay_rate="40.00",
        )

        Rate.objects.create(
            tutor=self.tutor1,
            student=self.student2,
            student_rate="65.00",
            tutor_pay_rate="45.00",
        )

    def test_tutor_with_multiple_students_shows_active(self):
        """Test tutor with multiple students has hasActiveStudents=True"""
        serializer = AdminTutorSerializer(self.tutor1)
        self.assertTrue(serializer.data["hasActiveStudents"])

    def test_tutor_without_students_shows_inactive(self):
        """Test tutor without students has hasActiveStudents=False"""
        serializer = AdminTutorSerializer(self.tutor2)
        self.assertFalse(serializer.data["hasActiveStudents"])

    def test_client_with_students_shows_active(self):
        """Test client with students has hasStudents=True"""
        serializer = AdminClientSerializer(self.client1)
        self.assertTrue(serializer.data["hasStudents"])

    def test_client_without_students_shows_inactive(self):
        """Test client without students has hasStudents=False"""
        serializer = AdminClientSerializer(self.client2)
        self.assertFalse(serializer.data["hasStudents"])

    def test_student_with_tutor_shows_active(self):
        """Test student with tutor has hasTutors=True"""
        serializer = AdminStudentSerializer(self.student1)
        self.assertTrue(serializer.data["hasTutors"])

    def test_multiple_tutors_for_one_student(self):
        """Test student with multiple tutors still shows hasTutors=True"""
        # Add another tutor for student1
        Rate.objects.create(
            tutor=self.tutor2,
            student=self.student1,
            student_rate="70.00",
            tutor_pay_rate="50.00",
        )

        serializer = AdminStudentSerializer(self.student1)
        self.assertTrue(serializer.data["hasTutors"])

    def test_deleting_rate_updates_status(self):
        """Test that deleting a rate properly updates status fields"""
        # Initial state - student1 has tutor
        serializer = AdminStudentSerializer(self.student1)
        self.assertTrue(serializer.data["hasTutors"])

        # Delete the rate
        Rate.objects.filter(student=self.student1).delete()

        # Re-serialize - should now show False
        serializer = AdminStudentSerializer(self.student1)
        self.assertFalse(serializer.data["hasTutors"])
