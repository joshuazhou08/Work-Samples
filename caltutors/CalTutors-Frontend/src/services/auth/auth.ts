import { transport } from "@/services/transport";
import {
  User,
  LoginResponse,
  RegisterData,
  UpdateProfilePayload,
  UpdateProfileResponse,
} from "@/types/auth";

class AuthService {
  public logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
  }

  public async register(data: RegisterData): Promise<User> {
    const user = await transport.axios
      .post<User>("/accounts/register/", data)
      .then((res) => res.data);

    this.setCurrentUser(user);

    return user;
  }

  public getCurrentUser(): User | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  public setCurrentUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  public async refreshCurrentUser(): Promise<User> {
    const user = await transport.axios
      .get<User>("/accounts/me/")
      .then((res) => res.data);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    return user;
  }

  public async login(email: string, password: string): Promise<User> {
    const { token, user } = await transport.axios
      .post<LoginResponse>("/accounts/login/", {
        email,
        password,
      })
      .then((res) => res.data);

    // Persist token + user
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    return user;
  }

  public async updateProfile(
    data: UpdateProfilePayload,
  ): Promise<UpdateProfileResponse> {
    const response = await transport.axios
      .patch<UpdateProfileResponse>("/accounts/profile/", data)
      .then((res) => res.data);

    this.setCurrentUser(response.user);

    return response;
  }

  public async requestPasswordReset(email: string): Promise<string> {
    const { message } = await transport.axios
      .post<{ message: string }>("/accounts/password-reset/", { email })
      .then((res) => res.data);

    return message;
  }

  public async resetPassword(
    uid: string,
    token: string,
    newPassword: string,
    newPasswordConfirm: string,
  ): Promise<string> {
    const { message } = await transport.axios
      .post<{ message: string }>("/accounts/password-reset/confirm/", {
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      .then((res) => res.data);

    return message;
  }
}

export const authService = new AuthService();
