const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ProfileUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarPublicId?: string;
  bio?: string;
  location?: string;
  rating: number;
  totalRatings: number;
  itemsSold: number;
  responseRate: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  user: ProfileUser;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<ProfileUser> {
  const response = await fetch(
    `${API_URL}/api/users/me`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  let data: ProfileResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      throw new Error(
        "Your session has expired. Please login again."
      );
    }

    throw new Error(
      data.message || "Failed to fetch profile"
    );
  }

  return data.user;
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(
  updates: {
    name?: string;
    bio?: string;
    location?: string;
    avatar?: string;
    avatarPublicId?: string;
  }
): Promise<ProfileUser> {
  const response = await fetch(
    `${API_URL}/api/users/me`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    }
  );

  let data: ProfileResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      throw new Error(
        "Your session has expired. Please login again."
      );
    }

    throw new Error(
      data.message || "Failed to update profile"
    );
  }

  return data.user;
}

/**
 * Get a public seller profile
 */
export async function getPublicUser(
  userId: string
): Promise<ProfileUser> {
  const response = await fetch(
    `${API_URL}/api/users/${userId}`
  );

  let data: ProfileResponse;

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
        "Failed to fetch seller profile"
    );
  }

  return data.user;
}