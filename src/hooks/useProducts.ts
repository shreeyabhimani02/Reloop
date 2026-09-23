import {
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

import {
  getProducts,
  getProductById,
  getSellerProducts,
  type ProductFilters,
} from "../services/productService";

export function useSellerProducts(
  sellerId: string
) {
  return useQuery({
    queryKey: ["seller-products", sellerId],
    queryFn: () => getSellerProducts(sellerId),
    enabled: Boolean(sellerId),
  });
}

/* ============================================
   Normal product query
============================================ */

export function useProducts(
  filters: ProductFilters = {}
) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
  });
}

/* ============================================
   Infinite product query
============================================ */

export function useInfiniteProducts(
  filters: ProductFilters = {}
) {
  return useInfiniteQuery({
    queryKey: ["products-infinite", filters],

    queryFn: ({ pageParam }) =>
      getProducts({
        ...filters,
        page: pageParam,
        limit: filters.limit ?? 20,
      }),

    initialPageParam: 1,

    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasNextPage) {
        return undefined;
      }

      return lastPage.pagination.page + 1;
    },
  });
}

/* ============================================
   Single product
============================================ */

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: Boolean(id),
  });
}