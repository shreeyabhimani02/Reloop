const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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

interface WishlistResponse {
  success: boolean;
  message?: string;
  productIds: string[];
}

/**
 * Parse API response safely
 */
async function parseResponse(
  response: Response
): Promise<WishlistResponse> {
  let data: WishlistResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      throw new Error("Your session has expired. Please login again.");
    }

    throw new Error(
      data.message || "Wishlist request failed"
    );
  }

  return data;
}

/**
 * Get current user's wishlist
 */
export async function getWishlist(): Promise<string[]> {
  const response = await fetch(
    `${API_URL}/api/wishlist`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  return data.productIds;
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(
  productId: string
): Promise<string[]> {
  const response = await fetch(
    `${API_URL}/api/wishlist/${productId}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  return data.productIds;
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(
  productId: string
): Promise<string[]> {
  const response = await fetch(
    `${API_URL}/api/wishlist/${productId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  return data.productIds;
}

/**
 * Clear entire wishlist
 */
export async function clearWishlist(): Promise<string[]> {
  const response = await fetch(
    `${API_URL}/api/wishlist`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  return data.productIds;
}