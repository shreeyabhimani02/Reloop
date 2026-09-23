import {
  Heart,
  MapPin,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import type { Product } from "../../types/product";
import Badge from "../ui/Badge";
import { useWishlistStore } from "../../store/wishlistStore";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const wishlist = useWishlistStore(
    (state) => state.wishlist
  );

  const toggleWishlist = useWishlistStore(
    (state) => state.toggleWishlist
  );

  const isWishlisted = wishlist.includes(
    product._id
  );

  const handleWishlist = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await toggleWishlist(product._id);

      if (isWishlisted) {
        toast.success("Removed from wishlist");
      } else {
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error(
        "Wishlist update failed:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update wishlist"
      );
    }
  };

  return (
    <article className="product-card">
      <Link
        to={`/product/${product._id}`}
        className="product-card-link"
      >
        <div className="product-image-wrapper">
          <img
            src={
              product.images?.[0] ||
              "/placeholder-product.png"
            }
            alt={product.title}
            className="product-image"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Wishlist button is outside the Link */}
      <button
        type="button"
        className={`wishlist-button ${
          isWishlisted ? "active" : ""
        }`}
        onClick={handleWishlist}
        aria-label={
          isWishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
      >
        <Heart
          size={20}
          fill={
            isWishlisted
              ? "currentColor"
              : "none"
          }
        />
      </button>

      <div className="product-content">
        <Badge>
          {product.condition}
        </Badge>

        <h3>
          <Link
            to={`/product/${product._id}`}
          >
            {product.title}
          </Link>
        </h3>

        <p className="product-price">
          ₹
          {product.price.toLocaleString(
            "en-IN"
          )}
        </p>

        <div className="product-meta">
          <span>
            <MapPin size={14} />
            {product.location}
          </span>

          <span>
            {product.category}
          </span>
        </div>

        <div className="seller-info">
          <span>
            {product.seller.name}
          </span>

          <span className="seller-rating">
            <Star
              size={14}
              fill="currentColor"
            />
            {product.seller.rating}
          </span>
        </div>
      </div>
    </article>
  );
}