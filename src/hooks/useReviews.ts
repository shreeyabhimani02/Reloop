import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createReview,
  deleteReview,
  getProductReviews,
  updateReview,
  type CreateReviewData,
} from "../services/reviewService";

export function useProductReviews(
  productId: string
) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => getProductReviews(productId),
    enabled: Boolean(productId),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      reviewData,
    }: {
      productId: string;
      reviewData: CreateReviewData;
    }) => createReview(productId, reviewData),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.productId],
      });

      queryClient.invalidateQueries({
        queryKey: ["product", variables.productId],
      });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      reviewData,
    }: {
      reviewId: string;
      productId: string;
      reviewData: CreateReviewData;
    }) => updateReview(reviewId, reviewData),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.productId],
      });

      queryClient.invalidateQueries({
        queryKey: ["product", variables.productId],
      });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
    }: {
      reviewId: string;
      productId: string;
    }) => deleteReview(reviewId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.productId],
      });

      queryClient.invalidateQueries({
        queryKey: ["product", variables.productId],
      });
    },
  });
}