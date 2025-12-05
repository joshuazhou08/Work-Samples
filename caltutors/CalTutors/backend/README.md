# CalTutors-Backend

The new django caltutors backend for tutors and admin.

# Response structure:

## Success Responses

Status Code: 200 (or 201 for created resources)

Body: returns the expected data payload.

Example (Login success):

```bash
{
  "token": "abc123",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "username": "admin",
    "phone_number": "+15555555555",
    "user_type": "tutor",
    "is_staff": true,
    "is_superuser": true,
    "balance": 100
  }
}
```

## Failed Responses

Status Code: 400 for validation errors, 401 for authentication failures, 403 for forbidden, 404 for not found, etc.

Body: always returns an error field with a human-readable message, and optionally a details object for field-level validation errors.

Example (Login failure – wrong password):

```bash
{
  "error": "Login Failed",
  "messages": ["Invalid email or password."]
}
```

## Running locally

Celery (in a separate terminal). This should all be done from the backend/ directory.

```bash
uv run celery -A CalTutors worker --loglevel=info
```

Beat (in a separate terminal)

```bash
uv run celery -A CalTutors beat --loglevel=info
```

Django server (in a separate terminal)

```bash
uv run manage.py runserver
```
