const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ReviewUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Review {
  _id: string;
  product: string;
  reviewer: ReviewUser;
  seller: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export interface ReviewsResponse {
  success: boolean;
  reviews: Review[];
  stats: ReviewStats;
}

export interface ReviewResponse {
  success: boolean;
  review: Review;
  message?: string;
}

export interface CreateReviewData {
  rating: number;
  comment: string;
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function getProductReviews(
  productId: string
): Promise<ReviewsResponse> {
  const response = await fetch(
    `${API_URL}/api/reviews/product/${productId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch reviews"
    );
  }

  return data;
}

export async function createReview(
  productId: string,
  reviewData: CreateReviewData
): Promise<ReviewResponse> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/api/reviews/product/${productId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create review"
    );
  }

  return data;
}

export async function updateReview(
  reviewId: string,
  reviewData: CreateReviewData
): Promise<ReviewResponse> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/api/reviews/${reviewId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update review"
    );
  }

  return data;
}

export async function deleteReview(
  reviewId: string
): Promise<{ success: boolean; message: string }> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/api/reviews/${reviewId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete review"
    );
  }

  return data;
}