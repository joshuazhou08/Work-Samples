import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import UserDetailPage from "./page";
import {
  useAdminTutors,
  useAdminClients,
  usePatchAdminClient,
} from "@/hooks/admin_management";
import {
  useStudents,
  useStudent,
  useCreateStudent,
  usePartialUpdateStudent,
  useDeleteStudent,
} from "@/hooks/student_management";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/hooks/admin_management", () => ({
  useAdminTutors: jest.fn(),
  useAdminClients: jest.fn(),
  usePatchAdminClient: jest.fn(),
  useStudentRates: jest.fn(() => ({ data: [], isLoading: false })),
  useTutorRates: jest.fn(() => ({ data: [], isLoading: false })),
  useCreateRate: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useUpdateRate: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useDeleteRate: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));

jest.mock("@/hooks/student_management", () => ({
  useStudents: jest.fn(),
  useStudent: jest.fn(),
  useCreateStudent: jest.fn(),
  usePartialUpdateStudent: jest.fn(),
  useDeleteStudent: jest.fn(),
}));

const mockTutor = {
  id: 1,
  email: "tutor@test.com",
  first_name: "John",
  last_name: "Doe",
  username: "johndoe",
  user_type: "tutor" as const,
  subjects_taught: "Math, Physics",
  phone_number: "+15551234567",
};

const mockClient = {
  id: 2,
  email: "client@test.com",
  first_name: "Jane",
  last_name: "Smith",
  username: "janesmith",
  user_type: "client" as const,
  balance: "100.00",
  phone_number: "+15559876543",
};

const mockStudent = {
  id: 3,
  client: 2,
  first_name: "Bob",
  last_name: "Johnson",
  email: "bob@test.com",
  phone_number: "+15555555555",
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  grade_level: "10th Grade",
  subjects_studying: "Algebra",
  client_name: "Jane Smith",
};

describe("UserDetailPage", () => {
  const mockPush = jest.fn();
  const mockSearchParamsGet = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useParams as jest.Mock).mockReturnValue({ id: "1" });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockSearchParamsGet,
    });
    (useAdminTutors as jest.Mock).mockReturnValue({
      data: [mockTutor],
      isLoading: false,
    });
    (useAdminClients as jest.Mock).mockReturnValue({
      data: [mockClient],
      isLoading: false,
    });
    (useStudents as jest.Mock).mockReturnValue({
      data: { students: [], count: 0 },
      isLoading: false,
    });
    (useStudent as jest.Mock).mockReturnValue({
      data: mockStudent,
      isLoading: false,
    });
    (usePatchAdminClient as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    (useCreateStudent as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    (usePartialUpdateStudent as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    (useDeleteStudent as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    mockSearchParamsGet.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Unit Tests - Component Logic", () => {
    it("shows loading state when data is loading", () => {
      (useAdminTutors as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });
      render(<UserDetailPage />);

      expect(
        screen.getByText("Loading user information...")
      ).toBeInTheDocument();
    });

    it("shows error state when user not found", () => {
      (useAdminTutors as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });
      (useAdminClients as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });
      render(<UserDetailPage />);

      expect(screen.getByText("User not found")).toBeInTheDocument();
    });

    it("displays Student Rates card for tutors", () => {
      mockSearchParamsGet.mockReturnValue("tutor");
      render(<UserDetailPage />);

      expect(screen.getByText("Student Rates")).toBeInTheDocument();
    });

    it("displays Tutoring Rates card for students", async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === "type") return "student";
        return null;
      });
      (useParams as jest.Mock).mockReturnValue({ id: "3" });
      (useStudent as jest.Mock).mockReturnValue({
        data: mockStudent,
        isLoading: false,
      });
      render(<UserDetailPage />);

      expect(await screen.findByText("Tutoring Rates")).toBeInTheDocument();
    });

    it("displays Students card only for clients", () => {
      mockSearchParamsGet.mockReturnValue("client");
      (useParams as jest.Mock).mockReturnValue({ id: "2" });
      render(<UserDetailPage />);

      expect(screen.getByText("Students (0)")).toBeInTheDocument();
      expect(screen.getByText("Add Student")).toBeInTheDocument();
    });

    it("does not show balance section for tutors", () => {
      mockSearchParamsGet.mockReturnValue("tutor");
      render(<UserDetailPage />);

      expect(screen.queryByText("Account Balance")).not.toBeInTheDocument();
    });

    it("does not show balance section for students", () => {
      mockSearchParamsGet.mockReturnValue("student");
      (useParams as jest.Mock).mockReturnValue({ id: "3" });
      (useStudent as jest.Mock).mockReturnValue({
        data: mockStudent,
        isLoading: false,
      });
      render(<UserDetailPage />);

      expect(screen.queryByText("Account Balance")).not.toBeInTheDocument();
    });
  });

  describe("Integration Tests - Data Fetching & Display", () => {
    it("fetches and renders tutor data", () => {
      mockSearchParamsGet.mockReturnValue("tutor");
      render(<UserDetailPage />);

      expect(
        screen.getByRole("heading", { name: /John Doe/ })
      ).toBeInTheDocument();
      expect(screen.getByText("Tutor")).toBeInTheDocument();

      // Verify name appears in both header and PersonalInfoCard
      const nameElements = screen.getAllByText(/John Doe/);
      expect(nameElements).toHaveLength(2);

      expect(screen.getByText("tutor@test.com")).toBeInTheDocument();
      expect(screen.getByText("@johndoe")).toBeInTheDocument();
      expect(screen.getByText("+15551234567")).toBeInTheDocument();
      expect(screen.getByText("Math, Physics")).toBeInTheDocument();
    });

    it("fetches and renders client data with balance", () => {
      mockSearchParamsGet.mockReturnValue("client");
      (useParams as jest.Mock).mockReturnValue({ id: "2" });
      render(<UserDetailPage />);

      expect(
        screen.getByRole("heading", { name: /Jane Smith/ })
      ).toBeInTheDocument();
      expect(screen.getByText("Client")).toBeInTheDocument();

      // Verify name appears in both header and PersonalInfoCard
      const nameElements = screen.getAllByText(/Jane Smith/);
      expect(nameElements).toHaveLength(2);

      expect(screen.getByText("client@test.com")).toBeInTheDocument();
      expect(screen.getByText("@janesmith")).toBeInTheDocument();
      expect(screen.getByText("Account Balance")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
    });

    it("fetches and renders student data", async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === "type") return "student";
        return null;
      });
      (useParams as jest.Mock).mockReturnValue({ id: "3" });
      (useStudent as jest.Mock).mockReturnValue({
        data: mockStudent,
        isLoading: false,
      });
      render(<UserDetailPage />);

      expect(
        await screen.findByRole("heading", { name: /Bob Johnson/ })
      ).toBeInTheDocument();
      expect(screen.getByText("Student")).toBeInTheDocument();

      // Verify name appears in both header and PersonalInfoCard
      const nameElements = screen.getAllByText(/Bob Johnson/);
      expect(nameElements).toHaveLength(2);

      expect(screen.getByText("10th Grade")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Algebra")).toBeInTheDocument();
    });

    it("navigates back to tutors tab when from=tutors", () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === "type") return "tutor";
        if (key === "from") return "tutors";
        return null;
      });
      render(<UserDetailPage />);

      fireEvent.click(screen.getByText("Back to Users"));
      expect(mockPush).toHaveBeenCalledWith(
        "/dashboard/user-management?tab=tutors"
      );
    });

    it("navigates back to clients tab when from=clients", () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === "type") return "client";
        if (key === "from") return "clients";
        return null;
      });
      (useParams as jest.Mock).mockReturnValue({ id: "2" });
      render(<UserDetailPage />);

      fireEvent.click(screen.getByText("Back to Users"));
      expect(mockPush).toHaveBeenCalledWith(
        "/dashboard/user-management?tab=clients"
      );
    });

    it("navigates back to students tab when from=students", () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === "type") return "student";
        if (key === "from") return "students";
        return null;
      });
      (useParams as jest.Mock).mockReturnValue({ id: "3" });
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudent,
        isLoading: false,
      });
      render(<UserDetailPage />);

      fireEvent.click(screen.getByText("Back to Users"));
      expect(mockPush).toHaveBeenCalledWith(
        "/dashboard/user-management?tab=students"
      );
    });

    it("navigates to default when no from parameter", () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === "type") return "tutor";
        return null;
      });
      render(<UserDetailPage />);

      fireEvent.click(screen.getByText("Back to Users"));
      expect(mockPush).toHaveBeenCalledWith("/dashboard/user-management");
    });
  });
});
