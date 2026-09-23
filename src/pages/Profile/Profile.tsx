import { useEffect, useState } from "react";
import {
  MapPin,
  Package,
  Pencil,
  User as UserIcon,
  Camera,
  X,
  Edit3,
  Trash2,
  CheckCircle,
  Plus,
  Eye,
  Heart,
  IndianRupee,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";

import "./Profile.css";

import { useAuthStore } from "../../store/useAuthStore";

import { uploadAvatar } from "../../services/uploadService";

import {
  getMyProfile,
  updateMyProfile,
  type ProfileUser,
} from "../../services/userService";

import {
  getSellerProducts,
  updateProduct,
  deleteProduct,
} from "../../services/productService";

import type { Product } from "../../types/product";

import { useNavigate } from "react-router-dom";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function Profile() {
  const [user, setUser] =
    useState<ProfileUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [avatarPreview, setAvatarPreview] =
    useState("");

  const [selectedAvatar, setSelectedAvatar] =
    useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    location: "",
    avatar: "",
    avatarPublicId: "",
  });

  const navigate = useNavigate();

    // -----------------------------
  // My Listings
  // -----------------------------

  const [myListings, setMyListings] = useState<Product[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingActionId, setListingActionId] = useState<string | null>(
    null
  );

  const totalListings = myListings.length;

  const activeListings = myListings.filter(
    (product) => !product.isSold
  ).length;

  const soldListings = myListings.filter(
    (product) => product.isSold
  ).length;

  const totalViews = myListings.reduce(
    (total, product) => total + (product.views || 0),
    0
  );

  const totalLikes = myListings.reduce(
    (total, product) => total + (product.likes || 0),
    0
  );

  const totalSalesValue = myListings
    .filter((product) => product.isSold)
    .reduce(
      (total, product) => total + (product.price || 0),
      0
    );

  const updateAuthUser = useAuthStore(
    (state) => state.setUser
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);

        const profile =
          await getMyProfile();

        setUser(profile);

        setForm({
          name: profile.name || "",
          bio: profile.bio || "",
          location: profile.location || "",
          avatar: profile.avatar || "",
          avatarPublicId:
            profile.avatarPublicId || "",
        });

        setAvatarPreview(
          profile.avatar || ""
        );
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

    useEffect(() => {
  const userId = user?._id;

  async function loadMyListings() {
    if (!userId) {
      setListingsLoading(false);
      return;
    }

    try {
      setListingsLoading(true);

      const listings = await getSellerProducts(userId);

      setMyListings(listings);
    } catch (error) {
      console.error("Failed to load listings:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load your listings"
      );
    } finally {
      setListingsLoading(false);
    }
  }

  loadMyListings();
}, [user?._id]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleAvatarChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (
      !ALLOWED_AVATAR_TYPES.includes(
        file.type
      )
    ) {
      toast.error(
        "Please choose a JPG, PNG, or WEBP image."
      );

      e.target.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(
        "Avatar image must be smaller than 5 MB."
      );

      e.target.value = "";
      return;
    }

    // Clean up previous blob preview
    if (
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedAvatar(file);
    setAvatarPreview(previewUrl);

    // The file will be uploaded to Cloudinary
    // when the user clicks Save Changes.
  }

  function handleRemoveAvatar() {
    if (
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(avatarPreview);
    }

    setSelectedAvatar(null);

    setAvatarPreview("");

    setForm((previous) => ({
      ...previous,
      avatar: "",
      avatarPublicId: "",
    }));
  }

  function handleCancel() {
    if (
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(avatarPreview);
    }

    setEditing(false);

    setSelectedAvatar(null);

    setAvatarPreview(
      user?.avatar || ""
    );

    setForm({
      name: user?.name || "",
      bio: user?.bio || "",
      location: user?.location || "",
      avatar: user?.avatar || "",
      avatarPublicId:
        user?.avatarPublicId || "",
    });
  }

  async function handleSave(
    e: React.FormEvent
  ) {
    e.preventDefault();

    // -----------------------------
    // Validation
    // -----------------------------

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (form.name.trim().length < 2) {
      toast.error(
        "Name must be at least 2 characters"
      );
      return;
    }

    if (form.name.trim().length > 50) {
      toast.error(
        "Name cannot exceed 50 characters"
      );
      return;
    }

    if (form.bio.length > 300) {
      toast.error(
        "Bio cannot exceed 300 characters"
      );
      return;
    }

    try {
      setSaving(true);

      let avatarUrl = form.avatar;
      let avatarPublicId =
        form.avatarPublicId;

      // -----------------------------
      // Upload new avatar to Cloudinary
      // -----------------------------

      if (selectedAvatar) {
        toast.loading(
          "Uploading profile photo...",
          {
            id: "avatar-upload",
          }
        );

        const uploaded =
          await uploadAvatar(
            selectedAvatar
          );

        avatarUrl = uploaded.url;

        avatarPublicId =
          uploaded.publicId;

        toast.success(
          "Photo uploaded successfully",
          {
            id: "avatar-upload",
          }
        );
      }

      // -----------------------------
      // Save profile in MongoDB
      // -----------------------------

      const updatedUser =
        await updateMyProfile({
          name: form.name.trim(),
          bio: form.bio.trim(),
          location:
            form.location.trim(),
          avatar: avatarUrl,
          avatarPublicId,
        });

      // -----------------------------
      // Update local profile state
      // -----------------------------

      setUser(updatedUser);

      // Update Zustand authentication state
      updateAuthUser(updatedUser);

      // Update form state
      setForm({
        name: updatedUser.name || "",
        bio: updatedUser.bio || "",
        location:
          updatedUser.location || "",
        avatar:
          updatedUser.avatar || "",
        avatarPublicId:
          updatedUser.avatarPublicId || "",
      });

      // Clean up temporary blob preview
      if (
        avatarPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }

      setSelectedAvatar(null);

      // Show final Cloudinary URL
      setAvatarPreview(
        updatedUser.avatar || ""
      );

      setEditing(false);

      toast.success(
        "Profile updated successfully"
      );
    } catch (error) {
      console.error(
        "Failed to update profile:",
        error
      );

      toast.dismiss("avatar-upload");

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

    // -----------------------------
  // Listing Actions
  // -----------------------------

  async function handleMarkSold(product: Product) {
    const confirmed = window.confirm(
      `Mark "${product.title}" as sold?`
    );

    if (!confirmed) return;

    try {
      setListingActionId(product._id);

      const updatedProduct = await updateProduct(
        product._id,
        {
          isSold: !product.isSold,
        }
      );

      setMyListings((current) =>
        current.map((item) =>
          item._id === updatedProduct._id
            ? updatedProduct
            : item
        )
      );

      toast.success(
        updatedProduct.isSold
          ? "Listing marked as sold"
          : "Listing marked as available"
      );
    } catch (error) {
      console.error(
        "Failed to update listing:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update listing"
      );
    } finally {
      setListingActionId(null);
    }
  }

  async function handleDeleteListing(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.title}" permanently?`
    );

    if (!confirmed) return;

    try {
      setListingActionId(product._id);

      await deleteProduct(product._id);

      setMyListings((current) =>
        current.filter(
          (item) => item._id !== product._id
        )
      );

      toast.success("Listing deleted successfully");
    } catch (error) {
      console.error(
        "Failed to delete listing:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete listing"
      );
    } finally {
      setListingActionId(null);
    }
  }

  // -----------------------------
  // Loading state
  // -----------------------------

  if (loading) {
    return (
      <main className="page">
        <div className="empty-state">
          <p>
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  // -----------------------------
  // Error state
  // -----------------------------

  if (!user) {
    return (
      <main className="page">
        <div className="empty-state">
          <UserIcon size={40} />

          <h2>
            Unable to load profile
          </h2>

          <p>
            Please try refreshing the page.
          </p>
        </div>
      </main>
    );
  }

  // -----------------------------
  // Profile UI
  // -----------------------------

  return (
    <main className="page profile-page">
      <div className="profile-header">
        <div>
          <p className="profile-eyebrow">
            Account
          </p>

          <h1>My Profile</h1>

          <p className="profile-subtitle">
            Manage your ReLoop profile
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            className="profile-edit-button"
            onClick={() =>
              setEditing(true)
            }
          >
            <Pencil size={17} />
            Edit Profile
          </button>
        )}
      </div>

      {/* -----------------------------
          PROFILE CARD
      ------------------------------ */}

      <section className="profile-card">
        <div className="profile-main">
          <div className="profile-avatar">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.name}'s avatar`}
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <span>
                {user.name
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="profile-identity">
            <h2>{user.name}</h2>

            <p className="profile-email">
              {user.email}
            </p>

            {user.location && (
              <p className="profile-location">
                <MapPin size={15} />
                {user.location}
              </p>
            )}
          </div>
        </div>

        {user.bio && (
          <div className="profile-bio">
            <h3>About</h3>
            <p>{user.bio}</p>
          </div>
        )}
      </section>

    

      <section className="seller-dashboard">
        <div className="seller-dashboard-header">
          <div>
            <span className="section-eyebrow">
              Seller dashboard
            </span>

            <h2>
              Your selling activity
              <BarChart3 size={24} />
            </h2>

            <p>
              Track your listings, engagement, and sales performance.
            </p>
          </div>

          <button
            type="button"
            className="button button-primary"
            onClick={() => navigate("/sell")}
          >
            <Plus size={17} />
            Create Listing
          </button>
        </div>

        <div className="seller-stats-grid">
          <div className="seller-stat-card">
            <div className="seller-stat-icon">
              <Package size={20} />
            </div>

            <div>
              <span>Total Listings</span>
              <strong>{totalListings}</strong>
            </div>
          </div>

          <div className="seller-stat-card">
            <div className="seller-stat-icon">
              <CheckCircle size={20} />
            </div>

            <div>
              <span>Active Listings</span>
              <strong>{activeListings}</strong>
            </div>
          </div>

          <div className="seller-stat-card">
            <div className="seller-stat-icon">
              <CheckCircle size={20} />
            </div>

            <div>
              <span>Sold Listings</span>
              <strong>{soldListings}</strong>
            </div>
          </div>

          <div className="seller-stat-card">
            <div className="seller-stat-icon">
              <Eye size={20} />
            </div>

            <div>
              <span>Total Views</span>
              <strong>{totalViews}</strong>
            </div>
          </div>

          <div className="seller-stat-card">
            <div className="seller-stat-icon">
              <Heart size={20} />
            </div>

            <div>
              <span>Total Likes</span>
              <strong>{totalLikes}</strong>
            </div>
          </div>

          <div className="seller-stat-card">
            <div className="seller-stat-icon">
              <IndianRupee size={20} />
            </div>

            <div>
              <span>Sales Value</span>
              <strong>
                ₹{totalSalesValue.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="listing-performance">
        <div className="listing-performance-header">
          <div>
            <span className="section-eyebrow">
              Performance
            </span>

            <h2>Listing performance</h2>

            <p>
              See how people are interacting with your listings.
            </p>
          </div>
        </div>

        {listingsLoading ? (
          <div className="listing-performance-loading">
            <p>Loading listing performance...</p>
          </div>
        ) : myListings.length === 0 ? (
          <div className="listing-performance-empty">
            <BarChart3 size={28} />

            <h3>No listing data yet</h3>

            <p>
              Create your first listing to start tracking
              performance.
            </p>

            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate("/sell")}
            >
              <Plus size={17} />
              Create Listing
            </button>
          </div>
        ) : (
          <div className="listing-performance-list">
            {myListings.map((product) => {
              const engagement =
                product.views > 0
                  ? ((product.likes / product.views) * 100).toFixed(1)
                  : "0.0";

              return (
                <div
                  className="performance-card"
                  key={product._id}
                >
                  <div className="performance-product">
                    <img
                      src={product.images?.[0]}
                      alt={product.title}
                    />

                    <div className="performance-product-info">
                      <h3>{product.title}</h3>

                      <span>
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>

                      <div
                        className={`performance-status ${
                          product.isSold
                            ? "sold"
                            : "active"
                        }`}
                      >
                        {product.isSold
                          ? "Sold"
                          : "Active"}
                      </div>
                    </div>
                  </div>

                  <div className="performance-metrics">
                    <div className="performance-metric">
                      <Eye size={17} />

                      <div>
                        <span>Views</span>
                        <strong>
                          {product.views || 0}
                        </strong>
                      </div>
                    </div>

                    <div className="performance-metric">
                      <Heart size={17} />

                      <div>
                        <span>Likes</span>
                        <strong>
                          {product.likes || 0}
                        </strong>
                      </div>
                    </div>

                    <div className="performance-metric">
                      <BarChart3 size={17} />

                      <div>
                        <span>Engagement</span>
                        <strong>
                          {engagement}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="performance-actions">
                    <button
                      type="button"
                      className="button"
                      onClick={() =>
                        navigate(
                          `/product/${product._id}`
                        )
                      }
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="button"
                      onClick={() =>
                        navigate(
                          `/sell?edit=${product._id}`
                        )
                      }
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

            {/* -----------------------------
          MY LISTINGS
      ------------------------------ */}

      <section className="my-listings">
        <div className="my-listings-header">
          <div>
            <p className="my-listings-eyebrow">
              Marketplace
            </p>

            <h2>My Listings</h2>

            <p>
              Manage the items you are selling on ReLoop.
            </p>
          </div>

          <button
            type="button"
            className="my-listings-sell-button"
            onClick={() => {
              window.location.href = "/sell";
            }}
          >
            <Plus size={17} />
            Sell an Item
          </button>
        </div>

        {listingsLoading ? (
          <div className="listings-state">
            <div className="listing-loading-grid">
              <div className="listing-skeleton" />
              <div className="listing-skeleton" />
              <div className="listing-skeleton" />
            </div>
          </div>
        ) : myListings.length === 0 ? (
          <div className="listings-empty">
            <div className="listings-empty-icon">
              <Package size={28} />
            </div>

            <h3>No listings yet</h3>

            <p>
              You haven't listed anything for sale yet.
            </p>

            <button
              type="button"
              className="my-listings-empty-button"
              onClick={() => {
                window.location.href = "/sell";
              }}
            >
              <Plus size={16} />
              Create Your First Listing
            </button>
          </div>
        ) : (
          <div className="my-listings-grid">
            {myListings.map((product) => {
              const isActionLoading =
                listingActionId === product._id;

              return (
                <article
                  key={product._id}
                  className={`my-listing-card ${
                    product.isSold
                      ? "my-listing-sold"
                      : ""
                  }`}
                >
                  <div className="my-listing-image">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                      />
                    ) : (
                      <div className="my-listing-no-image">
                        <Package size={30} />
                      </div>
                    )}

                    {product.isSold && (
                      <span className="listing-sold-badge">
                        Sold
                      </span>
                    )}
                  </div>

                  <div className="my-listing-content">
                    <div className="my-listing-top">
                      <div>
                        <span className="my-listing-category">
                          {product.category}
                        </span>

                        <h3>{product.title}</h3>
                      </div>

                      <strong className="my-listing-price">
                        ₹{product.price.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="my-listing-meta">
                      <span>
                        {product.condition}
                      </span>

                      <span>
                        {product.location}
                      </span>
                    </div>

                    <div className="my-listing-actions">
                      <button
                        type="button"
                        className="listing-edit-button"
                        onClick={() => {
                          window.location.href =
                            `/sell?edit=${product._id}`;
                        }}
                        disabled={isActionLoading}
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className={`listing-sold-button ${
                          product.isSold
                            ? "available"
                            : ""
                        }`}
                        onClick={() =>
                          handleMarkSold(product)
                        }
                        disabled={isActionLoading}
                      >
                        <CheckCircle size={15} />

                        {isActionLoading
                          ? "Updating..."
                          : product.isSold
                          ? "Mark Available"
                          : "Mark Sold"}
                      </button>

                      <button
                        type="button"
                        className="listing-delete-button"
                        onClick={() =>
                          handleDeleteListing(product)
                        }
                        disabled={isActionLoading}
                        aria-label={`Delete ${product.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* -----------------------------
          EDIT PROFILE
      ------------------------------ */}

      {editing && (
        <section className="profile-edit-card">
          <div className="profile-edit-header">
            <div>
              <h2>Edit Profile</h2>

              <p>
                Update your public profile
                information.
              </p>
            </div>
          </div>

          <form
            className="profile-form"
            onSubmit={handleSave}
          >
            {/* NAME */}

            <div className="profile-form-group">
              <label htmlFor="name">
                Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                maxLength={50}
                required
              />
            </div>

            {/* EMAIL */}

            <div className="profile-form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={user.email}
                disabled
              />

              <small>
                Email cannot be changed here.
              </small>
            </div>

            {/* LOCATION */}

            <div className="profile-form-group">
              <label htmlFor="location">
                Location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Mumbai"
                value={form.location}
                onChange={handleChange}
                maxLength={100}
              />
            </div>

            {/* -----------------------------
                CLOUDINARY AVATAR UPLOADER
            ------------------------------ */}

            <div className="profile-form-group">
              <label>
                Profile Photo
              </label>

              <div className="avatar-upload">
                <div className="avatar-upload-preview">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                    />
                  ) : (
                    <span>
                      {form.name
                        .charAt(0)
                        .toUpperCase() || (
                        <UserIcon size={30} />
                      )}
                    </span>
                  )}
                </div>

                <div className="avatar-upload-content">
                  <div className="avatar-upload-actions">
                    <label
                      htmlFor="avatar-file"
                      className="avatar-upload-button"
                    >
                      <Camera size={16} />
                      Choose Photo
                    </label>

                    {avatarPreview && (
                      <button
                        type="button"
                        className="avatar-remove-button"
                        onClick={
                          handleRemoveAvatar
                        }
                        disabled={saving}
                      >
                        <X size={16} />
                        Remove
                      </button>
                    )}
                  </div>

                  <p className="avatar-upload-hint">
                    JPG, PNG or WEBP • Maximum
                    5 MB
                  </p>

                  {selectedAvatar && (
                    <p className="avatar-selected-file">
                      Selected:{" "}
                      {selectedAvatar.name}
                    </p>
                  )}
                </div>

                <input
                  id="avatar-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleAvatarChange
                  }
                  hidden
                />
              </div>
            </div>

            {/* BIO */}

            <div className="profile-form-group">
              <label htmlFor="bio">
                Bio
              </label>

              <textarea
                id="bio"
                name="bio"
                placeholder="Tell buyers a little about yourself..."
                value={form.bio}
                onChange={handleChange}
                maxLength={300}
                rows={5}
              />

              <small>
                {form.bio.length}/300
              </small>
            </div>

            {/* ACTIONS */}

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}