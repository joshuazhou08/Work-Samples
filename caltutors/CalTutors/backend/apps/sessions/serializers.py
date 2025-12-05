from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Hours, Rate
from apps.accounts.models import Student

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for session display"""

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]
        read_only_fields = ["id", "first_name", "last_name", "email"]


class StudentBasicSerializer(serializers.ModelSerializer):
    """Basic student info for session display"""

    client_name = serializers.CharField(source="client.get_full_name", read_only=True)
    client_email = serializers.CharField(source="client.email", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "client_name",
            "client_email",
        ]
        read_only_fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "client_name",
            "client_email",
        ]


class HoursSerializer(serializers.ModelSerializer):
    """Serializer for Hours (tutoring sessions) model"""

    # Read-only fields for displaying user info
    student_info = StudentBasicSerializer(source="student", read_only=True)
    tutor_info = UserBasicSerializer(source="tutor", read_only=True)

    # Rate information for this tutor-student pair and final charged rates
    student_rate = serializers.SerializerMethodField()
    tutor_rate = serializers.SerializerMethodField()

    # Computed fields
    end_time = serializers.DateTimeField(read_only=True)
    student_charged = serializers.BooleanField(read_only=True)
    tutor_paid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Hours
        fields = [
            "id",
            "student",
            "tutor",
            "student_info",
            "tutor_info",
            "student_rate",
            "tutor_rate",
            "start_time",
            "duration_minutes",
            "end_time",
            "student_charged",
            "tutor_paid",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "end_time",
            "student_charged",
            "tutor_paid",
            "student_rate",
            "tutor_rate",
        ]

    def validate_student(self, value):
        """Ensure the selected value is a valid student"""
        if not isinstance(value, Student):
            raise serializers.ValidationError("Selected value must be a student.")
        return value

    def validate_tutor(self, value):
        """Ensure the selected user is a tutor"""
        if value.user_type != "tutor":
            raise serializers.ValidationError("Selected user must be a tutor.")
        return value

    def validate_duration_minutes(self, value):
        """Ensure duration is reasonable (15 minutes to 8 hours)"""
        if value < 15:
            raise serializers.ValidationError(
                "Session duration must be at least 15 minutes."
            )
        if value > 480:  # 8 hours
            raise serializers.ValidationError(
                "Session duration cannot exceed 8 hours (480 minutes)."
            )
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Get student and tutor values (from data or existing instance)
        student = data.get("student")
        tutor = data.get("tutor")

        # For partial updates, use existing values if not provided in data
        if self.instance:
            student = student or self.instance.student
            tutor = tutor or self.instance.tutor

        # Ensure student and tutor are different users
        if student and tutor and student == tutor:
            raise serializers.ValidationError(
                "Student and tutor must be different users."
            )

        return data

    def get_student_rate(self, obj):
        """Get the student-facing rate for this session."""
        if obj.student_rate is not None:
            return obj.student_rate

        try:
            return Rate.objects.get(tutor=obj.tutor, student=obj.student).student_rate
        except Rate.DoesNotExist:
            return None

    def get_tutor_rate(self, obj):
        """Get the tutor payout rate for this session."""
        if obj.tutor_rate is not None:
            return obj.tutor_rate

        try:
            return Rate.objects.get(tutor=obj.tutor, student=obj.student).tutor_pay_rate
        except Rate.DoesNotExist:
            return None

class HoursCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating sessions"""

    class Meta:
        model = Hours
        fields = ["student", "tutor", "start_time", "duration_minutes"]

    def validate_student(self, value):
        """Ensure the selected value is a valid student"""
        if not isinstance(value, Student):
            raise serializers.ValidationError("Selected value must be a student.")
        return value

    def validate_tutor(self, value):
        if value.user_type != "tutor":
            raise serializers.ValidationError("Selected user must be a tutor.")
        return value

    def validate_duration_minutes(self, value):
        if value < 15:
            raise serializers.ValidationError(
                "Session duration must be at least 15 minutes."
            )
        if value > 480:
            raise serializers.ValidationError(
                "Session duration cannot exceed 8 hours (480 minutes)."
            )
        return value

    def validate(self, data):
        if data.get("student") == data.get("tutor"):
            raise serializers.ValidationError(
                "Student and tutor must be different users."
            )

        return data


class RateSerializer(serializers.ModelSerializer):
    """Serializer for Rate model"""

    # Read-only fields for displaying user info
    student_info = StudentBasicSerializer(source="student", read_only=True)
    tutor_info = UserBasicSerializer(source="tutor", read_only=True)

    class Meta:
        model = Rate
        fields = [
            "id",
            "student",
            "tutor",
            "student_info",
            "tutor_info",
            "tutor_pay_rate",
            "student_rate",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_student(self, value):
        """Ensure the selected value is a valid student"""
        if not isinstance(value, Student):
            raise serializers.ValidationError("Selected value must be a student.")
        return value

    def validate_tutor(self, value):
        """Ensure the selected user is a tutor"""
        if value.user_type != "tutor":
            raise serializers.ValidationError("Selected user must be a tutor.")
        return value

    def validate_tutor_pay_rate(self, value):
        """Validate tutor pay rate is positive"""
        if value <= 0:
            raise serializers.ValidationError("Tutor pay rate must be greater than 0.")
        return value

    def validate_student_rate(self, value):
        """Validate student rate is positive"""
        if value <= 0:
            raise serializers.ValidationError("Student rate must be greater than 0.")
        return value

    def validate(self, data):
        """Validate that tutor pay rate is not greater than student rate"""
        # For partial updates, we need to get the current values if not provided
        if hasattr(self, "instance") and self.instance:
            current_tutor_pay_rate = self.instance.tutor_pay_rate
            current_student_rate = self.instance.student_rate
        else:
            current_tutor_pay_rate = None
            current_student_rate = None

        tutor_pay_rate = data.get("tutor_pay_rate", current_tutor_pay_rate)
        student_rate = data.get("student_rate", current_student_rate)

        if tutor_pay_rate and student_rate and tutor_pay_rate > student_rate:
            raise serializers.ValidationError(
                "Tutor pay rate cannot be greater than student rate."
            )

        # Only validate student/tutor relationship if both are provided
        student = data.get("student")
        tutor = data.get("tutor")
        if student and tutor and student == tutor:
            raise serializers.ValidationError(
                "Student and tutor must be different users."
            )

        return data
