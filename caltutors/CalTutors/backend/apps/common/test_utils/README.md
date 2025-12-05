# Test Utilities

Common testing utilities for CalTutors backend tests using Factory Boy and Faker.

## Overview

This package provides:

- **Factories**: Factory Boy factories for creating test data with Faker
- **Base Test Cases**: Pre-configured test classes with common setup
- **Assertion Helpers**: Custom assertion functions for common testing patterns

## Quick Start

```python
from apps.common.test_utils import BaseAPITestCase, assert_response_has_keys

class MyAPITest(BaseAPITestCase):
    def test_something(self):
        # Create users with Faker-generated realistic data
        tutor = self.create_tutor()
        client = self.create_client_user()

        # All users have password = self.password (testpass123)
        self.authenticate_as(tutor)

        # Make API calls
        response = self.client.get('/api/some-endpoint/')

        # Use assertion helpers
        assert_response_has_keys(self, response.data, "id", "email", "name")
```

## Base Test Cases

### `BaseAPITestCase`

Basic test case with common setup for API testing.

**Features:**

- Pre-configured `APIClient` as `self.client`
- Standard password `self.password = "testpass123"`
- Helper methods for creating users
- Authentication helpers

**Helper Methods:**

- `create_tutor()` - Create a tutor with Faker data
- `create_client_user()` - Create a client with Faker data
- `create_admin()` - Create an admin with Faker data
- `create_superuser()` - Create a superuser with Faker data
- `create_student(client=None)` - Create a student with Faker data
- `authenticate_as(user)` - Authenticate as the given user
- `logout()` - Clear authentication
- `get_auth_token(user)` - Get auth token for a user

### `AuthenticatedAPITestCase`

Extends `BaseAPITestCase` with pre-created authenticated users.

**Pre-created Users:**

- `self.admin` - Admin user (authenticated by default)
- `self.tutor` - Tutor user
- `self.client_user` - Client user

**Additional Methods:**

- `authenticate_as_admin()` - Switch to admin user
- `authenticate_as_tutor()` - Switch to tutor user
- `authenticate_as_client()` - Switch to client user

**Example:**

```python
from apps.common.test_utils import AuthenticatedAPITestCase

class MyTest(AuthenticatedAPITestCase):
    def test_admin_endpoint(self):
        # Already authenticated as admin
        response = self.client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, 200)

    def test_tutor_endpoint(self):
        # Switch to tutor
        self.authenticate_as_tutor()
        response = self.client.get('/api/tutor/calendar/')
        self.assertEqual(response.status_code, 200)
```

## Factories

All factories use **Faker** to generate realistic, varied test data automatically.

### Available Factories

- `UserFactory` - Base user factory
- `TutorFactory` - Tutor users
- `ClientFactory` - Client users
- `AdminFactory` - Admin users with `is_staff=True`
- `SuperUserFactory` - Superusers with `is_staff=True, is_superuser=True`
- `StudentFactory` - Students (requires a client)

### Factory Defaults

All factories generate:

- **Email**: `user{n}@example.com` (sequential)
- **Username**: `user{n}` (sequential)
- **First/Last Name**: Faker-generated realistic names
- **Phone**: `+1555{n:07d}` (sequential, E.164 format)
- **Password**: Set via post-generation (use helper methods)

**Specific Defaults:**

- `TutorFactory`: `subjects_taught="Math, Physics, Chemistry"`
- `ClientFactory`: `balance=100.00`
- `AdminFactory`: `is_staff=True`
- `SuperUserFactory`: `is_staff=True, is_superuser=True`

## Assertion Helpers

### `assert_response_has_keys(test_case, response_data, *keys)`

Assert response contains all specified keys.

```python
assert_response_has_keys(self, response.data, "id", "email", "user_type")
```

### `assert_user_data_matches(test_case, response_data, user)`

Assert response data matches user's core fields.

```python
assert_user_data_matches(self, response.data, self.tutor)
```

### `assert_error_response(test_case, response_data, expected_message=None)`

Assert response is an error with optional message check.

```python
assert_error_response(self, response.data, "Invalid credentials")
```

## Best Practices

### ✅ DO

- Use `BaseAPITestCase` or `AuthenticatedAPITestCase` as base classes
- Use `self.create_*()` methods without arguments (let Faker do its job)
- Use `self.password` for all test user passwords
- Use assertion helpers for cleaner tests
- Let factories generate realistic, varied data

### ❌ DON'T

- Don't pass arguments to `create_*()` methods
- Don't use factories directly (use `self.create_*()` helpers)
- Don't hardcode test data (use Faker defaults)
- Don't create your own passwords (use `self.password`)

## Examples

### Basic API Test

```python
from apps.common.test_utils import BaseAPITestCase

class UserAPITest(BaseAPITestCase):
    def test_user_can_view_profile(self):
        user = self.create_tutor()
        self.authenticate_as(user)

        response = self.client.get('/api/accounts/profile/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], user.email)
```

### Test with Multiple Users

```python
from apps.common.test_utils import BaseAPITestCase

class SessionTest(BaseAPITestCase):
    def test_tutor_can_create_session_for_client(self):
        tutor = self.create_tutor()
        client = self.create_client_user()
        student = self.create_student(client=client)

        self.authenticate_as(tutor)

        response = self.client.post('/api/sessions/', {
            'student': student.id,
            'date': '2025-10-15',
            'hours': 2.0
        })

        self.assertEqual(response.status_code, 201)
```

### Using Pre-authenticated Test Case

```python
from apps.common.test_utils import AuthenticatedAPITestCase

class AdminDashboardTest(AuthenticatedAPITestCase):
    def test_admin_can_view_all_users(self):
        # Already authenticated as admin
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, 200)

    def test_non_admin_cannot_view_admin_dashboard(self):
        self.authenticate_as_tutor()
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, 403)
```

## Why Faker?

Using Faker ensures:

- **Realistic data**: Names, emails, etc. look real
- **Variety**: Each test run uses different data, catching edge cases
- **Less maintenance**: No hardcoded strings to update
- **Better coverage**: Varied data tests more scenarios

## Migration Guide

If you have existing tests using manual user creation:

### Before

```python
from django.contrib.auth import get_user_model
User = get_user_model()

class MyTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="pass123",
            first_name="John",
            last_name="Doe",
            username="johndoe",
            phone_number="+15551234567",
            user_type="tutor"
        )
```

### After

```python
from apps.common.test_utils import BaseAPITestCase

class MyTest(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_tutor()
        # self.password is "testpass123"
```

Much cleaner! 🎉
