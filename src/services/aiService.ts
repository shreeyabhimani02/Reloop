const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ListingAIAnalysis {
  title: string;
  description: string;
  category: string;
  condition: string;
  brand: string;
  size: string;
  color: string;
  suggestedPrice: number | null;
}

interface AIAnalysisResponse {
  success: boolean;
  analysis: ListingAIAnalysis;
  message?: string;
}

function getToken(): string {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  return token;
}

export async function analyzeListing(
  imageUrl: string
): Promise<ListingAIAnalysis> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/ai/analyze-listing`,
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

  const data: AIAnalysisResponse =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to analyze listing"
    );
  }

  return data.analysis;
}