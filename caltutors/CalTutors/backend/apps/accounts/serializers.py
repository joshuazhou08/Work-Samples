from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.validators import RegexValidator
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from apps.accounts.models import User
import phonenumbers
import stripe
import logging

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - used for profile data"""

    subjects_list = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "username",
            "phone_number",
            "timezone",
            "user_type",
            "subjects_taught",
            "subjects_list",
            "date_joined",
            "balance",
            "billing_status",
        ]
        read_only_fields = ["id", "date_joined", "subjects_list", "balance", "billing_status"]

    def get_subjects_list(self, obj):
        """Return subjects as a clean list"""
        return obj.get_subjects_list()

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            "min_length": "Password must be at least 8 characters long.",
            "required": "Password is required.",
            "blank": "Password cannot be empty.",
        },
    )
    password_confirm = serializers.CharField(
        write_only=True,
        error_messages={
            "required": "Password confirmation is required.",
            "blank": "Password confirmation cannot be empty.",
        },
    )
    phone_number = serializers.CharField(
        error_messages={
            "required": "Phone number is required.",
            "blank": "Phone number cannot be empty.",
        }
    )
    email = serializers.EmailField(
        error_messages={
            "required": "Email is required.",
            "blank": "Email cannot be empty.",
            "invalid": "Enter a valid email address.",
        }
    )
    username = serializers.CharField(
        error_messages={
            "required": "Username is required.",
            "blank": "Username cannot be empty.",
        }
    )

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "username",
            "phone_number",
            "user_type",
            "password",
            "password_confirm",
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )
        return value

    def validate_phone_number(self, value):
        """Validate phone number is in E.164 format"""
        if not value:
            raise serializers.ValidationError("Phone number is required.")

        # Check if it's in E.164 format
        try:
            # Parse the string into a PhoneNumber object
            pn = phonenumbers.parse(value, None)
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(
                "Phone number must be in E.164 format (e.g., +15551234567)"
            )

        if not phonenumbers.is_valid_number(pn):
            raise serializers.ValidationError(
                "Phone number must be in E.164 format (e.g., +15551234567)"
            )

        # Check if phone number already exists
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError(
                "A user with this phone number already exists."
            )

        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        # Remove password_confirm from validated_data
        validated_data.pop("password_confirm", None)
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            username=validated_data["username"],
            phone_number=validated_data["phone_number"],
            user_type=validated_data["user_type"],
        )
        # If not a client, just return (no Stripe customer needed)
        if user.user_type != "client":
            return user

        # ----------------------------------------
        # Create Stripe Customer
        # ----------------------------------------
        try:
            existing = stripe.Customer.list(email=user.email, limit=1)
            if existing.get("data"):
                customer = existing['data'][0]
            else:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.get_full_name(),
                    metadata={"user_id": user.id},
                )
            user.stripe_customer_id = customer["id"]
            user.billing_status = User.BillingStatus.MISSING
            user.save(update_fields=["stripe_customer_id", "billing_status"])

        except stripe.error.StripeError as exc:
            logger.error(f"Stripe customer creation failed for {user.email}: {exc}")
            return user  # user still gets created normally

        # ----------------------------------------
        # Give 30 free credits (Stripe customer balance)
        # ----------------------------------------
        try:
            stripe.Customer.create_balance_transaction(
                customer["id"],
                amount=-3000,  # negative = credit
                currency="usd",
                description="Welcome bonus: $30 tutoring credits",
            )
            logger.info(f"Granted $30 free credits to {user.email}")

        except stripe.error.StripeError as exc:
            logger.error(
                f"Failed to apply welcome credits for {user.email}: {exc}"
            )

        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        if not email:
            raise serializers.ValidationError({"email": "This field is required."})
        if not password:
            raise serializers.ValidationError({"password": "This field is required."})

        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError(
                {"credentials": "Invalid email or password."}
            )

        data["user"] = user
        return data

class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset"""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        """Validate the token and passwords"""
        uid = data.get("uid")
        token = data.get("token")
        new_password = data.get("new_password")
        new_password_confirm = data.get("new_password_confirm")

        # Check if passwords match
        if new_password != new_password_confirm:
            raise serializers.ValidationError("Passwords do not match.")

        # Decode uid and get user
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid reset link.")

        # Check if token is valid
        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError("Invalid or expired reset link.")

        data["user"] = user
        return data

    def save(self):
        """Reset the user's password"""
        user = self.validated_data["user"]
        new_password = self.validated_data["new_password"]

        user.set_password(new_password)
        user.save()

        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile contact details"""

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "timezone",
        ]
        extra_kwargs = {
            "phone_number": {
                "error_messages": {
                    "blank": "Phone number cannot be empty.",
                    "null": "Phone number cannot be empty.",
                }
            }
        }

    def validate_email(self, value):
        """Validate email is unique (excluding current user)"""
        user = self.instance
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate username is unique (excluding current user)"""
        user = self.instance
        if User.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )
        return value

    def validate_first_name(self, value):
        """Ensure first name is not blank and trim whitespace."""
        if value is None:
            return value
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("First name cannot be empty.")
        return trimmed

    def validate_last_name(self, value):
        """Ensure last name is not blank and trim whitespace."""
        if value is None:
            return value
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Last name cannot be empty.")
        return trimmed

    def validate_phone_number(self, value):
        """Validate phone number format and uniqueness (excluding current user)"""
        user = self.instance
        if not value:
            raise serializers.ValidationError("Phone number cannot be empty.")

        try:
            parsed_number = phonenumbers.parse(value, None)
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(
                "Phone number must be in E.164 format (e.g., +15551234567)"
            )

        if not phonenumbers.is_valid_number(parsed_number):
            raise serializers.ValidationError(
                "Phone number must be in E.164 format (e.g., +15551234567)"
            )

        normalized_value = phonenumbers.format_number(
            parsed_number, phonenumbers.PhoneNumberFormat.E164
        )

        if (
            User.objects.filter(phone_number=normalized_value)
            .exclude(id=user.id)
            .exists()
        ):
            raise serializers.ValidationError(
                "A user with this phone number already exists."
            )

        return normalized_value

    def validate_timezone(self, value):
        """Validate timezone is a valid IANA identifier."""
        if value is None:
            return value

        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Timezone cannot be empty.")

        try:
            ZoneInfo(trimmed)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError("Invalid timezone selected.")

        return trimmed
    
    def update(self, instance, validated_data):
        old_email = instance.email
        new_email = validated_data.get("email", instance.email)

        instance = super().update(instance, validated_data)
        # If email changed and user is a client, update Stripe customer
        if old_email != new_email and instance.user_type == "client":   
            try:
                if instance.stripe_customer_id:
                    stripe.Customer.modify(
                        instance.stripe_customer_id,
                        email=new_email,
                    )
                    logger.info(
                        f"Updated Stripe customer email for user {instance.email}"
                    )
            except stripe.error.StripeError as exc:
                logger.error(
                    f"Failed to update Stripe customer email for {instance.email}: {exc}"
                )

        return instance
