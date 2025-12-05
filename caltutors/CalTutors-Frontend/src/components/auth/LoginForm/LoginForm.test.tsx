import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "./LoginForm";
import { useAuth } from "@/contexts/AuthContext";

jest.mock("@/contexts/AuthContext");

describe("LoginForm", () => {
  const mockLogin = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
  });

  it("renders form inputs and button", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("shows an error message if login fails", async () => {
    // fake login failure
    const fakeError = {
      response: {
        data: {
          error: "Invalid credentials",
          messages: ["Invalid email or password", "Test error"],
        },
        status: 400,
      },
    };
    mockLogin.mockRejectedValue(fakeError);

    render(<LoginForm onSuccess={mockOnSuccess} />);

    // fill in form
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "badpass" },
    });

    // submit form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // wait for error
    await waitFor(() => {
      expect(
        screen.getByText(/Invalid email or password/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    });

    // onSuccess should NOT be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("calls onSuccess if login succeeds", async () => {
    mockLogin.mockResolvedValueOnce({});
    render(<LoginForm onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "goodpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
