from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from apps.accounts.models import User
from apps.admin_management.serializers import (
    AdminUserUpdateSerializer,
    AdminTutorSerializer,
    AdminClientSerializer,
)
from apps.common.utils import check_admin_access, flatten_serializer_errors
from logging import getLogger
from rest_framework import viewsets
import stripe

logger = getLogger(__name__)


class AdminTutorsListView(APIView):
    """
    View to get all tutors - Admin only access
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        error_response = check_admin_access(request.user)
        if error_response:
            return error_response

        tutors = User.objects.filter(user_type="tutor")
        serializer = AdminTutorSerializer(tutors, many=True)

        return Response(
            {"tutors": serializer.data, "count": tutors.count()},
            status=status.HTTP_200_OK,
        )


class AdminClientViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset to manage clients.
    Supports list, retrieve, update, and delete.
    """

    permission_classes = [IsAdminUser]
    queryset = User.objects.filter(user_type="client")

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return AdminUserUpdateSerializer
        return AdminClientSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {"clients": serializer.data, "count": queryset.count()},
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        messages = ["Admins cannot directly create clients."]
        logger.info(f"Error: {messages}")
        return Response(
            {"error": "Client creation forbidden.", "messages": messages},
            status=status.HTTP_403_FORBIDDEN,
        )

    def update(self, request, *args, **kwargs):
        """Update a client with proper error handling"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            messages = flatten_serializer_errors(serializer.errors)
            logger.info(f"Error: {messages}")
            return Response(
                {
                    "error": "Client update failed.",
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

    def perform_update(self, serializer):
        """
        Hook to log balance changes when an admin updates a client.
        """
        instance = self.get_object()
        old_balance = instance.balance

        updated_instance = serializer.save()

        if "balance" in self.request.data and old_balance != updated_instance.balance:
            # Determine change (delta) and convert to cents
            delta = updated_instance.balance - old_balance
            delta_cents = int(delta * 100)

            # Only update Stripe if customer exists
            if updated_instance.stripe_customer_id:
                try:
                    stripe.CustomerBalanceTransaction.create(
                        customer=updated_instance.stripe_customer_id,
                        amount=delta_cents,  # positive = credit, negative = debit
                        currency="usd",
                        description=f"Admin {self.request.user.email} adjusted balance",
                    )
                    logger.info(
                        f"[Stripe] Adjusted balance by {delta} for customer "
                        f"{updated_instance.stripe_customer_id}"
                    )
                except Exception as e:
                    logger.error(
                        f"Failed to adjust Stripe balance for {updated_instance.email}: {e}"
                    )

            # Log change in your Django logs
            logger.info(
                f"Client {instance.email} balance updated by admin {self.request.user.email} "
                f"from ${old_balance} to ${updated_instance.balance}"
            )
            
        else:
            logger.info(
                f"Client {instance.email} updated by admin {self.request.user.email}"
            )

        return updated_instance
