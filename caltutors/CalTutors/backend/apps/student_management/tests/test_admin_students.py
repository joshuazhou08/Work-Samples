from rest_framework import status
from django.urls import reverse
from apps.common.test_utils import AuthenticatedAPITestCase


class AdminStudentViewSetTests(AuthenticatedAPITestCase):
    def setUp(self):
        super().setUp()
        self.api_client = self.client

        # Create additional test clients with students
        self.test_client1 = self.create_client_user()
        self.test_client2 = self.create_client_user()

        # Create students for test clients
        self.student1 = self.create_student(client=self.test_client1)
        self.student2 = self.create_student(client=self.test_client1)
        self.student3 = self.create_student(client=self.test_client2)

    def test_admin_can_list_all_students(self):
        """Admin can list all students across all clients"""
        url = reverse("admin-students-list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("students", res.data)
        self.assertIn("count", res.data)
        # Should return all students (at least the 3 we created)
        self.assertGreaterEqual(len(res.data["students"]), 3)
        self.assertEqual(res.data["count"], len(res.data["students"]))

        # Verify our students are in the list
        student_ids = [student["id"] for student in res.data["students"]]
        self.assertIn(self.student1.id, student_ids)
        self.assertIn(self.student2.id, student_ids)
        self.assertIn(self.student3.id, student_ids)

    def test_admin_can_retrieve_student(self):
        """Admin can retrieve a specific student"""
        url = reverse("admin-students-detail", args=[self.student1.id])
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("student", res.data)
        self.assertEqual(res.data["student"]["id"], self.student1.id)
        self.assertEqual(res.data["student"]["first_name"], self.student1.first_name)
        self.assertEqual(res.data["student"]["last_name"], self.student1.last_name)

    def test_admin_can_create_student_for_client(self):
        """Admin can create a student and assign to a specific client"""
        url = reverse("admin-students-list")
        data = {
            "client": self.test_client1.id,
            "first_name": "New",
            "last_name": "Student",
            "grade_level": "10th Grade",
            "subjects_studying": "Math, Science",
        }
        res = self.api_client.post(url, data, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("student", res.data)
        self.assertEqual(res.data["student"]["first_name"], "New")
        self.assertEqual(res.data["student"]["last_name"], "Student")
        self.assertEqual(res.data["student"]["client"], self.test_client1.id)

    def test_admin_cannot_create_student_with_invalid_client(self):
        """Admin cannot create student with non-existent client ID"""
        url = reverse("admin-students-list")
        data = {
            "client": 99999,  # Non-existent client
            "first_name": "Test",
            "last_name": "Student",
            "grade_level": "9th Grade",
        }
        res = self.api_client.post(url, data, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_update_student(self):
        """Admin can update student information"""
        url = reverse("admin-students-detail", args=[self.student1.id])
        data = {"first_name": "Updated", "grade_level": "12th Grade"}
        res = self.api_client.patch(url, data, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student1.refresh_from_db()
        self.assertEqual(self.student1.first_name, "Updated")
        self.assertEqual(self.student1.grade_level, "12th Grade")

    def test_admin_can_delete_student(self):
        """Admin can delete a student"""
        url = reverse("admin-students-detail", args=[self.student3.id])
        res = self.api_client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("message", res.data)
        from apps.accounts.models import Student

        self.assertFalse(Student.objects.filter(id=self.student3.id).exists())

    def test_client_cannot_access_students_endpoint(self):
        """Non-admin clients cannot access the admin students endpoint"""
        self.authenticate_as_client()
        url = reverse("admin-students-list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_tutor_cannot_access_students_endpoint(self):
        """Tutors cannot access the admin students endpoint"""
        self.authenticate_as_tutor()
        url = reverse("admin-students-list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_access(self):
        """Unauthenticated users cannot access students endpoint"""
        self.logout()
        url = reverse("admin-students-list")
        res = self.api_client.get(url)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
