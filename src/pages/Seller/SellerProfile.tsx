import {
  MapPin,
  MessageCircle,
  Star,
  ArrowLeft,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useSellerProducts } from "../../hooks/useProducts";
import { usePublicUser } from "../../hooks/useUser";
import { useCreateConversation } from "../../hooks/useChat";

import ProductGrid from "../../components/product/ProductGrid";

import "./SellerProfile.css";

export default function SellerProfile() {
  const navigate = useNavigate();
  const { sellerId } = useParams();

  const createConversation =
    useCreateConversation();

  // --------------------------------------------------------------------------
  // SELLER PROFILE
  // --------------------------------------------------------------------------

  const {
    data: seller,
    isLoading: isSellerLoading,
    isError: isSellerError,
  } = usePublicUser(sellerId || "");

  // --------------------------------------------------------------------------
  // SELLER PRODUCTS
  // --------------------------------------------------------------------------

  const {
    data: sellerProducts = [],
    isLoading: isProductsLoading,
  } = useSellerProducts(sellerId || "");

  const isLoading =
    isSellerLoading || isProductsLoading;

  const isError = isSellerError;

  // --------------------------------------------------------------------------
  // MESSAGE SELLER
  // --------------------------------------------------------------------------

  async function handleMessageSeller() {
    if (!seller) return;

    try {
      const conversation =
        await createConversation.mutateAsync({
          sellerId: seller._id,
        });

      navigate(
        `/chat?conversation=${conversation._id}`
      );
    } catch (error) {
      console.error(
        "Failed to start conversation:",
        error
      );
    }
  }

  // --------------------------------------------------------------------------
  // LOADING
  // --------------------------------------------------------------------------

  if (isLoading) {
    return (
      <main className="page seller-page">
        <div className="empty-state">
          <h2>Loading seller...</h2>
          <p>Please wait.</p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // ERROR
  // --------------------------------------------------------------------------

  if (isError || !seller) {
    return (
      <main className="page seller-page">
        <div className="empty-state">
          <h2>Seller not found</h2>

          <p>
            This seller profile may no longer be
            available.
          </p>

          <Link to="/">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // PAGE
  // --------------------------------------------------------------------------

  return (
    <main className="page seller-page">

      {/* ------------------------------------------------------------------ */}
      {/* BACK BUTTON                                                        */}
      {/* ------------------------------------------------------------------ */}

      <Link
        to="/"
        className="seller-back"
      >
        <ArrowLeft size={17} />
        Back to marketplace
      </Link>

      {/* ------------------------------------------------------------------ */}
      {/* SELLER PROFILE HEADER                                              */}
      {/* ------------------------------------------------------------------ */}

      <section className="seller-profile-card">

        <div className="seller-profile-main">

          {/* AVATAR */}

          <div className="seller-profile-avatar">
            {seller.avatar ? (
              <img
                src={seller.avatar}
                alt={`${seller.name}'s profile`}
              />
            ) : (
              seller.name
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          {/* SELLER INFORMATION */}

          <div className="seller-profile-info">

            <h1>{seller.name}</h1>

            {/* LOCATION */}

            {seller.location && (
              <p className="seller-profile-location">
                <MapPin size={16} />
                {seller.location}
              </p>
            )}

            {/* RATING */}

            <div className="seller-profile-rating">
              <Star
                size={16}
                fill="currentColor"
              />

              <strong>
                {seller.rating > 0
                  ? seller.rating.toFixed(1)
                  : "New"}
              </strong>

              <span>
                · {seller.totalRatings ?? 0} ratings
              </span>
            </div>

          </div>
        </div>

        {/* MESSAGE SELLER */}

        <button
          type="button"
          className="seller-message-button"
          onClick={handleMessageSeller}
          disabled={
            createConversation.isPending
          }
        >
          <MessageCircle size={18} />

          {createConversation.isPending
            ? "Opening chat..."
            : "Message seller"}
        </button>

      </section>


      {/* ------------------------------------------------------------------ */}
      {/* SELLER LISTINGS                                                    */}
      {/* ------------------------------------------------------------------ */}

      <section className="section seller-listings">

        <div className="section-header">

          <div>
            <span className="section-eyebrow">
              Marketplace
            </span>

            <h2>
              {seller.name}'s listings
            </h2>
          </div>

        </div>

        {/* PRODUCTS */}

        {sellerProducts.length > 0 ? (
          <ProductGrid
            products={sellerProducts}
          />
        ) : (
          <div className="empty-state">
            <h3>
              No active listings
            </h3>

            <p>
              This seller doesn't have any
              active listings right now.
            </p>
          </div>
        )}

      </section>

    </main>
  );
}