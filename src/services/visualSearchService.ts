import type { Product } from "../types/product";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface VisualSearchAnalysis {
  productType: string;
  category: string;
  brand: string;
  color: string;
  keywords: string[];
}

export interface VisualSearchSimilarity {
  productId: string;
  score: number;
}

export interface VisualSearchResponse {
  success: boolean;
  analysis: VisualSearchAnalysis;
  products: Product[];
  searchQuery: string;
  similarityScores: VisualSearchSimilarity[];
  message?: string;
}

function getToken(): string {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please login to use Visual Search");
  }

  return token;
}

export async function performVisualSearch(
  imageUrl: string
): Promise<VisualSearchResponse> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/visual-search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        imageUrl,
      }),
    }
  );

  const data: VisualSearchResponse = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Visual search failed"
    );
  }

  return data;
}