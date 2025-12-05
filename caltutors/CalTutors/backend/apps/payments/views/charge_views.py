from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.payments.models import Charge
from apps.payments.serializers import ChargeSerializer, ChargeCreateSerializer
from apps.common.utils import (
    check_admin_access,
    flatten_serializer_errors,
    parse_and_validate_dates,
)
from logging import getLogger

logger = getLogger(__name__)


class ChargeViewSet(ViewSet):
    """
    ViewSet for managing charges.
    Provides list, create, retrieve, partial_update, and destroy actions.
    """

    permission_classes = [IsAuthenticated]

    def _get_charge_queryset(self):
        """Helper method to get optimized charge queryset."""
        return Charge.objects.select_related("user").prefetch_related("sessions")

    def list(self, request):
        """List all charges with optional filtering."""
        access_denied = check_admin_access(request.user)
        if access_denied:
            return access_denied

        queryset = self._get_charge_queryset().all()

        user_id = request.query_params.get("user_id", None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        charge_status = request.query_params.get("status", None)
        if charge_status:
            queryset = queryset.filter(status=charge_status)

        # Date filtering
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        start_datetime, end_datetime, error_response = parse_and_validate_dates(
            start_date,
            end_date,
            require_dates=False,
        )
        if error_response:
            return error_response

        if start_datetime:
            queryset = queryset.filter(created_at__gte=start_datetime)
        if end_datetime:
            queryset = queryset.filter(created_at__lte=end_datetime)

        charges = queryset.order_by("-created_at")
        serializer = ChargeSerializer(charges, many=True)
        return Response({"charges": serializer.data}, status=status.HTTP_200_OK)

    def create(self, request):
        """Create a new charge."""
        access_denied = check_admin_access(request.user)
        if access_denied:
            return access_denied

        serializer = ChargeCreateSerializer(data=request.data)
        if serializer.is_valid():
            charge = serializer.save()
            logger.info(
                f"Charge created: {charge.id} - User: {charge.user.get_full_name()}: ${charge.final_amount}"
            )

            response_serializer = ChargeSerializer(charge)
            return Response(
                {
                    "message": "Charge created successfully.",
                    "charge": response_serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        messages = flatten_serializer_errors(serializer.errors)
        logger.error(f"Charge creation failed: {messages}")
        return Response(
            {
                "error": "Charge creation failed.",
                "messages": messages,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, pk=None):
        """Retrieve a specific charge."""
        access_denied = check_admin_access(request.user)
        if access_denied:
            return access_denied

        try:
            charge = self._get_charge_queryset().get(pk=pk)
        except Charge.DoesNotExist:
            return Response(
                {"error": "Charge not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ChargeSerializer(charge)
        return Response({"charge": serializer.data}, status=status.HTTP_200_OK)

    def partial_update(self, request, pk=None):
        """Update a specific charge (PATCH)."""
        access_denied = check_admin_access(request.user)
        if access_denied:
            return access_denied

        try:
            charge = self._get_charge_queryset().get(pk=pk)
        except Charge.DoesNotExist:
            return Response(
                {"error": "Charge not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        allowed_fields = ["status", "stripe_checkout_id", "credits_applied"]
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = ChargeSerializer(charge, data=update_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Charge updated: {charge.id} - Status: {charge.status}")
            return Response(
                {
                    "message": "Charge updated successfully.",
                    "charge": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        messages = flatten_serializer_errors(serializer.errors)
        logger.error(f"Charge update failed: {messages}")
        return Response(
            {
                "error": "Charge update failed.",
                "messages": messages,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def destroy(self, request, pk=None):
        """Delete a specific charge."""
        access_denied = check_admin_access(request.user)
        if access_denied:
            return access_denied

        try:
            charge = self._get_charge_queryset().get(pk=pk)
        except Charge.DoesNotExist:
            return Response(
                {"error": "Charge not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if charge.status != "pending":
            return Response(
                {"error": "Only pending charges can be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        charge_id = charge.id
        charge.delete()
        logger.info(f"Charge deleted: {charge_id}")
        return Response(
            {"message": "Charge deleted successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="client-charges")
    def client_charges(self, request):
        """Get charges for the authenticated client's students."""
        if request.user.user_type != "client":
            return Response(
                {
                    "error": "Access denied.",
                    "messages": ["Only clients can view their charges."],
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        charges = (
            self._get_charge_queryset()
            .filter(user=request.user)
            .order_by("-created_at")
        )

        serializer = ChargeSerializer(charges, many=True)
        return Response({"charges": serializer.data}, status=status.HTTP_200_OK)
