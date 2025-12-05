import { authService } from "@/services/auth";
import { transport } from "@/services/transport";
import { mockUser } from "@/utils/test-utils";
import { LoginResponse, RegisterData } from "@/types/auth";

jest.mock("@/services/transport", () => ({
  transport: {
    axios: {
      post: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("login", () => {
    it("logs in and stores token + user in localStorage", async () => {
      const mockResponse: LoginResponse = {
        token: "abc123",
        user: mockUser,
      };

      (transport.axios.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await authService.login(mockUser.email, "password");

      expect(result).toEqual(mockUser);
      expect(localStorage.getItem("authToken")).toBe("abc123");
      expect(localStorage.getItem("user")).toEqual(JSON.stringify(mockUser));
      expect(transport.axios.post).toHaveBeenCalledWith(
        "/accounts/login/",
        expect.objectContaining({
          email: mockUser.email,
          password: "password",
        })
      );
    });
  });

  describe("register", () => {
    it("registers and stores user in localStorage", async () => {
      const registerData: RegisterData = {
        email: "new@example.com",
        password: "strongPass123",
        password_confirm: "strongPass123",
        first_name: "New",
        last_name: "User",
        username: "newbie",
        phone_number: "+15559876543",
        user_type: "tutor",
      };

      (transport.axios.post as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.register(registerData);

      expect(result).toEqual(mockUser);
      expect(localStorage.getItem("user")).toEqual(JSON.stringify(mockUser));
      expect(transport.axios.post).toHaveBeenCalledWith(
        "/accounts/register/",
        registerData
      );
    });
  });

  describe("refreshCurrentUser", () => {
    it("fetches current user and updates localStorage", async () => {
      (transport.axios.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.refreshCurrentUser();

      expect(result).toEqual(mockUser);
      expect(localStorage.getItem("user")).toEqual(JSON.stringify(mockUser));
      expect(transport.axios.get).toHaveBeenCalledWith("/accounts/me/");
    });
  });

  describe("logout", () => {
    it("removes token and user from localStorage", () => {
      localStorage.setItem("authToken", "abc123");
      localStorage.setItem("user", JSON.stringify(mockUser));

      authService.logout();

      expect(localStorage.getItem("authToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns null if no user is stored", () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it("returns parsed user if stored in localStorage", () => {
      localStorage.setItem("user", JSON.stringify(mockUser));
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe("setCurrentUser", () => {
    it("stores user in localStorage", () => {
      authService.setCurrentUser(mockUser);
      expect(localStorage.getItem("user")).toEqual(JSON.stringify(mockUser));
    });
  });
});
