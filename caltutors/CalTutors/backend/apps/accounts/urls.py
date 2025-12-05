from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.student_management.views import StudentViewSet

from . import views

router = DefaultRouter()
router.register(r"client/students", StudentViewSet, basename="client-students")
router.register(r"students", StudentViewSet, basename="students")

urlpatterns = [
    # Registration endpoints
    path("register/", views.UserRegistrationView.as_view(), name="user_register"),
    # Login endpoints
    path("login/", views.LoginView.as_view(), name="user_login"),
    # Auth ping
    path("auth-ping/", views.auth_ping, name="auth_ping"),
    # Profile management
    path("profile/", views.UserProfileUpdateView.as_view(), name="user_profile"),
    path("me/", views.get_current_user, name="current_user"),
    # Password reset endpoints
    path(
        "password-reset/",
        views.PasswordResetRequestView.as_view(),
        name="password_reset_request",
    ),
    path(
        "password-reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path("", include(router.urls)),
    # Logout endpoint
    # path('logout/', views.LogoutView.as_view(), name='user_logout'),
]
