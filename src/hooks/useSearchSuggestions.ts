import { useQuery } from "@tanstack/react-query";
import { getSearchSuggestions } from "../services/searchService";

export function useSearchSuggestions(
  query: string
) {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: [
      "search-suggestions",
      trimmedQuery,
    ],

    queryFn: () =>
      getSearchSuggestions(
        trimmedQuery
      ),

    enabled:
      trimmedQuery.length >= 2,

    staleTime: 30 * 1000,

    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: false,
  });
}