import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth";
import { mockUser } from "@/utils/test-utils";

jest.mock("@/services/auth");

describe("AuthContext login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in, returns and stores user", async () => {
    (authService.login as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    let returnedUser;
    await act(async () => {
      returnedUser = await result.current.login(
        "test@example.com",
        "password123"
      );
    });

    // Function returned correct user
    expect(returnedUser).toEqual(mockUser);

    // Context state updated
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("clears auth state on login failure", async () => {
    (authService.login as jest.Mock).mockRejectedValue(
      new Error("Invalid credentials")
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await expect(
      act(async () => {
        await result.current.login("bad@example.com", "wrongpass");
      })
    ).rejects.toThrow("Invalid credentials");

    expect(result.current.user).toBeNull();
  });
});

describe("AuthContext logout", () => {
  it("logs out, clears state", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Set up mock user
    (authService.login as jest.Mock).mockResolvedValue(mockUser);

    // Login to set up user
    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    // Logout
    await act(async () => {
      result.current.logout();
    });

    // State should be cleared
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
