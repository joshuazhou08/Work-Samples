from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.db import models
from django.shortcuts import get_object_or_404
from .models import Hours, Rate
from .serializers import HoursSerializer, HoursCreateSerializer, RateSerializer
from logging import getLogger
from apps.accounts.models import Student

logger = getLogger(__name__)
User = get_user_model()


class HoursListCreateView(APIView):
    """
    List all tutoring sessions or create a new session.
    GET: Returns all sessions (with optional filtering)
    POST: Creates a new tutoring session
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.accounts.models import Student

        user = request.user

        # Build base filter based on user type for security
        if user.user_type == "admin":
            # Admins can see all sessions
            base_queryset = Hours.objects.select_related("student", "tutor").all()
        elif user.user_type == "tutor":
            # Tutors can only see their own sessions
            base_queryset = Hours.objects.select_related("student", "tutor").filter(
                tutor=user
            )
        elif user.user_type == "client":
            # Clients can only see sessions for their students
            student_ids = Student.objects.filter(client=user).values_list(
                "id", flat=True
            )
            base_queryset = Hours.objects.select_related("student", "tutor").filter(
                student_id__in=student_ids
            )
        elif user.user_type == "student":
            # Students can see sessions where they are the student
            try:
                student = Student.objects.get(client=user)
                base_queryset = Hours.objects.select_related("student", "tutor").filter(
                    student=student
                )
            except Student.DoesNotExist:
                base_queryset = Hours.objects.none()
        else:
            # Other user types get no sessions
            base_queryset = Hours.objects.none()

        # Apply additional filters
        queryset = base_queryset

        # Filter by tutor_id
        tutor_id = request.query_params.get("tutor_id", None)
        if tutor_id:
            queryset = queryset.filter(tutor_id=tutor_id)

        # Filter by student_id
        student_id = request.query_params.get("student_id", None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        # Filter by client_id (sessions for all students of a specific client)
        client_id = request.query_params.get("client_id", None)
        if client_id:
            client_student_ids = Student.objects.filter(
                client_id=client_id
            ).values_list("id", flat=True)
            queryset = queryset.filter(student_id__in=client_student_ids)

        sessions = queryset.order_by("start_time")
        serializer = HoursSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Only tutors can create sessions
        if request.user.user_type != "tutor" and request.user.user_type != "admin":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Only tutors can create sessions.")

        serializer = HoursCreateSerializer(data=request.data)
        if serializer.is_valid():
            session = serializer.save()
            logger.info(
                f"Session created: {session.id} - {session.tutor.first_name} tutoring {session.student.first_name}"
            )

            # Return full session data
            response_serializer = HoursSerializer(session)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        logger.error(f"Session creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HoursDetailView(APIView):
    """
    Retrieve, update, or delete a specific tutoring session.
    GET: Returns session details
    PUT/PATCH: Updates session details
    DELETE: Deletes the session
    """

    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user, require_tutor=False):
        session = get_object_or_404(
            Hours.objects.select_related("student", "tutor"), pk=pk
        )

        # Check if user has access to this session
        has_access = False

        if user.user_type == "admin":
            has_access = True
        elif user == session.tutor:
            has_access = True
        elif user.user_type == "client" and session.student.client == user:
            # Client can access sessions of their students
            has_access = True
        elif user.user_type == "student":
            # Check if this user is associated with the student in the session
            from apps.accounts.models import Student

            try:
                student = Student.objects.get(client=user)
                if student == session.student:
                    has_access = True
            except Student.DoesNotExist:
                pass

        # For read access: Allow if user has access
        if not require_tutor:
            if has_access:
                return session
        else:
            # For mutations: Only allow admin or the tutor who owns the session
            if user.user_type == "admin" or user == session.tutor:
                return session

        from rest_framework.exceptions import PermissionDenied

        if require_tutor:
            raise PermissionDenied("Only the tutor can modify this session.")
        else:
            raise PermissionDenied("You don't have permission to access this session.")

    def get(self, request, pk):
        session = self.get_object(pk, request.user)
        serializer = HoursSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        session = self.get_object(pk, request.user, require_tutor=True)
        serializer = HoursSerializer(session, data=request.data)
        if serializer.is_valid():
            updated_session = serializer.save()
            logger.info(f"Session updated: {updated_session.id}")
            return Response(serializer.data, status=status.HTTP_200_OK)

        logger.error(f"Session update failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        session = self.get_object(pk, request.user, require_tutor=True)
        serializer = HoursSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            updated_session = serializer.save()
            logger.info(f"Session partially updated: {updated_session.id}")
            return Response(serializer.data, status=status.HTTP_200_OK)

        logger.error(f"Session partial update failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        session = self.get_object(pk, request.user, require_tutor=True)
        session_info = f"{session.tutor.first_name} tutoring {session.student.first_name} on {session.start_time}"
        session.delete()
        logger.info(f"Session deleted: {session_info}")
        return Response(
            {"message": "Session deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_upcoming_sessions(request):
    """Get upcoming sessions for the current user (as student or tutor)"""
    from django.utils import timezone
    from apps.accounts.models import Student

    user = request.user

    # Build filter based on user type
    filter_q = Q()

    if user.user_type == "tutor":
        filter_q = Q(tutor=user)
    elif user.user_type == "student":
        try:
            student = Student.objects.get(client=user)
            filter_q = Q(student=student)
        except Student.DoesNotExist:
            filter_q = Q(pk__in=[])  # No sessions if student doesn't exist
    elif user.user_type == "client":
        # For clients, get sessions for all their students
        student_ids = Student.objects.filter(client=user).values_list("id", flat=True)
        filter_q = Q(student_id__in=student_ids)
    else:
        filter_q = Q(pk__in=[])  # No sessions for other user types

    upcoming_sessions = (
        Hours.objects.select_related("student", "tutor")
        .filter(filter_q, start_time__gt=timezone.now())
        .order_by("start_time")
    )

    serializer = HoursSerializer(upcoming_sessions, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def session_stats(request):
    """Get session statistics for the current user"""
    from django.utils import timezone
    from datetime import timedelta
    from apps.accounts.models import Student

    user = request.user
    now = timezone.now()

    # Build filter based on user type
    filter_q = Q()

    if user.user_type == "tutor":
        filter_q = Q(tutor=user)
    elif user.user_type == "student":
        try:
            student = Student.objects.get(client=user)
            filter_q = Q(student=student)
        except Student.DoesNotExist:
            filter_q = Q(pk__in=[])  # No sessions if student doesn't exist
    elif user.user_type == "client":
        # For clients, get sessions for all their students
        student_ids = Student.objects.filter(client=user).values_list("id", flat=True)
        filter_q = Q(student_id__in=student_ids)
    else:
        filter_q = Q(pk__in=[])  # No sessions for other user types

    # Base queryset for user's sessions
    user_sessions = Hours.objects.filter(filter_q)

    # Calculate stats
    total_sessions = user_sessions.count()
    upcoming_sessions = user_sessions.filter(start_time__gt=now).count()

    # Past sessions (ended)
    past_sessions_count = 0
    total_hours = 0
    for session in user_sessions:
        session_end = session.start_time + timedelta(minutes=session.duration_minutes)
        if session_end < now:
            past_sessions_count += 1
            total_hours += session.duration_minutes / 60

    # Sessions as student vs tutor - calculate based on user type
    as_student = 0
    as_tutor = 0

    if user.user_type == "tutor":
        as_tutor = total_sessions
    elif user.user_type in ["student", "client"]:
        as_student = total_sessions
    # For admin users, we could calculate both, but for now set both to 0

    stats = {
        "total_sessions": total_sessions,
        "upcoming_sessions": upcoming_sessions,
        "past_sessions": past_sessions_count,
        "total_hours": round(total_hours, 2),
        "sessions_as_student": as_student,
        "sessions_as_tutor": as_tutor,
    }

    return Response(stats)


# Rate utility views moved to views/rate_views.py
# Charge views moved to apps.payments.views.charge_views
