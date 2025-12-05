import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { AssignRateForm } from "./AssignRateForm";
import { User } from "@/types/auth";
import { adminKeys } from "@/hooks/admin_management";

// Setup MSW server
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("AssignRateForm", () => {
  const mockUsers: User[] = [
    {
      id: 1,
      email: "user1@test.com",
      first_name: "John",
      last_name: "Doe",
      username: "johndoe",
      user_type: "tutor",
    },
    {
      id: 2,
      email: "user2@test.com",
      first_name: "Jane",
      last_name: "Smith",
      username: "janesmith",
      user_type: "tutor",
    },
  ];

  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering and Interactions", () => {
    it("renders correct button based on user type and opens dialog", () => {
      const { rerender } = render(
        <AssignRateForm
          userType="student"
          availableUsers={mockUsers}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText("Assign Tutor")).toBeInTheDocument();

      rerender(
        <AssignRateForm
          userType="tutor"
          availableUsers={mockUsers}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText("Assign Student")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Assign Student"));
      expect(screen.getByText("Select Student")).toBeInTheDocument();
    });

    it("shows message when no users available", () => {
      render(
        <AssignRateForm
          userType="tutor"
          availableUsers={[]}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      fireEvent.click(screen.getByText("Assign Student"));
      expect(
        screen.getByText(/No available students to assign/)
      ).toBeInTheDocument();
    });

    it("displays default rates with available users", () => {
      render(
        <AssignRateForm
          userType="tutor"
          availableUsers={mockUsers}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      fireEvent.click(screen.getByText("Assign Student"));
      expect(screen.getByLabelText("Student Rate ($/hr)")).toHaveValue(60);
      expect(screen.getByLabelText("Tutor Pay Rate ($/hr)")).toHaveValue(40);
    });
  });

  describe("Submit Functionality", () => {
    it("shows loading state and disables buttons when submitting", () => {
      render(
        <AssignRateForm
          userType="tutor"
          availableUsers={mockUsers}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      fireEvent.click(screen.getByText("Assign Student"));
      expect(screen.getByText("Creating...")).toBeInTheDocument();
      expect(screen.getByText("Creating...")).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled();
    });
  });
});
