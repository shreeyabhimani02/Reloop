import { useState } from "react";
import { Pencil, Star, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import {
  useCreateReview,
  useDeleteReview,
  useProductReviews,
  useUpdateReview,
} from "../../hooks/useReviews";

import { useAuthStore } from "../../store/useAuthStore";

import "./ReviewSection.css";

interface ReviewSectionProps {
  productId: string;
  sellerId: string;
}

export default function ReviewSection({
  productId,
  sellerId,
}: ReviewSectionProps) {
  const { user, isAuthenticated } = useAuthStore();

  const {
    data,
    isLoading,
    isError,
  } = useProductReviews(productId);

  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [editingReviewId, setEditingReviewId] =
    useState<string | null>(null);

  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  const reviews = data?.reviews ?? [];
  const stats = data?.stats ?? {
    averageRating: 0,
    totalReviews: 0,
  };

  const isSeller =
    Boolean(user?._id) && user?._id === sellerId;

  const myReview = reviews.find(
    (review) => review.reviewer?._id === user?._id
  );

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to leave a review.");
      return;
    }

    if (isSeller) {
      toast.error("You cannot review your own listing.");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    if (comment.trim().length < 3) {
      toast.error("Please write at least 3 characters.");
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        productId,
        reviewData: {
          rating,
          comment: comment.trim(),
        },
      });

      setRating(0);
      setComment("");

      toast.success("Review added successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add review"
      );
    }
  };

  const startEditing = (
    reviewId: string,
    currentRating: number,
    currentComment: string
  ) => {
    setEditingReviewId(reviewId);
    setEditRating(currentRating);
    setEditComment(currentComment);
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
  };

  const handleUpdate = async () => {
    if (!editingReviewId) return;

    if (editRating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    if (editComment.trim().length < 3) {
      toast.error("Please write at least 3 characters.");
      return;
    }

    try {
      await updateReviewMutation.mutateAsync({
        reviewId: editingReviewId,
        productId,
        reviewData: {
          rating: editRating,
          comment: editComment.trim(),
        },
      });

      toast.success("Review updated successfully.");
      cancelEditing();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update review"
      );
    }
  };

  const handleDelete = async (reviewId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) return;

    try {
      await deleteReviewMutation.mutateAsync({
        reviewId,
        productId,
      });

      toast.success("Review deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete review"
      );
    }
  };

  const renderStars = (
    value: number,
    interactive = false,
    onSelect?: (value: number) => void
  ) => {
    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`review-star ${
              star <= value ? "active" : ""
            }`}
            onClick={() =>
              interactive && onSelect?.(star)
            }
            disabled={!interactive}
            aria-label={`${star} star${
              star > 1 ? "s" : ""
            }`}
          >
            <Star
              size={interactive ? 22 : 18}
              fill={
                star <= value
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <section className="review-section">
      <div className="review-section-header">
        <div>
          <h2>Ratings & Reviews</h2>

          <p>
            {stats.totalReviews === 0
              ? "No reviews yet"
              : `${stats.totalReviews} review${
                  stats.totalReviews === 1 ? "" : "s"
                }`}
          </p>
        </div>

        {stats.totalReviews > 0 && (
          <div className="review-summary">
            <div className="review-average">
              {stats.averageRating.toFixed(1)}
            </div>

            <div>
              {renderStars(stats.averageRating)}

              <span>
                {stats.totalReviews} rating
                {stats.totalReviews === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Review */}
      {isAuthenticated &&
        !isSeller &&
        !myReview && (
          <div className="review-form">
            <h3>Share your experience</h3>

            <div className="review-form-rating">
              <span>Your rating</span>

              {renderStars(
                rating,
                true,
                setRating
              )}
            </div>

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              placeholder="Write a review about this product..."
              maxLength={500}
              rows={4}
            />

            <div className="review-form-footer">
              <span>
                {comment.length}/500
              </span>

              <button
                type="button"
                className="review-submit-button"
                onClick={handleSubmit}
                disabled={
                  createReviewMutation.isPending
                }
              >
                {createReviewMutation.isPending
                  ? "Submitting..."
                  : "Submit Review"}
              </button>
            </div>
          </div>
        )}

      {!isAuthenticated && (
        <div className="review-login-message">
          Log in to leave a review.
        </div>
      )}

      {isSeller && (
        <div className="review-seller-message">
          You are the seller of this listing.
        </div>
      )}

      {isLoading && (
        <div className="review-loading">
          Loading reviews...
        </div>
      )}

      {isError && (
        <div className="review-error">
          Failed to load reviews.
        </div>
      )}

      {/* Reviews */}
      {!isLoading &&
        !isError &&
        reviews.length === 0 && (
          <div className="review-empty">
            <Star size={32} />
            <h3>No reviews yet</h3>
            <p>
              Be the first person to review this
              listing.
            </p>
          </div>
        )}

      <div className="reviews-list">
        {reviews.map((review) => {
          const isOwnReview =
            review.reviewer?._id === user?._id;

          const isEditing =
            editingReviewId === review._id;

          return (
            <article
              key={review._id}
              className="review-card"
            >
              <div className="review-card-header">
                <div className="reviewer-info">
                  {review.reviewer?.avatar ? (
                    <img
                      src={review.reviewer.avatar}
                      alt={review.reviewer.name}
                      className="reviewer-avatar"
                    />
                  ) : (
                    <div className="reviewer-avatar reviewer-avatar-placeholder">
                      {review.reviewer?.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div>
                    <strong>
                      {review.reviewer?.name ||
                        "User"}
                    </strong>

                    <span>
                      {new Date(
                        review.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isOwnReview && !isEditing && (
                  <div className="review-actions">
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(
                          review._id,
                          review.rating,
                          review.comment
                        )
                      }
                      aria-label="Edit review"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(review._id)
                      }
                      disabled={
                        deleteReviewMutation.isPending
                      }
                      aria-label="Delete review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="review-edit-form">
                  {renderStars(
                    editRating,
                    true,
                    setEditRating
                  )}

                  <textarea
                    value={editComment}
                    onChange={(event) =>
                      setEditComment(
                        event.target.value
                      )
                    }
                    maxLength={500}
                    rows={4}
                  />

                  <div className="review-edit-actions">
                    <button
                      type="button"
                      className="review-cancel-button"
                      onClick={cancelEditing}
                    >
                      <X size={16} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="review-save-button"
                      onClick={handleUpdate}
                      disabled={
                        updateReviewMutation.isPending
                      }
                    >
                      {updateReviewMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {renderStars(review.rating)}

                  <p className="review-comment">
                    {review.comment}
                  </p>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}