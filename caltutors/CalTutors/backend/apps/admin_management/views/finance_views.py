from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status, viewsets
from apps.sessions.models import Rate, Hours
from apps.sessions.serializers import RateSerializer
from apps.common.utils import flatten_serializer_errors, parse_and_validate_dates
from apps.common.views import AdminStatsViewSet
from datetime import datetime
from decimal import Decimal
from logging import getLogger
from django.utils import timezone

logger = getLogger(__name__)


class AdminRateViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset for managing rates.
    Provides list, retrieve, create, update, and delete operations.
    """

    permission_classes = [IsAdminUser]
    queryset = Rate.objects.select_related("student", "tutor").all()
    serializer_class = RateSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        tutor_id = self.request.query_params.get("tutor_id")
        if tutor_id:
            queryset = queryset.filter(tutor_id=tutor_id)

        student_id = self.request.query_params.get("student_id")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        return queryset.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        """Create a rate with proper error handling"""
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            messages = flatten_serializer_errors(serializer.errors)
            logger.info(f"Error: {messages}")
            return Response(
                {
                    "error": "Rate creation failed.",
                    "messages": messages,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a rate with proper error handling"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            messages = flatten_serializer_errors(serializer.errors)
            logger.info(f"Error: {messages}")
            return Response(
                {
                    "error": "Rate update failed.",
                    "messages": messages,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Partial update with proper error handling"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def perform_create(self, serializer):
        rate = serializer.save()
        logger.info(
            f"Rate created: {rate.id} - {rate.tutor.first_name} tutoring "
            f"{rate.student.first_name} at ${rate.student_rate}/hr"
        )

    def perform_update(self, serializer):
        rate = serializer.save()
        logger.info(
            f"Rate updated: {rate.id} - {rate.tutor.first_name} tutoring "
            f"{rate.student.first_name} at ${rate.student_rate}/hr"
        )

    def perform_destroy(self, instance):
        rate_info = (
            f"{instance.tutor.first_name} tutoring {instance.student.first_name}"
        )
        instance.delete()
        logger.info(f"Rate deleted: {rate_info}")


class AdminTutorPaymentStatsViewSet(viewsets.ViewSet):
    """
    Admin-only viewset for calculating tutor payment statistics.
    """

    permission_classes = [IsAdminUser]

    def list(self, request):
        """
        Calculate how much is owed to each tutor in a given time frame.

        If no dates provided, returns all tutor payments.
        Date filtering is primarily done client-side for timezone accuracy.
        """

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        start_datetime, end_datetime, error_response = parse_and_validate_dates(
            start_date, end_date, require_dates=False
        )
        if error_response:
            return error_response

        # Get sessions, optionally filtered by date
        sessions = Hours.objects.select_related("tutor", "student")

        if start_datetime:
            sessions = sessions.filter(start_time__gte=start_datetime)
        if end_datetime:
            sessions = sessions.filter(start_time__lte=end_datetime)

        tutor_payments = {}

        for session in sessions:
            tutor_id = session.tutor.id

            if tutor_id not in tutor_payments:
                tutor_payments[tutor_id] = {
                    "tutor": {
                        "id": session.tutor.id,
                        "first_name": session.tutor.first_name,
                        "last_name": session.tutor.last_name,
                        "email": session.tutor.email,
                    },
                    "total_amount": Decimal("0.00"),
                    "sessions": [],
                }

            student_rate = session.student_rate
            tutor_rate = session.tutor_rate

            if student_rate is None or tutor_rate is None:
                try:
                    rate_obj = Rate.objects.get(
                        tutor=session.tutor, student=session.student
                    )
                except Rate.DoesNotExist:
                    rate_obj = None

                if rate_obj:
                    if student_rate is None:
                        student_rate = rate_obj.student_rate
                    if tutor_rate is None:
                        tutor_rate = rate_obj.tutor_pay_rate

            student_rate_decimal = student_rate or Decimal("0.00")
            tutor_rate_decimal = tutor_rate or Decimal("0.00")

            duration_hours = Decimal(session.duration_minutes) / Decimal("60")
            student_charge = (student_rate_decimal * duration_hours).quantize(
                Decimal("0.01")
            )
            tutor_payment = (tutor_rate_decimal * duration_hours).quantize(
                Decimal("0.01")
            )

            tutor_payments[tutor_id]["total_amount"] += tutor_payment
            tutor_payments[tutor_id]["sessions"].append(
                {
                    "id": session.id,
                    "student_name": f"{session.student.first_name} {session.student.last_name}",
                    "start_time": session.start_time.isoformat(),
                    "duration_minutes": session.duration_minutes,
                    "tutor_name": f"{session.tutor.first_name} {session.tutor.last_name}",
                    "student_rate": str(student_rate_decimal.quantize(Decimal("0.01"))),
                    "student_charge": str(student_charge),
                    "tutor_rate": str(tutor_rate_decimal.quantize(Decimal("0.01"))),
                    "tutor_payment": str(tutor_payment),
                    "tutor_pay_rate": str(
                        tutor_rate_decimal.quantize(Decimal("0.01"))
                    ),
                    "session_amount": str(tutor_payment),
                }
            )

        result = [
            {
                "tutor": data["tutor"],
                "total_amount": str(data["total_amount"].quantize(Decimal("0.01"))),
                "session_count": len(data["sessions"]),
                "sessions": data["sessions"],
            }
            for data in tutor_payments.values()
        ]

        result.sort(key=lambda x: x["tutor"]["last_name"])

        return Response(
            {"tutor_payments": result, "count": len(result)},
            status=status.HTTP_200_OK,
        )


class AdminUnchargedSessionsViewSet(viewsets.ViewSet):
    """
    Admin-only viewset for fetching uncharged sessions grouped by student.
    Only returns past sessions (start_time < now) that haven't been charged.
    """

    permission_classes = [IsAdminUser]

    def list(self, request):
        """
        Get all past uncharged sessions grouped by student, with optional date filtering.

        Note: Date filtering can be done in the frontend (client-side) for timezone accuracy.
        This endpoint provides optional server-side filtering using Django's timezone-aware __date filter.
        """

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        # Validate date format if provided
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {
                        "error": "Invalid date format.",
                        "messages": ["start_date must be in YYYY-MM-DD format."],
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            start_datetime = None

        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {
                        "error": "Invalid date format.",
                        "messages": ["end_date must be in YYYY-MM-DD format."],
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            end_datetime = None

        # Validate date range
        if start_datetime and end_datetime and start_datetime > end_datetime:
            return Response(
                {
                    "error": "Invalid date range.",
                    "messages": ["start_date must be before or equal to end_date."],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get sessions with unpaid status that are in the past
        from django.utils import timezone

        uncharged_sessions = (
            Hours.objects.filter(student_charged=False, start_time__lt=timezone.now())
            .select_related("student", "student__client", "tutor")
            .order_by("student__last_name", "student__first_name", "start_time")
        )

        # Apply date filtering if provided
        if start_datetime:
            uncharged_sessions = uncharged_sessions.filter(
                start_time__date__gte=start_datetime
            )

        if end_datetime:
            uncharged_sessions = uncharged_sessions.filter(
                start_time__date__lte=end_datetime
            )

        # Group by student
        student_groups = {}

        for session in uncharged_sessions:
            student_id = session.student.id

            if student_id not in student_groups:
                student_groups[student_id] = {
                    "student": {
                        "id": session.student.id,
                        "first_name": session.student.first_name,
                        "last_name": session.student.last_name,
                        "email": session.student.email or "",
                        "phone_number": session.student.phone_number or "",
                        "grade_level": session.student.grade_level or "",
                    },
                    "client": {
                        "id": session.student.client.id,
                        "first_name": session.student.client.first_name,
                        "last_name": session.student.client.last_name,
                        "email": session.student.client.email,
                        "phone_number": session.student.client.phone_number or "",
                    },
                    "sessions": [],
                }

            student_groups[student_id]["sessions"].append(
                {
                    "id": session.id,
                    "tutor_name": f"{session.tutor.first_name} {session.tutor.last_name}",
                    "start_time": session.start_time.isoformat(),
                    "duration_minutes": session.duration_minutes,
                }
            )

        result = list(student_groups.values())

        return Response(
            {"uncharged_sessions": result, "count": len(result)},
            status=status.HTTP_200_OK,
        )


class AdminFinanceStatsViewSet(AdminStatsViewSet):
    """
    Admin-only viewset for calculating overall finance statistics.
    """

    def _calculate_total_tutor_payments(self, start_date, end_date):
        """
        Calculate total tutor payments for sessions in the given date range.

        Args:
            start_date: Start datetime (UTC) or None for all time
            end_date: End datetime (UTC) or None for all time

        Returns:
            Decimal: Total tutor payments
        """
        sessions = Hours.objects.all()

        if start_date:
            sessions = sessions.filter(start_time__gte=start_date)
        if end_date:
            sessions = sessions.filter(start_time__lte=end_date)

        sessions = sessions.select_related("tutor", "student")

        total_tutor_payments = Decimal("0.00")

        for session in sessions:
            try:
                rate = Rate.objects.get(tutor=session.tutor, student=session.student)
                tutor_pay_rate = rate.tutor_pay_rate
            except Rate.DoesNotExist:
                tutor_pay_rate = Decimal("0.00")

            session_hours = Decimal(session.duration_minutes) / Decimal("60")
            total_tutor_payments += session_hours * tutor_pay_rate

        return total_tutor_payments

    def _calculate_total_revenue(self, start_date, end_date):
        """
        Calculate total revenue from charges in the given date range.

        Args:
            start_date: Start datetime (UTC) or None for all time
            end_date: End datetime (UTC) or None for all time

        Returns:
            Decimal: Total revenue
        """
        from apps.payments.models import Charge

        charges = Charge.objects.all()

        if start_date:
            charges = charges.filter(created_at__gte=start_date)
        if end_date:
            charges = charges.filter(created_at__lte=end_date)

        total_revenue = Decimal("0.00")
        for charge in charges:
            total_revenue += charge.final_amount

        return total_revenue

    def _count_uncharged_sessions(self, start_date, end_date):
        """
        Count uncharged sessions in the given date range.

        Args:
            start_date: Start datetime (UTC) or None for all time
            end_date: End datetime (UTC) or None for all time

        Returns:
            int: Count of uncharged sessions
        """
        uncharged_sessions = Hours.objects.filter(
            student_charged=False,
            start_time__lt=timezone.now(),
        )

        if start_date:
            uncharged_sessions = uncharged_sessions.filter(start_time__gte=start_date)
        if end_date:
            uncharged_sessions = uncharged_sessions.filter(start_time__lte=end_date)

        return uncharged_sessions.count()

    def calculate_stats(self, start_date, end_date, start_date_str, end_date_str):
        """
        Calculate finance statistics for the given date range.

        Datetime filtering is performed using UTC-aware boundaries.
        """
        # Calculate statistics
        total_tutor_payments = self._calculate_total_tutor_payments(
            start_date, end_date
        )
        total_revenue = self._calculate_total_revenue(start_date, end_date)
        uncharged_sessions_count = self._count_uncharged_sessions(start_date, end_date)

        # Build and return response
        return {
            "total_revenue": str(total_revenue.quantize(Decimal("0.01"))),
            "total_tutor_payments": str(total_tutor_payments.quantize(Decimal("0.01"))),
            "platform_revenue": str(
                (total_revenue - total_tutor_payments).quantize(Decimal("0.01"))
            ),
            "uncharged_sessions_count": uncharged_sessions_count,
            "start_date": start_date_str,
            "end_date": end_date_str,
        }
