from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views.charge_views import ChargeViewSet

app_name = "payments"

router = DefaultRouter()
router.register("charges", ChargeViewSet, basename="charge")


urlpatterns = [
    path(
        "billing-portal-session/",
        views.create_billing_portal_session,
        name="create_billing_portal_session",
    ),
    path("webhook/", views.stripe_webhook, name="stripe_webhook"),
    path("", include(router.urls)),
]
