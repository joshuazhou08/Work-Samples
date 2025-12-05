"""
Base test case classes for CalTutors tests.

Provides common setup and helper methods for API testing.
"""

from rest_framework.test import APITestCase, APIClient
from rest_framework.authtoken.models import Token
from typing import TYPE_CHECKING
from decimal import Decimal

if TYPE_CHECKING:
    from django.contrib.auth import get_user_model

    User = get_user_model()

from .factories import TutorFactory, ClientFactory, AdminFactory, StudentFactory


class BaseAPITestCase(APITestCase):
    """
    Base test case with common setup for API tests.

    Provides:
    - Consistent test data creation via factories
    - Pre-configured APIClient
    - Common authentication helpers
    - Standard password for all test users
    """

    def setUp(self):
        """Set up common test data."""
        super().setUp()
        self.password = "testpass123"
        self.client = APIClient()

    def authenticate_as(self, user: "User") -> None:
        """
        Authenticate the test client as the given user.

        Args:
            user: The user to authenticate as
        """
        self.client.force_authenticate(user=user)

    def logout(self) -> None:
        """Clear authentication from the test client."""
        self.client.force_authenticate(user=None)

    def get_auth_token(self, user: "User") -> str:
        """
        Get or create an auth token for the given user.

        Args:
            user: The user to get a token for

        Returns:
            str: The authentication token
        """
        token, created = Token.objects.get_or_create(user=user)
        return token.key

    def create_tutor(self) -> "User":
        """
        Create a tutor user with Faker-generated defaults.

        Returns:
            User: The created tutor user with password set to self.password
        """
        tutor = TutorFactory()
        tutor.set_password(self.password)
        tutor.save()
        return tutor

    def create_client_user(self) -> "User":
        """
        Create a client user with Faker-generated defaults.

        Returns:
            User: The created client user with password set to self.password
        """
        client = ClientFactory()
        client.set_password(self.password)
        client.save()
        return client

    def create_admin(self) -> "User":
        """
        Create an admin user with Faker-generated defaults.

        Returns:
            User: The created admin user with password set to self.password
        """
        admin = AdminFactory()
        admin.set_password(self.password)
        admin.save()
        return admin

    def create_superuser(self) -> "User":
        """
        Create a superuser with Faker-generated defaults.

        Returns:
            User: The created superuser with password set to self.password
        """
        from .factories import SuperUserFactory

        superuser = SuperUserFactory()
        superuser.set_password(self.password)
        superuser.save()
        return superuser

    def create_student(self, client: "User" = None):
        """
        Create a student with Faker-generated defaults.

        Args:
            client: The client user who owns this student (optional, will create one if not provided)

        Returns:
            Student: The created student
        """
        if client:
            return StudentFactory(client=client)
        return StudentFactory()

    def create_rate(
        self,
        tutor: "User" = None,
        student=None,
        student_rate="60.00",
        tutor_pay_rate="40.00",
    ):
        """
        Create a rate with specified or default values.

        Args:
            tutor: The tutor for this rate (optional, will create one if not provided)
            student: The student for this rate (optional, will create one if not provided)
            student_rate: The student rate (default: "60.00")
            tutor_pay_rate: The tutor pay rate (default: "40.00")

        Returns:
            Rate: The created rate
        """
        from apps.sessions.models import Rate
        from decimal import Decimal

        if not tutor:
            tutor = self.create_tutor()
        if not student:
            student = self.create_student()

        return Rate.objects.create(
            tutor=tutor,
            student=student,
            student_rate=Decimal(student_rate),
            tutor_pay_rate=Decimal(tutor_pay_rate),
        )

    def create_session(
        self,
        tutor: "User" = None,
        student=None,
        start_time=None,
        duration_minutes=60,
    ):
        """
        Create a tutoring session with specified or default values.

        Args:
            tutor: The tutor for this session (optional, will create one if not provided)
            student: The student for this session (optional, will create one if not provided)
            start_time: The start time (optional, will use current time if not provided)
            duration_minutes: The session duration in minutes (default: 60)

        Returns:
            Hours: The created session
        """
        from apps.sessions.models import Hours
        from django.utils import timezone

        if not tutor:
            tutor = self.create_tutor()
        if not student:
            student = self.create_student()
        if not start_time:
            start_time = timezone.now()

        return Hours.objects.create(
            tutor=tutor,
            student=student,
            start_time=start_time,
            duration_minutes=duration_minutes,
        )

    def create_charge(
        self,
        user: "User" = None,
        amount="100.00",
        credits_applied="0.00",
        status="pending",
        session_ids=None,
    ):
        """
        Create a charge with specified or default values.

        Args:
            user: The user (client) being charged (optional, will create one if not provided)
            amount: The charge amount (default: "100.00")
            credits_applied: Credits applied to the charge (default: "0.00")
            status: The charge status (default: "pending")
            session_ids: List of session IDs to attach to the charge (optional)

        Returns:
            Charge: The created charge
        """
        from apps.payments.models import Charge
        from decimal import Decimal

        if not user:
            user = self.create_client_user()

        charge = Charge.objects.create(
            user=user,
            amount=Decimal(amount),
            credits_applied=Decimal(credits_applied),
            status=status,
        )

        # Attach sessions if provided and mark them as paid
        if session_ids:
            from apps.sessions.models import Hours

            sessions = Hours.objects.filter(id__in=session_ids)
            charge.sessions.set(sessions)
            sessions.update(student_charged=True)

        return charge


class AuthenticatedAPITestCase(BaseAPITestCase):
    """
    Base test case with pre-authenticated users of each type.

    Provides:
    - Pre-created users: admin, tutor, client_user
    - Admin user is pre-authenticated by default
    - Helper methods to switch authentication
    """

    def setUp(self):
        """Set up authenticated test environment."""
        super().setUp()

        # Create standard test users using helper methods with Faker defaults
        self.admin = self.create_admin()
        self.tutor = self.create_tutor()
        self.client_user = self.create_client_user()

        # Authenticate as admin by default
        self.authenticate_as(self.admin)

    def authenticate_as_admin(self) -> None:
        """Switch authentication to admin user."""
        self.authenticate_as(self.admin)

    def authenticate_as_tutor(self) -> None:
        """Switch authentication to tutor user."""
        self.authenticate_as(self.tutor)

    def authenticate_as_client(self) -> None:
        """Switch authentication to client user."""
        self.authenticate_as(self.client_user)
