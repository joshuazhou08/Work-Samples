import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { User } from "@/types/auth";
import type { Student } from "@/types/students";

const mockTutor: User = {
  id: 1,
  email: "tutor@test.com",
  first_name: "John",
  last_name: "Doe",
  username: "johndoe",
  user_type: "tutor",
  phone_number: "+15551234567",
  subjects_taught: "Math, Physics",
};

const mockClient: User = {
  id: 2,
  email: "client@test.com",
  first_name: "Jane",
  last_name: "Smith",
  username: "janesmith",
  user_type: "client",
  phone_number: "+15559876543",
  balance: "100.00",
};

const mockStudent: Student = {
  id: 1,
  client: 2,
  first_name: "Bob",
  last_name: "Johnson",
  email: "bob@test.com",
  phone_number: "+15555555555",
  grade_level: "10th Grade",
  subjects_studying: "Algebra, English",
  notes: "Needs extra help with algebra",
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  client_name: "Jane Smith",
};

describe("PersonalInfoCard", () => {
  it("renders tutor information", () => {
    render(<PersonalInfoCard user={mockTutor} userType="tutor" />);
    expect(screen.getByText(/John\s+Doe/)).toBeInTheDocument();
    expect(screen.getByText("tutor@test.com")).toBeInTheDocument();
    expect(screen.getByText("@johndoe")).toBeInTheDocument();
    expect(screen.getByText("Math, Physics")).toBeInTheDocument();
  });

  it("renders client information", () => {
    render(<PersonalInfoCard user={mockClient} userType="client" />);
    expect(screen.getByText(/Jane\s+Smith/)).toBeInTheDocument();
    expect(screen.getByText("client@test.com")).toBeInTheDocument();
    expect(screen.getByText("@janesmith")).toBeInTheDocument();
  });

  it("renders student information with grade and subjects", () => {
    render(<PersonalInfoCard user={mockStudent} userType="student" />);
    expect(screen.getByText(/Bob\s+Johnson/)).toBeInTheDocument();
    expect(screen.getByText("10th Grade")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Algebra, English")).toBeInTheDocument();
    expect(
      screen.getByText("Needs extra help with algebra")
    ).toBeInTheDocument();
  });

  it("renders N/A for missing optional fields", () => {
    const studentWithoutOptional: Student = {
      ...mockStudent,
      email: undefined,
      phone_number: undefined,
      grade_level: undefined,
      subjects_studying: undefined,
      notes: undefined,
    };
    render(
      <PersonalInfoCard user={studentWithoutOptional} userType="student" />
    );
    const naElements = screen.getAllByText("N/A");
    expect(naElements.length).toBeGreaterThan(0);
  });

  it("renders balance for client users", () => {
    render(<PersonalInfoCard user={mockClient} userType="client" />);
    expect(screen.getByText("Account Balance")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("shows edit button for client balance", () => {
    render(<PersonalInfoCard user={mockClient} userType="client" />);
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("switches to edit mode when edit button is clicked", () => {
    render(<PersonalInfoCard user={mockClient} userType="client" />);
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("Account Balance")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onSaveBalance when save button is clicked", async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);
    render(
      <PersonalInfoCard
        user={mockClient}
        userType="client"
        onSaveBalance={mockOnSave}
      />
    );

    fireEvent.click(screen.getByText("Edit"));
    const input = screen.getByRole("spinbutton"); // number input
    fireEvent.change(input, { target: { value: "150.50" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith("150.50");
    });
  });

  it("cancels editing and resets value", () => {
    render(<PersonalInfoCard user={mockClient} userType="client" />);
    fireEvent.click(screen.getByText("Edit"));

    const input = screen.getByRole("spinbutton"); // number input
    fireEvent.change(input, { target: { value: "999.99" } });
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("does not show balance section for non-client users", () => {
    render(<PersonalInfoCard user={mockTutor} userType="tutor" />);
    expect(screen.queryByText("Account Balance")).not.toBeInTheDocument();
  });

  describe("Integration Tests", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
    });

    afterEach(() => {
      queryClient.clear();
      jest.clearAllMocks();
    });

    it("updates balance and verifies data flow", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      render(
        <QueryClientProvider client={queryClient}>
          <PersonalInfoCard
            user={mockClient}
            userType="client"
            onSaveBalance={mockOnSave}
          />
        </QueryClientProvider>
      );

      // Enter edit mode
      fireEvent.click(screen.getByText("Edit"));

      // Change the balance
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "250.75" } });

      // Save
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      // Verify the callback was called with correct value
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("250.75");
      });
    });

    it("validates balance cannot be negative", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      // Mock window.alert
      const alertMock = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});

      render(
        <QueryClientProvider client={queryClient}>
          <PersonalInfoCard
            user={mockClient}
            userType="client"
            onSaveBalance={mockOnSave}
          />
        </QueryClientProvider>
      );

      // Enter edit mode
      fireEvent.click(screen.getByText("Edit"));

      // Try to set negative balance
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "-50" } });

      // Try to save
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      // Should show alert and not call onSave
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          "Please enter a valid balance (0 or greater)"
        );
      });
      expect(mockOnSave).not.toHaveBeenCalled();

      alertMock.mockRestore();
    });

    it("validates balance must be a valid number", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      // Mock window.alert
      const alertMock = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});

      render(
        <QueryClientProvider client={queryClient}>
          <PersonalInfoCard
            user={mockClient}
            userType="client"
            onSaveBalance={mockOnSave}
          />
        </QueryClientProvider>
      );

      // Enter edit mode
      fireEvent.click(screen.getByText("Edit"));

      // Try to set invalid balance
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "abc" } });

      // Try to save
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      // Should show alert and not call onSave
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          "Please enter a valid balance (0 or greater)"
        );
      });
      expect(mockOnSave).not.toHaveBeenCalled();

      alertMock.mockRestore();
    });

    it("exits edit mode after successful save", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      render(
        <QueryClientProvider client={queryClient}>
          <PersonalInfoCard
            user={mockClient}
            userType="client"
            onSaveBalance={mockOnSave}
          />
        </QueryClientProvider>
      );

      // Enter edit mode
      fireEvent.click(screen.getByText("Edit"));

      // Change and save
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "200" } });
      fireEvent.click(screen.getByText("Save"));

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Should exit edit mode (no more Save/Cancel buttons)
      await waitFor(() => {
        expect(screen.queryByText("Save")).not.toBeInTheDocument();
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });
    });

    it("handles zero balance correctly", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      render(
        <QueryClientProvider client={queryClient}>
          <PersonalInfoCard
            user={mockClient}
            userType="client"
            onSaveBalance={mockOnSave}
          />
        </QueryClientProvider>
      );

      // Enter edit mode
      fireEvent.click(screen.getByText("Edit"));

      // Set to zero
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "0" } });

      // Save
      fireEvent.click(screen.getByText("Save"));

      // Should allow zero balance
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("0");
      });
    });

    it("preserves decimal places in balance", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      render(
        <QueryClientProvider client={queryClient}>
          <PersonalInfoCard
            user={mockClient}
            userType="client"
            onSaveBalance={mockOnSave}
          />
        </QueryClientProvider>
      );

      // Enter edit mode
      fireEvent.click(screen.getByText("Edit"));

      // Set balance with decimal
      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "123.45" } });

      // Save
      fireEvent.click(screen.getByText("Save"));

      // Should preserve decimal format
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith("123.45");
      });
    });
  });
});
