import { create } from "zustand";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type LoginData,
  type RegisterData,
  type User,
} from "../services/authService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;

  // Update authenticated user globally
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Login user
   */
  login: async (credentials) => {
    const data = await loginUser(credentials);

    localStorage.setItem("token", data.token);

    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Register user
   */
  register: async (userData) => {
    const data = await registerUser(userData);

    localStorage.setItem("token", data.token);

    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Logout user
   */
  logout: () => {
    logoutUser();

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  /**
   * Restore authentication after page refresh
   */
  initializeAuth: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      return;
    }

    try {
      const user = await getCurrentUser();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("token");

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Update authenticated user globally
   *
   * Used when the profile is edited so components
   * like Navbar immediately receive the new user data.
   */
  setUser: (user) => {
    set({
      user,
      isAuthenticated: true,
    });
  },
}));