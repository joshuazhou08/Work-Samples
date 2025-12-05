"""
Custom assertion helpers for testing.

Provides reusable assertion functions for common testing patterns.
"""

from typing import Dict, Optional, TYPE_CHECKING
from rest_framework.test import APITestCase

if TYPE_CHECKING:
    from django.contrib.auth import get_user_model

    User = get_user_model()


def assert_response_has_keys(
    test_case: APITestCase, response_data: Dict, *keys: str
) -> None:
    """
    Assert that response data contains all specified keys.

    Args:
        test_case: The test case instance (for assertions)
        response_data: The response data dict
        *keys: Variable number of keys to check for
    """
    for key in keys:
        test_case.assertIn(key, response_data, f"Response missing key: {key}")


def assert_user_data_matches(
    test_case: APITestCase, response_data: Dict, user: "User"
) -> None:
    """
    Assert that response data matches the given user's core fields.

    Args:
        test_case: The test case instance (for assertions)
        response_data: The response data dict
        user: The user to compare against
    """
    test_case.assertEqual(response_data.get("email"), user.email)
    test_case.assertEqual(response_data.get("first_name"), user.first_name)
    test_case.assertEqual(response_data.get("last_name"), user.last_name)
    test_case.assertEqual(response_data.get("user_type"), user.user_type)


def assert_error_response(
    test_case: APITestCase,
    response_data: Dict,
    expected_error_message: Optional[str] = None,
) -> None:
    """
    Assert that response is an error response with standard structure.

    Args:
        test_case: The test case instance (for assertions)
        response_data: The response data dict
        expected_error_message: Optional specific error message to check for
    """
    test_case.assertIn("error", response_data)

    if expected_error_message:
        # Check if error message appears in either 'error' field or 'messages' list
        error_text = str(response_data.get("error", ""))
        messages = response_data.get("messages", [])

        found = expected_error_message in error_text or any(
            expected_error_message in str(msg) for msg in messages
        )

        test_case.assertTrue(
            found,
            f"Expected error message '{expected_error_message}' not found in response",
        )
