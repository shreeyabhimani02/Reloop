import {
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  useProduct,
  useProducts,
} from "../../hooks/useProducts";

import {
  useCreateConversation,
} from "../../hooks/useChat";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ProductGrid from "../../components/product/ProductGrid";

import { useWishlistStore } from "../../store/wishlistStore";

import ReviewSection from "../../components/Reviews/ReviewSection";

export default function ProductDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(0);

  // ─────────────────────────────────────────────
  // PRODUCT
  // ─────────────────────────────────────────────

  const {
    data: product,
    isLoading,
    isError,
  } = useProduct(id || "");

  // ─────────────────────────────────────────────
  // SIMILAR PRODUCTS
  // ─────────────────────────────────────────────

  const { data: similarProductsData } = useProducts({
    category: product?.category,
    limit: 6,
  });

  const similarProducts =
    similarProductsData?.products.filter(
      (item) => item._id !== product?._id
    ) ?? [];

  // ─────────────────────────────────────────────
  // WISHLIST
  // ─────────────────────────────────────────────

  const wishlist = useWishlistStore(
    (state) => state.wishlist
  );

  const toggleWishlist = useWishlistStore(
    (state) => state.toggleWishlist
  );

  // ─────────────────────────────────────────────
  // CHAT
  // ─────────────────────────────────────────────

  const createConversation =
    useCreateConversation();

  async function handleMessageSeller() {
    if (!product) return;

    try {
      const conversation =
        await createConversation.mutateAsync({
          sellerId: product.seller._id,
          productId: product._id,
        });

      navigate(
        `/chat?conversation=${conversation._id}`
      );
    } catch (error) {
      console.error(
        "Failed to start conversation:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start conversation"
      );
    }
  }

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="page">
        <div className="empty-state">
          <h2>Loading product...</h2>
          <p>
            Please wait while we fetch the listing.
          </p>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────
  // ERROR
  // ─────────────────────────────────────────────

  if (isError || !product) {
    return (
      <main className="page">
        <div className="empty-state">
          <h2>Product not found</h2>

          <p>
            This listing may have been removed or is no
            longer available.
          </p>

          <Link to="/">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────
  // VALUES
  // ─────────────────────────────────────────────

  const images =
    product.images?.length > 0
      ? product.images
      : ["/placeholder-product.png"];

  const isWishlisted =
    wishlist.includes(product._id);

  const currentImage =
    images[selectedImage] || images[0];

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────

  function handleWishlist(productId: string) {
    toggleWishlist(productId);

    if (isWishlisted) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  }

  function handlePreviousImage() {
    setSelectedImage((current) =>
      current === 0
        ? images.length - 1
        : current - 1
    );
  }

  function handleNextImage() {
    setSelectedImage((current) =>
      current === images.length - 1
        ? 0
        : current + 1
    );
  }

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  return (
    <main className="page">
      <section className="product-details">

        {/* ═══════════════════════════════════════
            PRODUCT GALLERY
        ═══════════════════════════════════════ */}

        <div className="product-gallery">

          <div className="product-main-image">

            <img
              src={currentImage}
              alt={`${product.title} - image ${
                selectedImage + 1
              }`}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow-left"
                  aria-label="Previous image"
                  onClick={handlePreviousImage}
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  className="gallery-arrow gallery-arrow-right"
                  aria-label="Next image"
                  onClick={handleNextImage}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

          </div>

          {/* THUMBNAILS */}

          {images.length > 1 && (
            <div className="product-thumbnails">

              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={
                    selectedImage === index
                      ? "product-thumbnail active"
                      : "product-thumbnail"
                  }
                  onClick={() =>
                    setSelectedImage(index)
                  }
                  aria-label={`View image ${
                    index + 1
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                  />
                </button>
              ))}

            </div>
          )}

        </div>

        {/* ═══════════════════════════════════════
            PRODUCT INFORMATION
        ═══════════════════════════════════════ */}

        <div className="product-information">

          <Badge>
            {product.condition}
          </Badge>

          <h1>{product.title}</h1>

          <p className="details-price">
            ₹{product.price.toLocaleString("en-IN")}
          </p>

          {/* LOCATION + VIEWS */}

          <div className="details-meta">

            <div className="details-location">
              <MapPin size={17} />
              {product.location}
            </div>

            <div className="details-views">
              <Eye size={17} />
              {product.views ?? 0} views
            </div>

          </div>

          {/* ═══════════════════════════════════════
              SELLER
          ═══════════════════════════════════════ */}

          <Link
            to={`/seller/${product.seller?._id}`}
            className="seller-panel seller-panel-link"
          >

            <div className="seller-avatar">

              {product.seller?.avatar ? (
                <img
                  src={product.seller.avatar}
                  alt={product.seller.name}
                />
              ) : (
                product.seller?.name
                  ?.charAt(0)
                  .toUpperCase()
              )}

            </div>

            <div>

              <strong>
                {product.seller?.name ||
                  "Unknown seller"}
              </strong>

              <div className="seller-rating">

                <Star
                  size={14}
                  fill="currentColor"
                />

                {product.seller?.rating ?? 0}

                {" · "}

                {product.seller?.itemsSold ?? 0}

                {" sales"}

              </div>

            </div>

          </Link>

          {/* ═══════════════════════════════════════
              ACTIONS
          ═══════════════════════════════════════ */}

          <div className="details-actions">

            <Button size="lg">
              Buy now
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleMessageSeller}
              disabled={
                createConversation.isPending
              }
            >
              <MessageCircle size={18} />

              {createConversation.isPending
                ? "Opening chat..."
                : "Message seller"}
            </Button>

            <button
              type="button"
              className={
                isWishlisted
                  ? "details-wishlist active"
                  : "details-wishlist"
              }
              aria-label={
                isWishlisted
                  ? "Remove from wishlist"
                  : "Add to wishlist"
              }
              onClick={() =>
                handleWishlist(product._id)
              }
            >
              <Heart
                size={21}
                fill={
                  isWishlisted
                    ? "currentColor"
                    : "none"
                }
              />
            </button>

          </div>

          {/* ═══════════════════════════════════════
              TRUST
          ═══════════════════════════════════════ */}

          <div className="trust-box">

            <ShieldCheck size={20} />

            <div>

              <strong>
                Buy with confidence
              </strong>

              <p>
                Secure transactions and
                trusted sellers.
              </p>

            </div>

          </div>

          {/* ═══════════════════════════════════════
              DESCRIPTION
          ═══════════════════════════════════════ */}

          <div className="description">

            <h2>Description</h2>

            <p>
              {product.description}
            </p>

          </div>

          {/* ═══════════════════════════════════════
              PRODUCT DETAILS
          ═══════════════════════════════════════ */}

          <div className="description">

            <h2>Product details</h2>

            {product.brand && (
              <p>
                <strong>Brand:</strong>{" "}
                {product.brand}
              </p>
            )}

            {product.size && (
              <p>
                <strong>Size:</strong>{" "}
                {product.size}
              </p>
            )}

            {product.color && (
              <p>
                <strong>Color:</strong>{" "}
                {product.color}
              </p>
            )}

            <p>
              <strong>Category:</strong>{" "}
              {product.category}
            </p>

            <p>
              <strong>Condition:</strong>{" "}
              {product.condition}
            </p>

          </div>

        </div>

      </section>

      {/* ═══════════════════════════════════════
          SIMILAR PRODUCTS
      ═══════════════════════════════════════ */}

      {similarProducts.length > 0 && (
        <section className="section">

          <div className="section-header">

            <div>

              <span className="section-eyebrow">
                You may also like
              </span>

              <h2>
                Similar products
              </h2>

            </div>

          </div>

          <ProductGrid
            products={similarProducts}
          />

        </section>
      )}

      {/* Reviews */}
        {product && product.seller && (
          <ReviewSection
            productId={product._id}
            sellerId={product.seller._id}
          />
        )}

    </main>
  );
}