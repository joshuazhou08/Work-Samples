from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.accounts.models import User, Student
from rest_framework.authtoken.models import Token
from datetime import date


class ClientStudentModelTests(APITestCase):
    """Test the Student model functionality"""
    
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="client@example.com",
            password="testpass123",
            first_name="John",
            last_name="Client",
            username="johnclient",
            phone_number="+15551234567",
            user_type="client"
        )
    
    def test_create_student(self):
        """Test creating a student"""
        student = Student.objects.create(
            client=self.client_user,
            first_name="Alice",
            last_name="Student",
            email="alice@example.com",
            phone_number="+15559876543",
            date_of_birth=date(2010, 5, 15),
            grade_level="8th Grade",
            subjects_studying="Math, Science",
            notes="Needs help with algebra"
        )
        
        self.assertEqual(student.client, self.client_user)
        self.assertEqual(student.get_full_name(), "Alice Student")
        self.assertEqual(student.get_subjects_list(), ["Math", "Science"])
        self.assertTrue(student.is_active)
        self.assertEqual(str(student), "Alice Student (Client: client@example.com)")
    
    def test_unique_constraint(self):
        """Test that client + first_name + last_name must be unique"""
        Student.objects.create(
            client=self.client_user,
            first_name="Alice",
            last_name="Student"
        )
        
        # Try to create another student with same name for same client
        with self.assertRaises(Exception):
            Student.objects.create(
                client=self.client_user,
                first_name="Alice",
                last_name="Student"
            )
    
    def test_subjects_list_empty(self):
        """Test get_subjects_list with empty subjects"""
        student = Student.objects.create(
            client=self.client_user,
            first_name="Bob",
            last_name="Student"
        )
        self.assertEqual(student.get_subjects_list(), [])


class ClientStudentsViewTests(APITestCase):
    """Test the ClientStudentsView (list and create students)"""
    
    def setUp(self):
        # Create client user
        self.client_user = User.objects.create_user(
            email="client@example.com",
            password="testpass123",
            first_name="John",
            last_name="Client",
            username="johnclient",
            phone_number="+15551234567",
            user_type="client"
        )
        self.client_token = Token.objects.create(user=self.client_user)
        
        # Create tutor user (should not have access)
        self.tutor_user = User.objects.create_user(
            email="tutor@example.com",
            password="testpass123",
            first_name="Jane",
            last_name="Tutor",
            username="janetutor",
            phone_number="+15559876543",
            user_type="tutor"
        )
        self.tutor_token = Token.objects.create(user=self.tutor_user)
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@example.com",
            password="testpass123",
            first_name="Admin",
            last_name="User",
            username="adminuser",
            phone_number="+15555555555",
            user_type="admin",
            is_staff=True
        )
        self.admin_token = Token.objects.create(user=self.admin_user)
        
        self.url = "/api/accounts/client/students/"
        self.valid_student_data = {
            "first_name": "Alice",
            "last_name": "Student",
            "email": "alice@example.com",
            "phone_number": "+15559876543",
            "date_of_birth": "2010-05-15",
            "grade_level": "8th Grade",
            "subjects_studying": "Math, Science, English",
            "notes": "Needs help with algebra"
        }
    
    def test_list_students_as_client(self):
        """Test listing students as authenticated client"""
        # Create some students for the client
        Student.objects.create(
            client=self.client_user,
            first_name="Alice",
            last_name="Student"
        )
        Student.objects.create(
            client=self.client_user,
            first_name="Bob",
            last_name="Student"
        )
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("students", response.data)
        self.assertIn("count", response.data)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["students"]), 2)
    
    def test_list_students_unauthenticated(self):
        """Test listing students without authentication"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_students_as_tutor(self):
        """Test that tutors cannot access client student endpoints"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.tutor_token.key)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Access denied", response.data["error"])
    
    def test_list_students_as_admin(self):
        """Test that admins can access client student endpoints and see all students"""
        # Create students for different clients
        client2 = User.objects.create_user(
            email="client2@example.com",
            password="testpass123",
            first_name="Jane",
            last_name="Client2",
            username="janeclient2",
            user_type="client"
        )
        
        Student.objects.create(
            client=self.client_user,
            first_name="Alice",
            last_name="Student"
        )
        Student.objects.create(
            client=client2,
            first_name="Bob",
            last_name="Student"
        )
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token.key)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("students", response.data)
        self.assertIn("count", response.data)
        self.assertEqual(response.data["count"], 2)  # Admin sees all students
        self.assertEqual(len(response.data["students"]), 2)
    
    def test_create_student_as_client(self):
        """Test creating a student as authenticated client"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.post(self.url, self.valid_student_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertIn("student", response.data)
        
        # Check if student was created
        self.assertTrue(Student.objects.filter(
            client=self.client_user,
            first_name="Alice",
            last_name="Student"
        ).exists())
        
        student = Student.objects.get(
            client=self.client_user,
            first_name="Alice",
            last_name="Student"
        )
        self.assertEqual(student.email, "alice@example.com")
        self.assertEqual(student.grade_level, "8th Grade")
    
    def test_create_student_duplicate_name(self):
        """Test creating a student with duplicate name for same client"""
        # Create first student
        Student.objects.create(
            client=self.client_user,
            first_name="Alice",
            last_name="Student"
        )
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.post(self.url, self.valid_student_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", response.data)
    
    def test_create_student_invalid_phone(self):
        """Test creating a student with invalid phone number"""
        data = self.valid_student_data.copy()
        data["phone_number"] = "invalid-phone"
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", response.data)
    
    def test_create_student_minimal_data(self):
        """Test creating a student with minimal required data"""
        minimal_data = {
            "first_name": "Bob",
            "last_name": "Student"
        }
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.post(self.url, minimal_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        student = Student.objects.get(
            client=self.client_user,
            first_name="Bob",
            last_name="Student"
        )
        self.assertEqual(student.client, self.client_user)
        self.assertTrue(student.is_active)
    
    def test_create_student_as_admin(self):
        """Test that admins can create students for any client"""
        # Create another client
        client2 = User.objects.create_user(
            email="client2@example.com",
            password="testpass123",
            first_name="Jane",
            last_name="Client2",
            username="janeclient2",
            user_type="client"
        )
        
        # Admin creates student for client2
        admin_data = self.valid_student_data.copy()
        admin_data["client"] = client2.id
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token.key)
        response = self.client.post(self.url, admin_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertIn("student", response.data)
        
        # Verify student was created for the specified client
        self.assertTrue(Student.objects.filter(
            client=client2,
            first_name="Alice",
            last_name="Student"
        ).exists())
        
        student = Student.objects.get(
            client=client2,
            first_name="Alice",
            last_name="Student"
        )
        self.assertEqual(student.client, client2)
        self.assertEqual(student.email, "alice@example.com")


class ClientStudentDetailViewTests(APITestCase):
    """Test the ClientStudentDetailView (get, update, delete specific student)"""
    
    def setUp(self):
        # Create client user
        self.client_user = User.objects.create_user(
            email="client@example.com",
            password="testpass123",
            first_name="John",
            last_name="Client",
            username="johnclient",
            phone_number="+15551234567",
            user_type="client"
        )
        self.client_token = Token.objects.create(user=self.client_user)
        
        # Create another client user
        self.other_client = User.objects.create_user(
            email="otherclient@example.com",
            password="testpass123",
            first_name="Other",
            last_name="Client",
            username="otherclient",
            phone_number="+15559999999",
            user_type="client"
        )
        self.other_token = Token.objects.create(user=self.other_client)
        
        # Create tutor user
        self.tutor_user = User.objects.create_user(
            email="tutor@example.com",
            password="testpass123",
            first_name="Jane",
            last_name="Tutor",
            username="janetutor",
            phone_number="+15559876543",
            user_type="tutor"
        )
        self.tutor_token = Token.objects.create(user=self.tutor_user)
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@example.com",
            password="testpass123",
            first_name="Admin",
            last_name="User",
            username="adminuser",
            phone_number="+15555555555",
            user_type="admin",
            is_staff=True
        )
        self.admin_token = Token.objects.create(user=self.admin_user)
        
        # Create student for the client
        self.student = Student.objects.create(
            client=self.client_user,
            first_name="Alice",
            last_name="Student",
            email="alice@example.com",
            phone_number="+15559876543",
            date_of_birth=date(2010, 5, 15),
            grade_level="8th Grade",
            subjects_studying="Math, Science",
            notes="Needs help with algebra"
        )
        
        # Create student for other client
        self.other_student = Student.objects.create(
            client=self.other_client,
            first_name="Bob",
            last_name="Student"
        )
        
        self.url = f"/api/accounts/client/students/{self.student.id}/"
        self.other_url = f"/api/accounts/client/students/{self.other_student.id}/"
    
    def test_get_student_as_owner(self):
        """Test getting a student as the owning client"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("student", response.data)
        self.assertEqual(response.data["student"]["first_name"], "Alice")
        self.assertEqual(response.data["student"]["last_name"], "Student")
        self.assertEqual(response.data["student"]["client_name"], "John Client")
    
    def test_get_student_as_other_client(self):
        """Test that clients cannot access other clients' students"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.other_token.key)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Student not found", response.data["error"])
    
    def test_get_student_as_tutor(self):
        """Test that tutors cannot access client student endpoints"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.tutor_token.key)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Access denied", response.data["error"])
    
    def test_update_student_as_owner(self):
        """Test updating a student as the owning client"""
        update_data = {
            "grade_level": "9th Grade",
            "subjects_studying": "Math, Science, History",
            "notes": "Improved in algebra, now needs help with geometry"
        }
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.put(self.url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertIn("student", response.data)
        
        # Check if student was updated
        self.student.refresh_from_db()
        self.assertEqual(self.student.grade_level, "9th Grade")
        self.assertEqual(self.student.subjects_studying, "Math, Science, History")
        self.assertEqual(self.student.notes, "Improved in algebra, now needs help with geometry")
    
    def test_update_student_as_other_client(self):
        """Test that clients cannot update other clients' students"""
        update_data = {"grade_level": "9th Grade"}
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.other_token.key)
        response = self.client.put(self.url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_student_as_owner(self):
        """Test soft deleting a student as the owning client"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        
        # Check if student was soft deleted
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_active)
    
    def test_delete_student_as_other_client(self):
        """Test that clients cannot delete other clients' students"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.other_token.key)
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Check that student was not deleted
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_active)
    
    def test_get_nonexistent_student(self):
        """Test getting a non-existent student"""
        nonexistent_url = "/api/accounts/client/students/99999/"
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        response = self.client.get(nonexistent_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Student not found", response.data["error"])
    
    def test_get_student_as_admin(self):
        """Test that admins can access any student"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token.key)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("student", response.data)
        self.assertEqual(response.data["student"]["id"], self.student.id)
    
    def test_update_student_as_admin(self):
        """Test that admins can update any student"""
        update_data = {
            "grade_level": "10th Grade",
            "notes": "Updated by admin"
        }
        
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token.key)
        response = self.client.put(self.url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertIn("student", response.data)
        
        # Check if student was updated
        self.student.refresh_from_db()
        self.assertEqual(self.student.grade_level, "10th Grade")
        self.assertEqual(self.student.notes, "Updated by admin")
    
    def test_delete_student_as_admin(self):
        """Test that admins can delete any student"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token.key)
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        
        # Check if student was soft deleted
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_active)


class ClientStudentSerializerTests(APITestCase):
    """Test the Student serializers"""
    
    def setUp(self):
        self.client_user = User.objects.create_user(
            email="client@example.com",
            password="testpass123",
            first_name="John",
            last_name="Client",
            username="johnclient",
            phone_number="+15551234567",
            user_type="client"
        )
        
        self.student = Student.objects.create(
            client=self.client_user,
            first_name="Alice",
            last_name="Student",
            email="alice@example.com",
            subjects_studying="Math, Science, English"
        )
    
    def test_student_serializer_fields(self):
        """Test that StudentSerializer includes all expected fields"""
        from apps.student_management.serializers import StudentSerializer
        
        serializer = StudentSerializer(self.student)
        data = serializer.data
        
        expected_fields = [
            'id', 'client', 'first_name', 'last_name', 'email', 'phone_number',
            'date_of_birth', 'grade_level', 'subjects_studying', 'subjects_list',
            'notes', 'is_active', 'created_at', 'updated_at', 'client_name'
        ]
        
        for field in expected_fields:
            self.assertIn(field, data)
        
        self.assertEqual(data['subjects_list'], ['Math', 'Science', 'English'])
        self.assertEqual(data['client_name'], 'John Client')
    
    def test_student_create_serializer_validation(self):
        """Test StudentCreateSerializer validation"""
        from apps.student_management.serializers import StudentCreateSerializer
        from rest_framework.request import Request
        from django.test import RequestFactory
        
        factory = RequestFactory()
        request = factory.post('/')
        request.user = self.client_user
        
        # Test valid data
        valid_data = {
            "first_name": "Bob",
            "last_name": "Student",
            "email": "bob@example.com",
            "phone_number": "+15559876543"
        }
        
        serializer = StudentCreateSerializer(data=valid_data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        # Test duplicate name validation
        duplicate_data = {
            "first_name": "Alice",
            "last_name": "Student"
        }
        
        serializer = StudentCreateSerializer(data=duplicate_data, context={'request': request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("already exists", str(serializer.errors))
        
        # Test invalid phone number
        invalid_phone_data = {
            "first_name": "Charlie",
            "last_name": "Student",
            "phone_number": "invalid-phone"
        }
        
        serializer = StudentCreateSerializer(data=invalid_phone_data, context={'request': request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("phone_number", serializer.errors)
