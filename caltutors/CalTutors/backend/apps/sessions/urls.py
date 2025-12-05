from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views
from .views.hours_views import HoursViewSet

router = DefaultRouter()
router.register(r"", HoursViewSet, basename="hours")

urlpatterns = [
    # Rate utility endpoints (CRUD moved to admin_management)
    path("rates/student/<int:student_id>/", views.student_rates, name="student-rates"),
    path("rates/tutor/<int:tutor_id>/", views.tutor_rates, name="tutor-rates"),
] + router.urls
