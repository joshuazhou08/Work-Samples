"""
Common testing utilities for CalTutors backend tests.

This package provides reusable test fixtures, factories, and helper functions.

Usage:
    from apps.common.test_utils import BaseAPITestCase, AuthenticatedAPITestCase

    class MyTest(BaseAPITestCase):
        def test_something(self):
            # Create users with Faker-generated data
            tutor = self.create_tutor()
            client = self.create_client_user()

            # All users use self.password (testpass123) for authentication
            self.authenticate_as(tutor)

Factories use Faker to generate realistic test data automatically.
DO NOT pass arguments to create_* methods - use Faker defaults.
"""

from .factories import (
    UserFactory,
    TutorFactory,
    ClientFactory,
    AdminFactory,
    SuperUserFactory,
    StudentFactory,
)
from .base import BaseAPITestCase, AuthenticatedAPITestCase
from .assertions import (
    assert_response_has_keys,
    assert_user_data_matches,
    assert_error_response,
)

__all__ = [
    # Factories (use sparingly - prefer create_* methods in BaseAPITestCase)
    "UserFactory",
    "TutorFactory",
    "ClientFactory",
    "AdminFactory",
    "SuperUserFactory",
    "StudentFactory",
    # Base test cases (use these!)
    "BaseAPITestCase",
    "AuthenticatedAPITestCase",
    # Assertion helpers
    "assert_response_has_keys",
    "assert_user_data_matches",
    "assert_error_response",
]
