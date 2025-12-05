import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterForm from "./RegisterForm";
import { useAuth } from "@/contexts/AuthContext";

jest.mock("@/contexts/AuthContext");

describe("RegisterForm", () => {
  const mockRegister = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });
  });

  it("shows step 1 fields (user type, first name, last name)", () => {
    render(<RegisterForm />);

    // Check user type radio buttons
    expect(screen.queryAllByLabelText(/Client/i)[0]).toBeInTheDocument();
    expect(screen.queryAllByLabelText(/Tutor/i)[0]).toBeInTheDocument();

    // Check name fields
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();

    // check already have an account link
    expect(screen.getByText(/Already have an account?/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in/i)).toHaveAttribute(
      "href",
      "/accounts/login"
    );
  });

  it("shows step 2 fields (email, username, phone) when next is clicked", () => {
    render(<RegisterForm />);

    // Fill in step 1 required fields
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Doe" },
    });

    // Go to next step
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Check step 2 fields
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();

    // check already have an account link
    expect(screen.getByText(/Already have an account?/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in/i)).toHaveAttribute(
      "href",
      "/accounts/login"
    );
  });

  it("shows step 3 fields (password, confirm password) when next is clicked twice", () => {
    render(<RegisterForm />);

    // Fill in step 1
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Fill in step 2
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "johndoe" },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: "4155550100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Check step 3 fields
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();

    // check already have an account link
    expect(screen.getByText(/Already have an account?/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in/i)).toHaveAttribute(
      "href",
      "/accounts/login"
    );
  });

  it("shows an error message if registration fails", async () => {
    // fake registration failure
    const fakeError = {
      response: {
        data: {
          error: "Validation Failed",
          messages: [
            "Email is required",
            "Password must be at least 8 characters",
          ],
        },
        status: 400,
      },
    };
    mockRegister.mockRejectedValue(fakeError);

    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill out all steps and submit
    await fillOutCompleteForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    // wait for error
    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });

    // onSuccess should NOT be called, onError should be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(
      "Email is required\nPassword must be at least 8 characters"
    );
  });

  it("calls onSuccess if registration succeeds", async () => {
    mockRegister.mockResolvedValueOnce({});
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill out all steps and submit
    await fillOutCompleteForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(mockOnError).not.toHaveBeenCalled();
  });

  // Helper function to fill out the complete form
  async function fillOutCompleteForm() {
    // Step 1
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Step 2
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "johndoe" },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: "4155550100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Step 3
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Password123!" },
    });
  }
});
