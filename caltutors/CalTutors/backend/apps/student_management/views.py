from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import Student
from apps.student_management.serializers import (
    StudentCreateSerializer,
    StudentSerializer,
)


class StudentViewSet(viewsets.ViewSet):
    """
    Unified student management viewset accessible by clients and admins.
    - Clients can manage their own active students with soft delete behaviour.
    - Admins can manage all students (including hard delete).
    """

    permission_classes = [IsAuthenticated]

    def _check_access(self, user):
        if user.user_type != "client" and not user.is_staff:
            return Response(
                {
                    "error": "Access denied. Only clients and admins can manage students."
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def _base_queryset(self):
        return Student.objects.filter(is_active=True)

    def _get_queryset_for_user(self, user):
        queryset = self._base_queryset()
        if user.is_staff:
            return queryset
        return queryset.filter(client=user, is_active=True)

    def _get_student_for_user(self, user, student_id):
        try:
            if user.is_staff:
                return Student.objects.get(id=student_id)
            return Student.objects.get(id=student_id, client=user)
        except Student.DoesNotExist:
            return None

    def list(self, request):
        error_response = self._check_access(request.user)
        if error_response:
            return error_response

        queryset = self._get_queryset_for_user(request.user)
        serializer = StudentSerializer(queryset, many=True, context={"request": request})
        return Response(
            {"students": serializer.data, "count": queryset.count()},
            status=status.HTTP_200_OK,
        )

    def retrieve(self, request, pk=None):
        error_response = self._check_access(request.user)
        if error_response:
            return error_response

        student = self._get_student_for_user(request.user, pk)
        if not student:
            return Response(
                {"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = StudentSerializer(student, context={"request": request})
        return Response({"student": serializer.data}, status=status.HTTP_200_OK)

    def create(self, request):
        error_response = self._check_access(request.user)
        if error_response:
            return error_response

        user = request.user
        client = None

        if user.is_staff:
            client_id = request.data.get("client")
            if not client_id:
                return Response(
                    {
                        "message": "Student creation failed.",
                        "errors": {"client": ["Client ID is required."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            client = (
                get_user_model()
                .objects.filter(id=client_id, user_type="client")
                .first()
            )
            if not client:
                return Response(
                    {
                        "message": "Student creation failed.",
                        "errors": {"client": ["Invalid client ID."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            client = user

        serializer = StudentCreateSerializer(
            data=request.data, context={"request": request, "client": client}
        )
        if serializer.is_valid():
            student = serializer.save(client=client)
            output = StudentSerializer(student, context={"request": request}).data
            return Response(
                {"message": "Student created successfully.", "student": output},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"message": "Student creation failed.", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, pk=None):
        return self._update_student(request, pk, partial=True)

    def partial_update(self, request, pk=None):
        return self._update_student(request, pk, partial=True)

    def _update_student(self, request, pk, partial):
        error_response = self._check_access(request.user)
        if error_response:
            return error_response

        student = self._get_student_for_user(request.user, pk)
        if not student:
            return Response(
                {"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = StudentSerializer(
            student, data=request.data, partial=partial, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Student updated successfully.", "student": serializer.data},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"message": "Failed to update student.", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def destroy(self, request, pk=None):
        error_response = self._check_access(request.user)
        if error_response:
            return error_response

        student = self._get_student_for_user(request.user, pk)
        if not student:
            return Response(
                {"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if request.user.is_staff:
            student.delete()
            return Response(
                {"message": "Student deleted successfully."},
                status=status.HTTP_200_OK,
            )

        student.is_active = False
        student.save()
        return Response(
            {"message": "Student deactivated successfully."},
            status=status.HTTP_200_OK,
        )
