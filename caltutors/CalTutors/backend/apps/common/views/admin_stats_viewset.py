from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status, viewsets
from apps.common.utils import parse_and_validate_dates
from abc import ABC, abstractmethod


class AdminStatsViewSet(viewsets.ViewSet, ABC):
    """
    Base viewset for admin statistics endpoints.
    Handles date parsing and validation consistently across all stats endpoints.

    Subclasses should implement calculate_stats() to compute their specific statistics.
    """

    permission_classes = [IsAdminUser]

    @abstractmethod
    def calculate_stats(self, start_date, end_date, start_date_str, end_date_str):
        """
        Calculate statistics for the given date range.

        Args:
            start_date: Start date (date object) or None for all time
            end_date: End date (date object) or None for all time
            start_date_str: Original start date string from request or None
            end_date_str: Original end date string from request or None

        Returns:
            dict: Statistics dictionary to be returned in the response
        """
        pass

    def list(self, request):
        """
        Handle GET requests for statistics.
        Parses and validates dates, then calls calculate_stats().

        Query Parameters:
            start_date (optional): Start date in YYYY-MM-DD format
            end_date (optional): End date in YYYY-MM-DD format

        If dates are not provided, all-time statistics are calculated.

        Note: Date filtering uses Django's timezone-aware __date filter.
        Timestamps are stored in UTC but filtered by date in the server's timezone setting.
        """
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")

        # Parse and validate dates (dates are optional for "all time")
        start_date, end_date, error_response = parse_and_validate_dates(
            start_date_str, end_date_str, require_dates=False
        )
        if error_response:
            return error_response

        # Calculate statistics (implemented by subclass)
        stats = self.calculate_stats(start_date, end_date, start_date_str, end_date_str)

        return Response(stats, status=status.HTTP_200_OK)
