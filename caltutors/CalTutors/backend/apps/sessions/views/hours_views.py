from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from apps.sessions.models import Hours
from apps.sessions.serializers import HoursSerializer, HoursCreateSerializer
from apps.accounts.models import Student
from apps.common.utils import flatten_serializer_errors
from logging import getLogger

logger = getLogger(__name__)


class HoursViewSet(ViewSet):
    """
    ViewSet for managing tutoring sessions (Hours).
    Provides list, create, retrieve, update, partial_update, and destroy actions.
    Includes custom actions for upcoming sessions and stats.
    """

    permission_classes = [IsAuthenticated]

    def _get_hours_queryset(self):
        """Helper method to get optimized hours queryset."""
        return Hours.objects.select_related("student", "tutor")

    def _get_user_filtered_queryset(self, user):
        """
        Get queryset filtered by user type for security.

        Returns queryset that the user has permission to view.
        """
        if user.user_type == "admin":
            return self._get_hours_queryset().all()
        elif user.user_type == "tutor":
            return self._get_hours_queryset().filter(tutor=user)
        elif user.user_type == "client":
            student_ids = Student.objects.filter(client=user).values_list(
                "id", flat=True
            )
            return self._get_hours_queryset().filter(student_id__in=student_ids)
        elif user.user_type == "student":
            try:
                student = Student.objects.get(client=user)
                return self._get_hours_queryset().filter(student=student)
            except Student.DoesNotExist:
                return Hours.objects.none()
        else:
            return Hours.objects.none()

    def _check_session_access(self, session, user, require_tutor=False):
        """
        Check if user has access to the session.

        Args:
            session: The Hours instance to check access for
            user: The user requesting access
            require_tutor: If True, only tutor or admin can access

        Returns:
            tuple: (has_access: bool, error_response: Response or None)
        """
        if require_tutor:
            if user.user_type == "admin" or user == session.tutor:
                return True, None

            messages = ["Only the tutor or admin can modify this session."]
            logger.info(f"Error: {messages}")
            return False, Response(
                {"error": "Permission denied.", "messages": messages},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check general access
        has_access = False

        if user.user_type == "admin":
            has_access = True
        elif user == session.tutor:
            has_access = True
        elif user.user_type == "client" and session.student.client == user:
            has_access = True
        elif user.user_type == "student":
            try:
                student = Student.objects.get(client=user)
                if student == session.student:
                    has_access = True
            except Student.DoesNotExist:
                pass

        if has_access:
            return True, None

        messages = ["You don't have permission to access this session."]
        logger.info(f"Error: {messages}")
        return False, Response(
            {"error": "Permission denied.", "messages": messages},
            status=status.HTTP_403_FORBIDDEN,
        )

    def list(self, request):
        """List all tutoring sessions with optional filtering."""
        queryset = self._get_user_filtered_queryset(request.user)

        # Apply additional filters
        tutor_id = request.query_params.get("tutor_id", None)
        if tutor_id:
            queryset = queryset.filter(tutor_id=tutor_id)

        student_id = request.query_params.get("student_id", None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        client_id = request.query_params.get("client_id", None)
        if client_id:
            client_student_ids = Student.objects.filter(
                client_id=client_id
            ).values_list("id", flat=True)
            queryset = queryset.filter(student_id__in=client_student_ids)

        sessions = queryset.order_by("start_time")
        serializer = HoursSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request):
        """Create a new tutoring session."""
        if request.user.user_type not in ["tutor", "admin"]:
            messages = ["Only tutors and admins can create sessions."]
            logger.info(f"Error: {messages}")
            return Response(
                {"error": "Permission denied.", "messages": messages},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = HoursCreateSerializer(data=request.data)
        if serializer.is_valid():
            session = serializer.save()
            logger.info(
                f"Session created: {session.id} - {session.tutor.first_name} tutoring {session.student.first_name}"
            )

            response_serializer = HoursSerializer(session)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        messages = flatten_serializer_errors(serializer.errors)
        logger.error(f"Session creation failed: {messages}")
        return Response(
            {"error": "Session creation failed.", "messages": messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, pk=None):
        """Retrieve a specific tutoring session."""
        try:
            session = self._get_hours_queryset().get(pk=pk)
        except Hours.DoesNotExist:
            return Response(
                {"error": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        has_access, error_response = self._check_session_access(session, request.user)
        if not has_access:
            return error_response

        serializer = HoursSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, pk=None):
        """Update a specific tutoring session (PUT)."""
        try:
            session = self._get_hours_queryset().get(pk=pk)
        except Hours.DoesNotExist:
            return Response(
                {"error": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        has_access, error_response = self._check_session_access(
            session, request.user, require_tutor=True
        )
        if not has_access:
            return error_response

        serializer = HoursSerializer(session, data=request.data)
        if serializer.is_valid():
            updated_session = serializer.save()
            logger.info(f"Session updated: {updated_session.id}")
            return Response(serializer.data, status=status.HTTP_200_OK)

        messages = flatten_serializer_errors(serializer.errors)
        logger.error(f"Session update failed: {messages}")
        return Response(
            {"error": "Session update failed.", "messages": messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def partial_update(self, request, pk=None):
        """Update a specific tutoring session (PATCH)."""
        try:
            session = self._get_hours_queryset().get(pk=pk)
        except Hours.DoesNotExist:
            return Response(
                {"error": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        has_access, error_response = self._check_session_access(
            session, request.user, require_tutor=True
        )
        if not has_access:
            return error_response

        serializer = HoursSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            updated_session = serializer.save()
            logger.info(f"Session partially updated: {updated_session.id}")
            return Response(serializer.data, status=status.HTTP_200_OK)

        messages = flatten_serializer_errors(serializer.errors)
        logger.error(f"Session partial update failed: {messages}")
        return Response(
            {"error": "Session update failed.", "messages": messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def destroy(self, request, pk=None):
        """Delete a specific tutoring session."""
        try:
            session = self._get_hours_queryset().get(pk=pk)
        except Hours.DoesNotExist:
            return Response(
                {"error": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        has_access, error_response = self._check_session_access(
            session, request.user, require_tutor=True
        )
        if not has_access:
            return error_response

        session_info = f"{session.tutor.first_name} tutoring {session.student.first_name} on {session.start_time}"
        session.delete()
        logger.info(f"Session deleted: {session_info}")
        return Response(
            {"message": "Session deleted successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="my-upcoming")
    def my_upcoming_sessions(self, request):
        """Get upcoming sessions for the current user (as student, client, or tutor)."""
        user = request.user
        filter_q = Q()

        if user.user_type == "tutor":
            filter_q = Q(tutor=user)
        elif user.user_type == "student":
            try:
                student = Student.objects.get(client=user)
                filter_q = Q(student=student)
            except Student.DoesNotExist:
                filter_q = Q(pk__in=[])
        elif user.user_type == "client":
            student_ids = Student.objects.filter(client=user).values_list(
                "id", flat=True
            )
            filter_q = Q(student_id__in=student_ids)
        else:
            filter_q = Q(pk__in=[])

        upcoming_sessions = (
            self._get_hours_queryset()
            .filter(filter_q, start_time__gt=timezone.now())
            .order_by("start_time")
        )

        serializer = HoursSerializer(upcoming_sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="stats")
    def session_stats(self, request):
        """Get session statistics for the current user."""
        user = request.user
        now = timezone.now()
        filter_q = Q()

        if user.user_type == "tutor":
            filter_q = Q(tutor=user)
        elif user.user_type == "student":
            try:
                student = Student.objects.get(client=user)
                filter_q = Q(student=student)
            except Student.DoesNotExist:
                filter_q = Q(pk__in=[])
        elif user.user_type == "client":
            student_ids = Student.objects.filter(client=user).values_list(
                "id", flat=True
            )
            filter_q = Q(student_id__in=student_ids)
        else:
            filter_q = Q(pk__in=[])

        user_sessions = Hours.objects.filter(filter_q)

        total_sessions = user_sessions.count()
        upcoming_sessions = user_sessions.filter(start_time__gt=now).count()

        past_sessions_count = 0
        total_hours = 0
        for session in user_sessions:
            session_end = session.start_time + timedelta(
                minutes=session.duration_minutes
            )
            if session_end < now:
                past_sessions_count += 1
                total_hours += session.duration_minutes / 60

        as_student = 0
        as_tutor = 0

        if user.user_type == "tutor":
            as_tutor = total_sessions
        elif user.user_type in ["student", "client"]:
            as_student = total_sessions

        stats = {
            "total_sessions": total_sessions,
            "upcoming_sessions": upcoming_sessions,
            "past_sessions": past_sessions_count,
            "total_hours": round(total_hours, 2),
            "sessions_as_student": as_student,
            "sessions_as_tutor": as_tutor,
        }

        return Response(stats, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="available-students")
    def available_students(self, request):
        """Get available students for session creation (tutors only with existing rates)."""
        user = request.user

        if user.user_type != "tutor":
            messages = ["Only tutors can access available students."]
            logger.info(f"Error: {messages}")
            return Response(
                {"error": "Permission denied.", "messages": messages},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get students who have a rate with this tutor
        from apps.sessions.models import Rate

        rates = Rate.objects.filter(tutor=user).select_related(
            "student", "student__client"
        )

        students_data = [
            {
                "id": rate.student.id,
                "first_name": rate.student.first_name,
                "last_name": rate.student.last_name,
                "email": rate.student.email or "",
                "client_name": rate.student.client.get_full_name(),
            }
            for rate in rates
            if rate.student.is_active
        ]

        return Response({"students": students_data}, status=status.HTTP_200_OK)
