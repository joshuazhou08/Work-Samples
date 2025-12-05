"""
Factory Boy factories for creating test data.

These factories use Factory Boy to generate consistent, realistic test data
with sensible defaults while allowing customization as needed.
"""

import factory
from factory.django import DjangoModelFactory
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class UserFactory(DjangoModelFactory):
    """Base factory for creating User instances."""

    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone_number = factory.Sequence(lambda n: f"+1555{n:07d}")
    user_type = "client"
    balance = Decimal("0.00")
    is_active = True
    is_staff = False

    @factory.post_generation
    def password(obj, create, extracted, **kwargs):
        """Set password after user creation."""
        if not create:
            return
        password = extracted if extracted else "testpass123"
        obj.set_password(password)
        obj.save()


class TutorFactory(UserFactory):
    """Factory for creating Tutor users."""

    email = factory.Sequence(lambda n: f"tutor{n}@example.com")
    username = factory.Sequence(lambda n: f"tutor{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    user_type = "tutor"
    subjects_taught = "Math, Physics, Chemistry"
    balance = Decimal("0.00")


class ClientFactory(UserFactory):
    """Factory for creating Client users."""

    email = factory.Sequence(lambda n: f"client{n}@example.com")
    username = factory.Sequence(lambda n: f"client{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    user_type = "client"
    balance = Decimal("100.00")


class AdminFactory(UserFactory):
    """Factory for creating Admin users with staff privileges."""

    email = factory.Sequence(lambda n: f"admin{n}@example.com")
    username = factory.Sequence(lambda n: f"admin{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    user_type = "admin"
    is_staff = True
    balance = Decimal("0.00")


class SuperUserFactory(UserFactory):
    """Factory for creating SuperUser instances."""

    email = factory.Sequence(lambda n: f"superuser{n}@example.com")
    username = factory.Sequence(lambda n: f"superuser{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    user_type = "admin"
    is_staff = True
    is_superuser = True
    balance = Decimal("0.00")


class StudentFactory(DjangoModelFactory):
    """Factory for creating Student instances under a client."""

    class Meta:
        model = "accounts.Student"

    client = factory.SubFactory(ClientFactory)
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.Sequence(lambda n: f"student{n}@example.com")
    phone_number = factory.Sequence(lambda n: f"+1555{n:07d}")
    grade_level = "9th Grade"
    subjects_studying = "Math, Science"
    notes = ""
    is_active = True
