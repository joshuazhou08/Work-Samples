from decimal import Decimal, ROUND_HALF_UP
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.payments.models import Charge
from apps.sessions.models import Hours, Rate

User = get_user_model()


class ChargeSerializer(serializers.ModelSerializer):
    """Serializer for displaying Charge data with related information"""

    user_info = serializers.SerializerMethodField()
    session_count = serializers.SerializerMethodField()
    session_details = serializers.SerializerMethodField()

    class Meta:
        model = Charge
        fields = [
            "id",
            "user",
            "stripe_checkout_id",
            "amount",
            "credits_applied",
            "final_amount",
            "currency",
            "status",
            "created_at",
            "sessions",
            "user_info",
            "session_count",
            "session_details",
        ]
        read_only_fields = [
            "id",
            "final_amount",
            "created_at",
            "user_info",
            "session_count",
            "session_details",
        ]

    def get_user_info(self, obj):
        """Get user information for display"""
        return {
            "id": obj.user.id,
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
            "email": obj.user.email,
        }

    def get_session_count(self, obj):
        """Get the number of sessions in this charge"""
        return obj.sessions.count()

    def get_session_details(self, obj):
        """Get basic session information for this charge"""
        sessions = obj.sessions.select_related("student", "tutor").all()
        rate_cache = {}
        two_places = Decimal("0.01")
        details = []
        for session in sessions:
            student_rate = session.student_rate
            tutor_rate = session.tutor_rate

            if student_rate is None or tutor_rate is None:
                key = (session.tutor_id, session.student_id)
                rate = rate_cache.get(key)
                if rate is None:
                    try:
                        rate = Rate.objects.get(
                            tutor=session.tutor, student=session.student
                        )
                    except Rate.DoesNotExist:
                        rate = None
                    rate_cache[key] = rate
                if rate is not None:
                    if student_rate is None:
                        student_rate = rate.student_rate
                    if tutor_rate is None:
                        tutor_rate = rate.tutor_pay_rate

            duration_hours = Decimal(session.duration_minutes) / Decimal("60")

            if student_rate is None:
                student_rate_decimal = Decimal("0.00")
            else:
                student_rate_decimal = student_rate

            if tutor_rate is None:
                tutor_rate_decimal = Decimal("0.00")
            else:
                tutor_rate_decimal = tutor_rate

            student_charge = (
                (student_rate_decimal * duration_hours).quantize(
                    two_places, rounding=ROUND_HALF_UP
                )
            )
            tutor_payment = (
                (tutor_rate_decimal * duration_hours).quantize(
                    two_places, rounding=ROUND_HALF_UP
                )
            )
            student_rate_str = str(
                student_rate_decimal.quantize(two_places, rounding=ROUND_HALF_UP)
            )
            tutor_rate_str = str(
                tutor_rate_decimal.quantize(two_places, rounding=ROUND_HALF_UP)
            )
            student_charge_str = str(student_charge)
            tutor_payment_str = str(tutor_payment)

            details.append(
                {
                    "id": session.id,
                    "tutor_name": f"{session.tutor.first_name} {session.tutor.last_name}",
                    "student_name": f"{session.student.first_name} {session.student.last_name}",
                    "start_time": session.start_time,
                    "duration_minutes": session.duration_minutes,
                    "student_rate": student_rate_str,
                    "tutor_rate": tutor_rate_str,
                    "student_charge": student_charge_str,
                    "tutor_payment": tutor_payment_str,
                    "session_amount": student_charge_str,
                    "tutor_pay_rate": tutor_rate_str,
                }
            )

        return details


class ChargeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating charges with optional session selection"""

    session_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of session IDs to include in this charge",
    )

    class Meta:
        model = Charge
        fields = [
            "user",
            "session_ids",
            "amount",
            "credits_applied",
            "currency",
            "status",
            "stripe_checkout_id",
        ]

    def validate_session_ids(self, value):
        """Validate that all session IDs exist and haven't been charged yet"""
        if not value:
            return value  # Allow empty for credit packages

        # Check that all sessions exist
        sessions = Hours.objects.filter(id__in=value)
        if sessions.count() != len(value):
            raise serializers.ValidationError("One or more session IDs are invalid.")

        # Check that sessions haven't been paid yet
        already_paid = sessions.filter(student_charged=True).exists()
        if already_paid:
            raise serializers.ValidationError(
                "One or more sessions have already been charged."
            )

        return value

    def validate_amount(self, value):
        """Validate amount is not negative"""
        if value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value

    def validate_credits_applied(self, value):
        """Validate credits_applied is not negative"""
        if value < 0:
            raise serializers.ValidationError("Credits applied cannot be negative.")
        return value

    def validate(self, data):
        """Validate that the user is a client and owns the students in the sessions"""
        session_ids = data.get("session_ids", [])
        user = data.get("user")
        credits_applied = data.get("credits_applied", 0)
        amount = data.get("amount", 0)

        # Validate credits don't exceed amount
        if credits_applied > amount:
            raise serializers.ValidationError(
                "Credits applied cannot exceed the charge amount."
            )

        if session_ids and user:
            # Check that user is a client
            if user.user_type != "client":
                raise serializers.ValidationError(
                    "Only clients can be charged for sessions."
                )

            # Check that all sessions belong to students of this client
            sessions = Hours.objects.filter(id__in=session_ids).select_related(
                "student"
            )

            for session in sessions:
                if session.student.client != user:
                    raise serializers.ValidationError(
                        "All sessions must belong to students of the specified client."
                    )
        elif not session_ids and user:
            # For credit packages, just validate user is a client
            if user.user_type != "client":
                raise serializers.ValidationError(
                    "Only clients can purchase credit packages."
                )

        return data

    def create(self, validated_data):
        """Create charge and associate sessions (if any)"""
        session_ids = validated_data.pop("session_ids", [])
        charge = Charge.objects.create(**validated_data)

        # Add sessions to the charge (if any) and mark them as paid
        if session_ids:
            sessions = list(
                Hours.objects.filter(id__in=session_ids).select_related(
                    "student", "tutor"
                )
            )
            charge.sessions.set(sessions)
            for session in sessions:
                session.mark_student_charged()
                session.mark_student_rate()
                session.mark_tutor_rate()

        return charge
