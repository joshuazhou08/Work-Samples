from django.db import models
from django.conf import settings
from django.utils import timezone

# Create your models here.


class Rate(models.Model):
    """
    Model to store hourly rates between tutors and students.
    """

    # Foreign key to the tutor user
    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tutor_rates",
        limit_choices_to={"user_type": "tutor"},
    )

    # Foreign key to the student
    student = models.ForeignKey(
        "accounts.Student", on_delete=models.CASCADE, related_name="student_rates"
    )

    # Rate that the student pays per hour
    student_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Hourly rate in dollars that the student pays",
    )

    # Rate that the tutor gets paid per hour
    tutor_pay_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Hourly rate in dollars that the tutor gets paid",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tutoring Rate"
        verbose_name_plural = "Tutoring Rates"
        # Ensure unique tutor-student pairs
        unique_together = ["tutor", "student"]
        ordering = ["tutor__first_name", "student__first_name"]

    def __str__(self):
        return f"{self.tutor.first_name} -> {self.student.first_name}: Student pays ${self.student_rate}/hr, Tutor gets ${self.tutor_pay_rate}/hr"

    @property
    def client(self):
        """Get the client (parent user) for this rate's student"""
        return self.student.client


class Hours(models.Model):
    """
    Model to store scheduled tutoring sessions between students and tutors.
    """

    # Foreign key to the student
    student = models.ForeignKey(
        "accounts.Student", on_delete=models.CASCADE, related_name="student_sessions"
    )

    # Foreign key to the tutor user
    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tutor_sessions",
        limit_choices_to={"user_type": "tutor"},
    )

    # Start time of the tutoring session
    start_time = models.DateTimeField()

    # Duration of the session in minutes
    duration_minutes = models.PositiveIntegerField(
        help_text="Duration of the tutoring session in minutes"
    )

    # Final rates applied to the session when charged
    student_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final hourly rate charged to the student for this session.",
    )
    tutor_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final hourly rate paid to the tutor for this session.",
    )

    # Payment tracking flags
    student_charged = models.BooleanField(
        default=False,
        help_text="Indicates if the student has been charged for this session.",
        db_index=True,
    )
    tutor_paid = models.BooleanField(
        default=False,
        help_text="Indicates if the tutor has been paid for this session.",
        db_index=True,
    )

    # Optional: Additional fields that might be useful
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tutoring_sessions"
        verbose_name = "Tutoring Session"
        verbose_name_plural = "Tutoring Sessions"
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.tutor.first_name} tutoring {self.student.first_name} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

       
        session_time = self.start_time  # or self.end_time if preferred

        # Update tutor activity
        self.tutor.last_session_at = session_time
        self.tutor.save(update_fields=["last_session_at"])

        # Update client activity
        client = self.student.client
        client.last_session_at = session_time
        client.save(update_fields=["last_session_at"])

    @property
    def end_time(self):
        """Calculate and return the end time of the session."""
        from datetime import timedelta

        return self.start_time + timedelta(minutes=self.duration_minutes)

    def is_upcoming(self):
        """Check if the session is scheduled for the future."""
        return self.start_time > timezone.now()

    def is_in_progress(self):
        """Check if the session is currently in progress."""
        now = timezone.now()
        return self.start_time <= now <= self.end_time

    @property
    def client(self):
        """Get the client (parent user) for this session's student"""
        return self.student.client

    def mark_student_charged(self):
        """Mark the session as charged for the student."""
        if not self.student_charged:
            self.student_charged = True
            self.save(update_fields=["student_charged"])

    def mark_student_rate(self, rate_value):
        """Snapshot the student-facing rate for this session."""
        if rate_value is None:
            return  # Nothing to snapshot

        if self.student_rate != rate_value:
            self.student_rate = rate_value
            self.save(update_fields=["student_rate"])

    def mark_tutor_rate(self, rate_value):
        """Snapshot the current tutor payout rate from the Rate mapping."""
        if rate_value is None:
            return  # Nothing to snapshot

        if self.tutor_rate != rate_value:
            self.tutor_rate = rate_value
            self.save(update_fields=["tutor_rate"])

    def mark_tutor_paid(self):
        """Mark the session as paid to the tutor."""
        if not self.tutor_paid:
            self.tutor_paid = True
            self.save(update_fields=["tutor_paid"])


    
