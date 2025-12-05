from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.accounts.models import User, Student
from apps.sessions.models import Hours, Rate
from decimal import Decimal


class Command(BaseCommand):
    help = "Create fake uncharged sessions for testing"

    def handle(self, *args, **kwargs):
        # Get or create tutors
        tutor1, _ = User.objects.get_or_create(
            email="tutor1@test.com",
            defaults={
                "first_name": "Alice",
                "last_name": "Johnson",
                "username": "alice_tutor",
                "user_type": "tutor",
                "phone_number": "+15551111111",
                "subjects_taught": "Math, Physics",
            },
        )
        tutor1.set_password("testpass123")
        tutor1.save()

        tutor2, _ = User.objects.get_or_create(
            email="tutor2@test.com",
            defaults={
                "first_name": "Bob",
                "last_name": "Smith",
                "username": "bob_tutor",
                "user_type": "tutor",
                "phone_number": "+15552222222",
                "subjects_taught": "Chemistry, Biology",
            },
        )
        tutor2.set_password("testpass123")
        tutor2.save()

        # Get or create clients
        client1, _ = User.objects.get_or_create(
            email="parent1@test.com",
            defaults={
                "first_name": "Mary",
                "last_name": "Williams",
                "username": "mary_parent",
                "user_type": "client",
                "phone_number": "+15553333333",
                "balance": Decimal("500.00"),
            },
        )
        client1.set_password("testpass123")
        client1.save()

        client2, _ = User.objects.get_or_create(
            email="parent2@test.com",
            defaults={
                "first_name": "John",
                "last_name": "Davis",
                "username": "john_parent",
                "user_type": "client",
                "phone_number": "+15554444444",
                "balance": Decimal("750.00"),
            },
        )
        client2.set_password("testpass123")
        client2.save()

        # Get or create students
        student1, _ = Student.objects.get_or_create(
            client=client1,
            first_name="Emma",
            last_name="Williams",
            defaults={
                "email": "emma@test.com",
                "phone_number": "+15555555555",
                "grade_level": "10th Grade",
                "subjects_studying": "Math, Physics",
                "notes": "Needs help with calculus",
            },
        )

        student2, _ = Student.objects.get_or_create(
            client=client1,
            first_name="Oliver",
            last_name="Williams",
            defaults={
                "email": "oliver@test.com",
                "phone_number": "+15556666666",
                "grade_level": "9th Grade",
                "subjects_studying": "Chemistry",
                "notes": "Preparing for exam",
            },
        )

        student3, _ = Student.objects.get_or_create(
            client=client2,
            first_name="Sophia",
            last_name="Davis",
            defaults={
                "email": "sophia@test.com",
                "grade_level": "11th Grade",
                "subjects_studying": "Biology, Chemistry",
            },
        )

        # Create rates for tutor-student pairs
        rates_data = [
            # Tutor1 rates
            {
                "tutor": tutor1,
                "student": student1,
                "student_rate": "60.00",
                "tutor_pay_rate": "40.00",
            },
            {
                "tutor": tutor1,
                "student": student2,
                "student_rate": "65.00",
                "tutor_pay_rate": "45.00",
            },
            {
                "tutor": tutor1,
                "student": student3,
                "student_rate": "70.00",
                "tutor_pay_rate": "50.00",
            },
            # Tutor2 rates
            {
                "tutor": tutor2,
                "student": student1,
                "student_rate": "55.00",
                "tutor_pay_rate": "35.00",
            },
            {
                "tutor": tutor2,
                "student": student2,
                "student_rate": "60.00",
                "tutor_pay_rate": "40.00",
            },
        ]

        rates_created = 0
        for rate_data in rates_data:
            _, created = Rate.objects.get_or_create(
                tutor=rate_data["tutor"],
                student=rate_data["student"],
                defaults={
                    "student_rate": Decimal(rate_data["student_rate"]),
                    "tutor_pay_rate": Decimal(rate_data["tutor_pay_rate"]),
                },
            )
            if created:
                rates_created += 1

        # Create uncharged sessions in the past
        base_time = timezone.now() - timedelta(days=5)

        sessions_data = [
            # Student 1 (Emma) - 3 sessions
            {
                "tutor": tutor1,
                "student": student1,
                "start_time": base_time - timedelta(days=2),
                "duration_minutes": 60,
            },
            {
                "tutor": tutor2,
                "student": student1,
                "start_time": base_time - timedelta(days=1),
                "duration_minutes": 90,
            },
            {
                "tutor": tutor1,
                "student": student1,
                "start_time": base_time,
                "duration_minutes": 60,
            },
            # Student 2 (Oliver) - 2 sessions
            {
                "tutor": tutor1,
                "student": student2,
                "start_time": base_time - timedelta(days=3),
                "duration_minutes": 120,
            },
            {
                "tutor": tutor2,
                "student": student2,
                "start_time": base_time - timedelta(days=1),
                "duration_minutes": 60,
            },
            # Student 3 (Sophia) - 1 session
            {
                "tutor": tutor1,
                "student": student3,
                "start_time": base_time - timedelta(days=2),
                "duration_minutes": 90,
            },
        ]

        created_count = 0
        for session_data in sessions_data:
            # Check if session already exists
            if not Hours.objects.filter(
                tutor=session_data["tutor"],
                student=session_data["student"],
                start_time=session_data["start_time"],
            ).exists():
                Hours.objects.create(**session_data)
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Created {rates_created} rates for tutor-student pairs")
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {created_count} uncharged sessions for testing"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Total uncharged sessions in database: {Hours.objects.filter(charges__isnull=True, start_time__lt=timezone.now()).count()}"
            )
        )
