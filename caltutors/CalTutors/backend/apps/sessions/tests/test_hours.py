from django.utils import timezone

from apps.common.test_utils import BaseAPITestCase


class HoursModelTests(BaseAPITestCase):
    def test_save_updates_last_session_at(self):
        tutor = self.create_tutor()
        client_user = self.create_client_user()
        student = self.create_student(client=client_user)
        start_time = timezone.now()

        self.assertIsNone(tutor.last_session_at)
        self.assertIsNone(client_user.last_session_at)

        self.create_session(
            tutor=tutor,
            student=student,
            start_time=start_time,
            duration_minutes=60,
        )

        tutor.refresh_from_db()
        client_user.refresh_from_db()

        self.assertEqual(tutor.last_session_at, start_time)
        self.assertEqual(client_user.last_session_at, start_time)
