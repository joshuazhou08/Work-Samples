from django.urls import include, path
from .views import (
    AdminClientViewSet,
    AdminTutorsListView,
    AdminRateViewSet,
    AdminTutorPaymentStatsViewSet,
    AdminUnchargedSessionsViewSet,
    AdminFinanceStatsViewSet,
    AdminSessionStatsViewSet,
)
from apps.student_management.views import StudentViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"clients", AdminClientViewSet, basename="admin-clients")
router.register(r"students", StudentViewSet, basename="admin-students")
router.register(r"rates", AdminRateViewSet, basename="admin-rates")
router.register(
    r"tutor-payments", AdminTutorPaymentStatsViewSet, basename="admin-tutor-payments"
)
router.register(
    r"uncharged-sessions",
    AdminUnchargedSessionsViewSet,
    basename="admin-uncharged-sessions",
)
router.register(
    r"finance-stats", AdminFinanceStatsViewSet, basename="admin-finance-stats"
)
router.register(
    r"session-stats", AdminSessionStatsViewSet, basename="admin-session-stats"
)

urlpatterns = [
    path("tutors/", AdminTutorsListView.as_view(), name="tutors_list"),
    path("", include(router.urls)),
]
