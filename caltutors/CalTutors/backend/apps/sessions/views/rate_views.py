from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.sessions.models import Rate
from apps.sessions.serializers import RateSerializer
from apps.accounts.models import Student
from logging import getLogger

User = get_user_model()
logger = getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_rates(request, student_id):
    """Get all rates for a specific student"""
    # Only admins and the student's client can view student rates
    if request.user.user_type not in ["admin", "client"]:
        messages = ["Only admins and clients can view student rates."]
        logger.info(f"Error: {messages}")
        return Response(
            {"error": "Permission denied.", "messages": messages},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        student = Student.objects.get(id=student_id)

        # If user is a client, they can only view their own students' rates
        if request.user.user_type == "client" and student.client != request.user:
            messages = ["You can only view rates for your own students."]
            logger.info(f"Error: {messages}")
            return Response(
                {"error": "Permission denied.", "messages": messages},
                status=status.HTTP_403_FORBIDDEN,
            )

    except Student.DoesNotExist:
        messages = ["Student not found."]
        logger.info(f"Error: {messages}")
        return Response(
            {"error": "Student not found.", "messages": messages},
            status=status.HTTP_404_NOT_FOUND,
        )

    rates = Rate.objects.filter(student=student).select_related("tutor")
    serializer = RateSerializer(rates, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tutor_rates(request, tutor_id):
    """Get all rates for a specific tutor"""
    # Only admins and the tutor themselves can view tutor rates
    if request.user.user_type != "admin" and request.user.id != int(tutor_id):
        messages = ["You can only view your own rates."]
        logger.info(f"Error: {messages}")
        return Response(
            {"error": "Permission denied.", "messages": messages},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        tutor = User.objects.get(id=tutor_id, user_type="tutor")
    except User.DoesNotExist:
        messages = ["Tutor not found."]
        logger.info(f"Error: {messages}")
        return Response(
            {"error": "Tutor not found.", "messages": messages},
            status=status.HTTP_404_NOT_FOUND,
        )

    rates = Rate.objects.filter(tutor=tutor).select_related("student")
    serializer = RateSerializer(rates, many=True)
    return Response(serializer.data)
