from datetime import timedelta
from django.utils.timezone import now
from rest_framework import serializers
from apps.accounts.models import User, Student
from apps.sessions.models import Rate
from apps.accounts.serializers import UserSerializer


class AdminUserSerializer(UserSerializer):
    """Base serializer for admin user views with shared fields"""

    is_recently_active = serializers.SerializerMethodField()
    notices = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["is_recently_active", "notices"]
        read_only_fields = list(UserSerializer.Meta.read_only_fields) + [
            "is_recently_active",
            "notices",
        ]

    def get_is_recently_active(self, obj):
        if not obj.last_session_at:
            return False

        return obj.last_session_at >= now() - timedelta(days=30)

    def get_notices(self, obj):
        notices = []
        if obj.user_type == "tutor":
            if not Rate.objects.filter(tutor=obj).exists():
                notices.append("No students")
        elif obj.user_type == "client":
            if not Student.objects.filter(client=obj, is_active=True).exists():
                notices.append("No students")

        if obj.billing_status == User.BillingStatus.INVALID or (
            obj.user_type == "client"
            and obj.billing_status == User.BillingStatus.MISSING
        ):
            notices.append("Missing billing")

        return notices


class AdminTutorSerializer(AdminUserSerializer):
    """Serializer for tutors with computed hasActiveStudents field"""

    hasActiveStudents = serializers.SerializerMethodField()

    class Meta(AdminUserSerializer.Meta):
        fields = AdminUserSerializer.Meta.fields + ["hasActiveStudents"]
        read_only_fields = list(AdminUserSerializer.Meta.read_only_fields) + [
            "hasActiveStudents"
        ]

    def get_hasActiveStudents(self, obj):
        """Check if tutor has any active student assignments (rates)"""
        return Rate.objects.filter(tutor=obj).exists()
    



class AdminClientSerializer(AdminUserSerializer):
    """Serializer for clients with computed hasStudents field"""

    hasStudents = serializers.SerializerMethodField()

    class Meta(AdminUserSerializer.Meta):
        fields = AdminUserSerializer.Meta.fields + ["hasStudents"]
        read_only_fields = list(AdminUserSerializer.Meta.read_only_fields) + [
            "hasStudents"
        ]

    def get_hasStudents(self, obj):
        """Check if client has any students"""
        return Student.objects.filter(client=obj, is_active=True).exists()


class AdminStudentSerializer(serializers.ModelSerializer):
    """Serializer for students with computed hasTutors field"""

    subjects_list = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    hasTutors = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id",
            "client",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "grade_level",
            "subjects_studying",
            "subjects_list",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
            "client_name",
            "hasTutors",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "subjects_list",
            "client_name",
            "hasTutors",
        ]

    def get_subjects_list(self, obj):
        """Return subjects as a clean list"""
        return obj.get_subjects_list()

    def get_client_name(self, obj):
        """Return the client's full name"""
        return obj.client.get_full_name()

    def get_hasTutors(self, obj):
        """Check if student has any tutor assignments (rates)"""
        return Rate.objects.filter(student=obj).exists()


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin to update user data including balance"""

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "username",
            "phone_number",
            "balance",
        ]

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

    def validate_balance(self, value):
        """Validate balance is not negative"""
        if value < 0:
            raise serializers.ValidationError("Balance cannot be negative.")
        return value
