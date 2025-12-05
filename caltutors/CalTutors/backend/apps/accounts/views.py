from decimal import Decimal
from logging import getLogger

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers import (
    UserRegistrationSerializer,
    LoginSerializer,
    UserSerializer,
    PasswordResetConfirmSerializer,
    UserProfileUpdateSerializer,
)
from apps.accounts.models import User
from apps.common.utils import flatten_serializer_errors
from apps.emails import send_info_email

logger = getLogger(__name__)


class UserRegistrationView(APIView):
    """
    View for user registration (both students and tutors)
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            logger.info(f"User {user.email} registered successfully")

            full_name = " ".join(filter(None, [user.first_name, user.last_name])).strip() or "N/A"
            subject = "New CalTutors Account Created"
            message = (
                "A new user account has been created.\n\n"
                f"Name: {full_name}\n"
                f"Email: {user.email}\n"
                f"User type: {user.user_type}\n"
            )
            if send_info_email("caltutorsteam@gmail.com", subject, message):
                logger.info("Account creation notification email sent to CalTutors team")
            else:
                logger.error("Failed to send account creation notification email to CalTutors team")

            full_name = " ".join(filter(None, [user.first_name, user.last_name])).strip() or "N/A"
            subject = "New CalTutors Account Created"
            message = (
                "A new user account has been created.\n\n"
                f"Name: {full_name}\n"
                f"Email: {user.email}\n"
                f"User type: {user.user_type}\n"
            )
            if send_info_email("caltutorsteam@gmail.com", subject, message):
                logger.info("Account creation notification email sent to CalTutors team")
            else:
                logger.error("Failed to send account creation notification email to CalTutors team")

            return Response(
                {
                    "message": "Account created successfully.",
                    "token": token.key,
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        # Flatten errors like in login
        messages = flatten_serializer_errors(serializer.errors)

        logger.error(f"User registration failed: {messages}")
        return Response(
            {
                "error": "Registration failed.",
                "messages": messages,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(APIView):
    """View for user login"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            token, _ = Token.objects.get_or_create(user=user)

            return Response(
                {
                    "token": token.key,
                    "user": UserSerializer(user).data,  # consistent format
                },
                status=status.HTTP_200_OK,
            )
        # flatten all messages into one array (or string)
        messages = flatten_serializer_errors(serializer.errors)
        return Response(
            {
                "error": "Login failed.",
                "messages": messages,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# Auth ping
@api_view(["HEAD", "GET"])
@permission_classes([IsAuthenticated])
def auth_ping(request):
    # Auth passed if we got here
    return Response(status=204)



class PasswordResetRequestView(APIView):
    """
    View for requesting password reset
    """

    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        if not email:
            message = "Email field is required."
            logger.error(f"Password reset request failed: {message}")
            return Response(
                {
                    "error": "Password reset request failed.",
                    "messages": [message],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email, is_active=True).first()
        if user:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = (
                f"{settings.FRONTEND_URL}/accounts/password-reset/confirm/{uid}/{token}/"
            )
            subject = "Password Reset - CalTutors"
            message = (
                f"Hello {user.first_name or user.email},\n\n"
                "You requested a password reset for your CalTutors account.\n\n"
                "Click the link below to reset your password:\n"
                f"{reset_url}\n\n"
                "This link will expire in 1 hour.\n\n"
                "If you didn't request this password reset, please ignore this email.\n\n"
                "Best regards,\n"
                "The CalTutors Team"
            )
            if send_info_email(email, subject, message):
                logger.info(f"Password reset email sent to {email}")
            else:
                logger.error(f"Password reset email failed to send to {email}")
        else:
            logger.info(f"Password reset requested for email: {email or 'unknown'}, but this email doesn't exist")

        return Response(
            {
                "message": "If an account with this email exists, you will receive password reset instructions."
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    View for confirming password reset
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"Password reset completed for user: {user.email}")
            return Response(
                {
                    "message": "Password has been reset successfully. You can now log in with your new password."
                },
                status=status.HTTP_200_OK,
            )

        messages = flatten_serializer_errors(serializer.errors)
        logger.error(f"Password reset confirmation failed: {serializer.errors}")
        return Response(
            {
                "error": "Password reset failed.",
                "messages": messages,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class UserProfileUpdateView(APIView):
    """
    View for updating user profile (email and username)
    Available to authenticated users (clients and tutors)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user profile"""
        user = request.user
        serializer = UserProfileUpdateSerializer(user)
        return Response({"user": serializer.data}, status=status.HTTP_200_OK)

    def patch(self, request):
        """Update user profile"""
        user = request.user
        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = serializer.save()
            logger.info(f"Profile updated for user: {updated_user.email}")

            return Response(
                {
                    "message": "Profile updated successfully.",
                    "user": UserSerializer(updated_user).data,
                },
                status=status.HTTP_200_OK,
            )

        messages = flatten_serializer_errors(serializer.errors)
        logger.error(
            f"Profile update failed for user {user.email}: {serializer.errors}",
        )
        return Response(
            {
                "error": "Profile update failed.",
                "messages": messages,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current user's full data including balance
    Available to all authenticated users
    """
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)
