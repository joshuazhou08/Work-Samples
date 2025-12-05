import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from tutoring_sessions.models import TutoringSession, TutoringSessionRate
from accounts.models import Student, User


class Command(BaseCommand):
    help = "Generate random charged and uncharged tutoring sessions for testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="How many days back to generate test sessions."
        )
        parser.add_argument(
            "--per-student",
            type=int,
            default=5,
            help="How many sessions to generate per student."
        )

    def handle(self, *args, **options):
        days = options["days"]
        per_student = options["per_student"]

        now = timezone.now()
        start_date = now - timedelta(days=days)

        students = Student.objects.select_related("user", "client").all()
        if not students:
            self.stdout.write(self.style.ERROR("No students found."))
            return

        total_created = 0
        total_rates_created = 0

        for student in students:
            for _ in range(per_student):
                # Random time between start_date and now
                random_minutes = random.randint(0, days * 24 * 60)
                start_time = start_date + timedelta(minutes=random_minutes)

                duration = random.choice([30, 45, 60, 75, 90, 120])
                student_rate = random.choice([40, 45, 50, 55, 60])
                tutor_rate = random.choice([20, 25, 30, 35])

                # Ensure rate object exists
                rate, created = TutoringSessionRate.objects.get_or_create(
                    student=student,
                    tutor=student.tutor,       # adjust if your model is different
                    defaults={
                        "student_rate": student_rate,
                        "tutor_pay_rate": tutor_rate,
                    }
                )

                if created:
                    total_rates_created += 1

                charged = random.choice([True, False])

                TutoringSession.objects.create(
                    student=student,
                    tutor=student.tutor,        # adjust depending on your model
                    start_time=start_time,
                    duration_minutes=duration,
                    student_charged=charged,
                    tutor_paid=charged,         # optional
                )

                total_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Generated {total_created} test tutoring sessions "
            f"and {total_rates_created} rate entries."
        ))
