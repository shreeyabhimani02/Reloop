const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export interface SearchSuggestionsResponse {
  success: boolean;
  suggestions: string[];
  message?: string;
}

export async function getSearchSuggestions(
  query: string
): Promise<string[]> {
  const value = query.trim();

  if (value.length < 2) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/api/products/suggestions?q=${encodeURIComponent(
      value
    )}`
  );

  const data: SearchSuggestionsResponse =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch search suggestions"
    );
  }

  return data.suggestions || [];
}