from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import RegexValidator
from .managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    username = models.CharField(max_length=30, unique=True)
    # Phone number in E.164 format (e.g., +15551234567)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=17,  # +999999999999999 (max E.164 length)
        help_text="Phone number in E.164 format (e.g., +15551234567)"
    )

    USER_TYPE_CHOICES = [
        ('client', 'Client'),
        ('tutor', 'Tutor'),
        ('admin', 'Admin'),
    ]
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, db_index=True)
    
    # Simple comma-separated list of subjects for tutors
    subjects_taught = models.TextField(
        blank=True,
        help_text="Comma-separated list of subjects this tutor can teach (e.g., 'Math, Physics, Chemistry')"
    )
    
    # For both tutors and students, this is how much "money" they have in their account in dollars
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    timezone = models.CharField(
        max_length=50,
        default="America/Los_Angeles",
        help_text="Preferred timezone in IANA format (e.g., 'America/Los_Angeles').",
    )
    stripe_customer_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        help_text="Stripe customer identifier used for billing portal access.",
    )

    class BillingStatus(models.TextChoices):
        MISSING = "missing", "Missing"
        INVALID = "invalid", "Invalid"
        VALID = "valid", "Valid"

    billing_status = models.CharField(
        max_length=20,
        choices=BillingStatus.choices,
        default=BillingStatus.MISSING,
        help_text="Current billing profile status for the user.",
        db_index=True,
    )

    last_session_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of the user's last tutoring session.",
        db_index=True,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "user_type"]

    def __str__(self):
        return f"{self.email} ({self.user_type})"
    
    def get_subjects_list(self):
        """Returns a clean list of subjects this tutor teaches"""
        if not self.subjects_taught:
            return []
        return [subject.strip() for subject in self.subjects_taught.split(',') if subject.strip()]
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    objects = UserManager()


class Student(models.Model):
    """Model to track individual students under a client account"""
    client = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='students',
        limit_choices_to={'user_type': 'client'},
        help_text="The client account this student belongs to"
    )
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField(blank=True, help_text="Optional email for the student")
    phone_number = models.CharField(
        validators=[User.phone_regex], 
        max_length=17,
        blank=True,
        help_text="Optional phone number for the student"
    )
    grade_level = models.CharField(
        max_length=20, 
        blank=True,
        help_text="Current grade level (e.g., '9th Grade', 'Sophomore', 'K-12')"
    )
    subjects_studying = models.TextField(
        blank=True,
        help_text="Comma-separated list of subjects this student is studying"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about the student (learning preferences, etc.)"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']
        unique_together = ['client', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} (Client: {self.client.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_subjects_list(self):
        """Returns a clean list of subjects this student is studying"""
        if not self.subjects_studying:
            return []
        return [subject.strip() for subject in self.subjects_studying.split(',') if subject.strip()]
