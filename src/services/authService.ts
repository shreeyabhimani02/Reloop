const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  rating: number;
  totalRatings: number;
  itemsSold: number;
  responseRate: number;
}

interface BackendUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  rating?: number;
  totalRatings?: number;
  itemsSold?: number;
  responseRate?: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  location?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Normalize backend user data.
 *
 * Some backend responses currently return:
 *   id
 *
 * while the frontend expects:
 *   _id
 *
 * We normalize everything here so the rest of the
 * frontend always uses _id consistently.
 */
function normalizeUser(user: BackendUser): User {
  return {
    _id: user._id || user.id || "",
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    bio: user.bio || "",
    location: user.location || "",
    rating: user.rating ?? 0,
    totalRatings: user.totalRatings ?? 0,
    itemsSold: user.itemsSold ?? 0,
    responseRate: user.responseRate ?? 0,
  };
}

/**
 * Register a new user
 */
export async function registerUser(
  userData: RegisterData
): Promise<AuthResponse> {
  const response = await fetch(
    `${API_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }
  );

  let data: {
    success: boolean;
    message?: string;
    token: string;
    user: BackendUser;
  };

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Registration failed"
    );
  }

  return {
    success: data.success,
    message: data.message,
    token: data.token,
    user: normalizeUser(data.user),
  };
}

/**
 * Login
 */
export async function loginUser(
  credentials: LoginData
): Promise<AuthResponse> {
  const response = await fetch(
    `${API_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    }
  );

  let data: {
    success: boolean;
    message?: string;
    token: string;
    user: BackendUser;
  };

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Login failed"
    );
  }

  return {
    success: data.success,
    message: data.message,
    token: data.token,
    user: normalizeUser(data.user),
  };
}

/**
 * Get currently authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  const token =
    localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "No authentication token found"
    );
  }

  const response = await fetch(
    `${API_URL}/api/auth/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  let data: {
    success: boolean;
    message?: string;
    user: BackendUser;
  };

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch current user"
    );
  }

  return normalizeUser(data.user);
}

/**
 * Logout
 */
export function logoutUser(): void {
  localStorage.removeItem("token");
}