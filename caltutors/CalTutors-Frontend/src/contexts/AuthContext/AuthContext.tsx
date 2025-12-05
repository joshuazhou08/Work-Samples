"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User, RegisterData } from "@/types/auth";
import { authService } from "@/services/auth";
import { getErrorMessage } from "@/utils/errors";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initUser = async () => {
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        try {
          const freshUser = await authService.refreshCurrentUser();
          setUser(freshUser);
        } catch (error) {
          console.error("Failed to refresh user:", error);
        }
      }
      setIsLoading(false);
    };

    initUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);

      router.push("/dashboard");

      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const registeredUser = await authService.register(data);
      setUser(registeredUser);
      router.push("/dashboard");
      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push("/accounts/login");
  };

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.refreshCurrentUser();
      setUser(freshUser);
    } catch (err: any) {
      console.error("Failed to refresh user:", getErrorMessage(err));
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
