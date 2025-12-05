import { render, screen, fireEvent } from "@testing-library/react";
import { UserDetailHeader } from "./UserDetailHeader";

describe("UserDetailHeader", () => {
  const mockOnBack = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders user name and type", () => {
    render(
      <UserDetailHeader
        firstName="John"
        lastName="Doe"
        userType="tutor"
        onBack={mockOnBack}
      />
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Tutor")).toBeInTheDocument();
  });

  it("renders correct label for client type", () => {
    render(
      <UserDetailHeader
        firstName="Jane"
        lastName="Smith"
        userType="client"
        onBack={mockOnBack}
      />
    );
    expect(screen.getByText("Client")).toBeInTheDocument();
  });

  it("renders correct label for student type", () => {
    render(
      <UserDetailHeader
        firstName="Bob"
        lastName="Johnson"
        userType="student"
        onBack={mockOnBack}
      />
    );
    expect(screen.getByText("Student")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    render(
      <UserDetailHeader
        firstName="John"
        lastName="Doe"
        userType="tutor"
        onBack={mockOnBack}
      />
    );
    fireEvent.click(screen.getByText("Back to Users"));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
