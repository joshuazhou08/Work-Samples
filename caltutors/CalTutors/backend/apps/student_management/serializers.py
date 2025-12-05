import re

from rest_framework import serializers

from apps.accounts.models import Student


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model"""

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
        """Check if student has any tutor assignments"""
        from apps.sessions.models import Rate

        return Rate.objects.filter(student=obj).exists()


class StudentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating students (client field is set automatically)"""

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
            "notes",
        ]
        read_only_fields = ["id", "client"]

    def validate_phone_number(self, value):
        """Validate phone number if provided"""
        if value:
            e164_pattern = r"^\+[1-9]\d{1,14}$"
            if not re.match(e164_pattern, value):
                raise serializers.ValidationError(
                    "Phone number must be in E.164 format (e.g., +15551234567)."
                )
        return value

    def validate(self, data):
        """Validate that client + first_name + last_name combination is unique"""
        client = self.context.get("client") or self.context["request"].user
        first_name = data.get("first_name")
        last_name = data.get("last_name")

        if Student.objects.filter(
            client=client, first_name=first_name, last_name=last_name
        ).exists():
            raise serializers.ValidationError(
                f"A student named {first_name} {last_name} already exists for this client."
            )

        return data
