import { create } from "zustand";

interface SearchState {
  recentSearches: string[];

  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
}

export const useSearchStore =
  create<SearchState>((set) => ({
    recentSearches: [],

    addSearch: (query) =>
      set((state) => {

        const cleaned =
          query.trim();

        if (!cleaned) {
          return state;
        }

        const filtered =
          state.recentSearches.filter(
            (item) =>
              item.toLowerCase() !==
              cleaned.toLowerCase()
          );

        return {
          recentSearches: [
            cleaned,
            ...filtered,
          ].slice(0, 5),
        };
      }),

    removeSearch: (query) =>
      set((state) => ({
        recentSearches:
          state.recentSearches.filter(
            (item) => item !== query
          ),
      })),

    clearSearches: () =>
      set({
        recentSearches: [],
      }),
  }));