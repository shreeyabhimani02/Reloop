import { create } from "zustand";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist as clearWishlistApi,
} from "../services/wishlistService";

interface WishlistState {
  wishlist: string[];

  isLoading: boolean;

  isInitialized: boolean;

  initializeWishlist: () => Promise<void>;

  toggleWishlist: (
    productId: string
  ) => Promise<void>;

  clearWishlist: () => Promise<void>;

  resetWishlist: () => void;

  isWishlisted: (
    productId: string
  ) => boolean;
}

export const useWishlistStore =
  create<WishlistState>((set, get) => ({

    wishlist: [],

    isLoading: false,

    isInitialized: false,


    /**
     * Load wishlist from MongoDB
     */
    initializeWishlist: async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        set({
          wishlist: [],
          isInitialized: true,
          isLoading: false,
        });

        return;
      }

      try {
        set({
          isLoading: true,
        });

        const productIds = await getWishlist();

        set({
          wishlist: productIds,
          isInitialized: true,
          isLoading: false,
        });

      } catch (error) {

        console.error(
          "Failed to initialize wishlist:",
          error
        );

        set({
          wishlist: [],
          isInitialized: true,
          isLoading: false,
        });
      }
    },


    /**
     * Add / remove product from wishlist
     *
     * Uses optimistic UI.
     */
    toggleWishlist: async (
      productId: string
    ) => {

      const currentWishlist =
        get().wishlist;

      const exists =
        currentWishlist.includes(productId);


      // Optimistic update
      set({
        wishlist: exists
          ? currentWishlist.filter(
              (id) => id !== productId
            )
          : [
              ...currentWishlist,
              productId,
            ],
      });


      try {

        const updatedWishlist = exists
          ? await removeFromWishlist(productId)
          : await addToWishlist(productId);


        // Server is the final source of truth
        set({
          wishlist: updatedWishlist,
        });

      } catch (error) {

        // Rollback optimistic update
        set({
          wishlist: currentWishlist,
        });

        console.error(
          "Wishlist update failed:",
          error
        );

        throw error;
      }
    },


    /**
     * Clear entire wishlist
     */
    clearWishlist: async () => {

      const previousWishlist =
        get().wishlist;


      // Optimistic update
      set({
        wishlist: [],
      });


      try {

        const updatedWishlist =
          await clearWishlistApi();

        set({
          wishlist: updatedWishlist,
        });

      } catch (error) {

        // Rollback
        set({
          wishlist: previousWishlist,
        });

        console.error(
          "Failed to clear wishlist:",
          error
        );

        throw error;
      }
    },


    /**
     * Reset local wishlist state
     *
     * Used when user logs out.
     *
     * IMPORTANT:
     * This does NOT delete the MongoDB wishlist.
     */
    resetWishlist: () => {

      set({
        wishlist: [],
        isLoading: false,
        isInitialized: false,
      });
    },


    /**
     * Check whether product is wishlisted
     */
    isWishlisted: (
      productId: string
    ) => {

      return get().wishlist.includes(
        productId
      );
    },
  }));