import { useEffect, useState } from "react";
import {
  Check,
  Sparkles,
  ArrowLeft,
  Loader2,
  WandSparkles,
} from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import ImageUploader from "../../components/common/ImageUploader";
import {
  uploadListingImage,
} from "../../services/listingUploadService";

import {
  createProduct,
  getProductById,
  updateProduct,
  type CreateProductData,
  type UpdateProductData,
} from "../../services/productService";

import { useAuthStore } from "../../store/useAuthStore";

import {
  analyzeListing,
  type ListingAIAnalysis,
} from "../../services/aiService";

import "./Sell.css";

interface ListingForm {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  location: string;
  brand: string;
  size: string;
  color: string;
}

const emptyForm: ListingForm = {
  title: "",
  description: "",
  price: "",
  category: "",
  condition: "",
  location: "",
  brand: "",
  size: "",
  color: "",
};

export default function Sell() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState<ListingForm>(emptyForm);

  // New images selected from the computer
  const [images, setImages] = useState<File[]>([]);

  // Existing Cloudinary image URLs
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // AI Listing Studio
  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [aiAnalysis, setAiAnalysis] =
    useState<ListingAIAnalysis | null>(null);

  const [aiImageUrl, setAiImageUrl] =
    useState<string | null>(null);

  const [aiAnalyzedFile, setAiAnalyzedFile] =
    useState<File | null>(null);

  const [loadingListing, setLoadingListing] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * ------------------------------------------------
   * LOAD EXISTING LISTING
   * ------------------------------------------------
   */

  useEffect(() => {
    if (!editId) {
      setLoadingListing(false);
      return;
    }

    async function loadListing(productId: string) {
      try {
        setLoadingListing(true);

        const product = await getProductById(productId);

        // Security check on frontend.
        // Backend updateProduct also enforces ownership.
        if (user?._id && product.seller?._id !== user._id) {
          toast.error("You can only edit your own listings.");
          navigate("/profile", { replace: true });
          return;
        }

        setForm({
          title: product.title,
          description: product.description,
          price: String(product.price),
          category: product.category,
          condition: product.condition,
          location: product.location,
          brand: product.brand || "",
          size: product.size || "",
          color: product.color || "",
        });

        setExistingImages(product.images || []);
      } catch (error) {
        console.error("Failed to load listing:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load listing"
        );

        navigate("/profile", { replace: true });
      } finally {
        setLoadingListing(false);
      }
    }

    loadListing(editId);
  }, [editId, navigate, user?._id]);

  /*
   * ------------------------------------------------
   * FORM CHANGE
   * ------------------------------------------------
   */

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function runAIAnalysis(file: File) {
    try {
      setIsAnalyzing(true);

      /*
      * Upload the image temporarily so the AI
      * endpoint can analyze its Cloudinary URL.
      */
      const uploadedImage = await uploadListingImage(file);

      setAiImageUrl(uploadedImage.url);
      setAiAnalyzedFile(file);

      const analysis = await analyzeListing(
        uploadedImage.url
      );

      setAiAnalysis(analysis);

      toast.success("AI analysis completed.");
    } catch (error) {
      console.error(
        "AI listing analysis failed:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to analyze product image."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAIAnalysis() {
    if (isEditMode) {
      toast.error(
        "AI analysis is available when creating a new listing."
      );
      return;
    }

    if (images.length === 0) {
      toast.error(
        "Please upload at least one product image first."
      );
      return;
    }

    await runAIAnalysis(images[0]);
  }

  function applyAIAnalysis() {
    if (!aiAnalysis) {
      return;
    }

    setForm((current) => ({
      ...current,

      title:
        aiAnalysis.title ||
        current.title,

      description:
        aiAnalysis.description ||
        current.description,

      category:
        aiAnalysis.category ||
        current.category,

      condition:
        aiAnalysis.condition ||
        current.condition,

      brand:
        aiAnalysis.brand ||
        current.brand,

      size:
        aiAnalysis.size ||
        current.size,

      color:
        aiAnalysis.color ||
        current.color,

      price:
        aiAnalysis.suggestedPrice
          ? String(aiAnalysis.suggestedPrice)
          : current.price,
    }));

    toast.success(
      "AI suggestions applied to your listing."
    );
  }
  /*
   * ------------------------------------------------
   * SUBMIT
   * ------------------------------------------------
   */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to continue.");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Please enter a product title.");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Please enter a description.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    /*
     * CREATE MODE
     *
     * New listing must have at least one image.
     */
    if (!isEditMode && images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    /*
     * EDIT MODE
     *
     * Existing images + newly selected images.
     */
    if (
      isEditMode &&
      existingImages.length === 0 &&
      images.length === 0
    ) {
      toast.error("Please keep at least one product image.");
      return;
    }

    try {
      setIsSubmitting(true);

      /*
       * --------------------------------------------
       * UPLOAD NEW IMAGES
       * --------------------------------------------
       */

      let uploadedImageUrls: string[] = [];

        if (images.length > 0) {
          const remainingFiles = images.filter(
            (file) => file !== aiAnalyzedFile
          );

          const uploadedImages =
            remainingFiles.length > 0
              ? await Promise.all(
                  remainingFiles.map((file) =>
                    uploadListingImage(file)
                  )
                )
              : [];

          uploadedImageUrls = uploadedImages.map(
            (image) => image.url
          );

          /*
          * Reuse the Cloudinary URL that was already
          * uploaded for AI analysis.
          */
          if (aiImageUrl) {
            uploadedImageUrls = [
              aiImageUrl,
              ...uploadedImageUrls,
            ];
          }
        }

      /*
       * --------------------------------------------
       * FINAL IMAGE LIST
       * --------------------------------------------
       *
       * Edit:
       * existing Cloudinary images
       * +
       * newly uploaded images
       *
       * Create:
       * newly uploaded images
       */

      const finalImages = isEditMode
        ? [...existingImages, ...uploadedImageUrls]
        : uploadedImageUrls;

      /*
       * --------------------------------------------
       * CREATE
       * --------------------------------------------
       */

      if (!isEditMode) {
        const productData: CreateProductData = {
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category: form.category,
          condition: form.condition,
          images: finalImages,
          location: form.location.trim(),
          brand: form.brand.trim() || undefined,
          size: form.size.trim() || undefined,
          color: form.color.trim() || undefined,
        };

        const product = await createProduct(productData);

        console.log("✅ Listing created:", product);

        toast.success("Listing published successfully!");

        navigate("/profile");

        return;
      }

      /*
       * --------------------------------------------
       * UPDATE
       * --------------------------------------------
       */

      if (!editId) {
        toast.error("Listing ID is missing.");
        return;
      }

      const productData: UpdateProductData = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        condition: form.condition,
        images: finalImages,
        location: form.location.trim(),
        brand: form.brand.trim() || undefined,
        size: form.size.trim() || undefined,
        color: form.color.trim() || undefined,
      };

      const updatedProduct = await updateProduct(
        editId,
        productData
      );

      console.log(
        "✅ Listing updated:",
        updatedProduct
      );

      toast.success("Listing updated successfully!");

      navigate("/profile");
    } catch (error) {
      console.error(
        isEditMode
          ? "❌ Failed to update listing:"
          : "❌ Failed to publish listing:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Failed to update listing"
            : "Failed to publish listing"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * ------------------------------------------------
   * LOADING EXISTING LISTING
   * ------------------------------------------------
   */

  if (loadingListing) {
    return (
      <main className="page">
        <section className="listing-studio">
          <div className="empty-state">
            <h2>Loading listing...</h2>
            <p>
              Please wait while we load your listing.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * ------------------------------------------------
   * PAGE
   * ------------------------------------------------
   */

  return (
    <main className="page">
      <section className="listing-studio">

        {/* HEADER */}

        <div className="studio-header">

          <span className="section-eyebrow">
            Seller tools
          </span>

          <h1>
            {isEditMode
              ? "Edit your listing"
              : "Create a listing"}

            <Sparkles size={30} />
          </h1>

          <p>
            {isEditMode
              ? "Update your listing details and keep your marketplace post fresh."
              : "Let AI handle the repetitive work. You stay in control."}
          </p>

        </div>

        {/* PROGRESS */}

        <div className="studio-progress">

          <div className="progress-step active">
            <span>1</span>
            Photos
          </div>

          <div className="progress-line" />

          <div className="progress-step">
            <span>2</span>
            AI analysis
          </div>

          <div className="progress-line" />

          <div className="progress-step">
            <span>3</span>
            Review
          </div>

          <div className="progress-line" />

          <div className="progress-step">
            <span>4</span>
            {isEditMode ? "Update" : "Publish"}
          </div>

        </div>

        {/* BACK */}

        {isEditMode && (
          <button
            type="button"
            className="button"
            onClick={() => navigate("/profile")}
            style={{
              marginBottom: "20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ArrowLeft size={17} />
            Back to My Listings
          </button>
        )}

        <form onSubmit={handleSubmit}>

          {/* PHOTOS */}

          <div className="studio-upload">

            {isEditMode &&
              existingImages.length > 0 && (
                <div
                  style={{
                    marginBottom: "20px",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "12px",
                    }}
                  >
                    Current photos
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {existingImages.map(
                      (image, index) => (
                        <div
                          key={`${image}-${index}`}
                          style={{
                            position: "relative",
                            aspectRatio: "1",
                            borderRadius: "12px",
                            overflow: "hidden",
                            border:
                              "1px solid #e5e7eb",
                          }}
                        >
                          <img
                            src={image}
                            alt={`Current product ${
                              index + 1
                            }`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setExistingImages(
                                (current) =>
                                  current.filter(
                                    (_, i) =>
                                      i !== index
                                  )
                              );
                            }}
                            aria-label={`Remove current image ${
                              index + 1
                            }`}
                            style={{
                              position:
                                "absolute",
                              top: "6px",
                              right: "6px",
                              width: "28px",
                              height: "28px",
                              border: "none",
                              borderRadius: "50%",
                              cursor: "pointer",
                              background:
                                "rgba(0,0,0,0.7)",
                              color: "white",
                              fontSize: "18px",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            <ImageUploader
              multiple
              onImagesChange={(files) => {
                setImages(files);

                /*
                * If the image used for AI analysis was removed,
                * clear the previous AI result.
                */
                if (
                  aiAnalyzedFile &&
                  !files.includes(aiAnalyzedFile)
                ) {
                  setAiAnalyzedFile(null);
                  setAiImageUrl(null);
                  setAiAnalysis(null);
                }

                /*
                * Automatically analyze the first uploaded image.
                */
                if (
                  !isEditMode &&
                  files.length > 0 &&
                  !isAnalyzing &&
                  !aiAnalysis
                ) {
                  void runAIAnalysis(files[0]);
                }
              }}
            />

            {!isEditMode && (
              <div
                style={{
                  marginTop: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleAIAnalysis}
                  disabled={
                    images.length === 0 ||
                    isAnalyzing ||
                    isSubmitting
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2
                        size={17}
                        className="ai-spin"
                      />
                      Analyzing product...
                    </>
                  ) : (
                    <>
                      <WandSparkles size={17} />
                      Analyze with AI
                    </>
                  )}
                </button>

                {images.length === 0 && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      opacity: 0.65,
                    }}
                  >
                    Upload a product photo to enable AI analysis.
                  </p>
                )}
              </div>
            )}

            {isEditMode && images.length > 0 && (
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "14px",
                  opacity: 0.7,
                }}
              >
                New photos will be added to the
                existing photos.
              </p>
            )}

          </div>

          {/* LISTING DETAILS */}

          <div className="listing-form">

            <div className="form-group">

              <label htmlFor="title">
                Product title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Nike Air Max Running Shoes"
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Describe your item..."
                value={form.description}
                onChange={handleChange}
                rows={5}
                maxLength={2000}
                required
              />

            </div>

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="price">
                  Price (₹)
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="1"
                  placeholder="2800"
                  value={form.price}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  <option value="Fashion">
                    Fashion
                  </option>

                  <option value="Electronics">
                    Electronics
                  </option>

                  <option value="Books">
                    Books
                  </option>

                  <option value="Home">
                    Home
                  </option>

                  <option value="Beauty">
                    Beauty
                  </option>

                  <option value="Sports">
                    Sports
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

            </div>

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="condition">
                  Condition
                </label>

                <select
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select condition
                  </option>

                  <option value="New">
                    New
                  </option>

                  <option value="Like New">
                    Like New
                  </option>

                  <option value="Good">
                    Good
                  </option>

                  <option value="Fair">
                    Fair
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label htmlFor="location">
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Mumbai"
                  value={form.location}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />

              </div>

            </div>

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="brand">
                  Brand
                </label>

                <input
                  id="brand"
                  name="brand"
                  type="text"
                  placeholder="Nike"
                  value={form.brand}
                  onChange={handleChange}
                  maxLength={50}
                />

              </div>

              <div className="form-group">

                <label htmlFor="size">
                  Size
                </label>

                <input
                  id="size"
                  name="size"
                  type="text"
                  placeholder="UK 8"
                  value={form.size}
                  onChange={handleChange}
                  maxLength={30}
                />

              </div>

              <div className="form-group">

                <label htmlFor="color">
                  Color
                </label>

                <input
                  id="color"
                  name="color"
                  type="text"
                  placeholder="Black"
                  value={form.color}
                  onChange={handleChange}
                  maxLength={30}
                />

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating listing..."
                  : "Publishing listing..."
                : isEditMode
                  ? "Update listing"
                  : "Publish listing"}
            </button>

          </div>

        </form>

        {/* AI ANALYSIS */}

        {!isEditMode && aiAnalysis && (
          <div className="ai-preview">
            <div className="ai-preview-header">
              <div>
                <Sparkles size={18} />

                <strong>
                  AI Listing Analysis
                </strong>
              </div>

              <span>
                Ready to review
              </span>
            </div>

            <div className="ai-fields">

              <div className="ai-field">
                <label>
                  Suggested title
                </label>

                <div>
                  {aiAnalysis.title || "No suggestion"}
                </div>
              </div>

              <div className="ai-field">
                <label>
                  Description
                </label>

                <div>
                  {aiAnalysis.description ||
                    "No suggestion"}
                </div>
              </div>

              <div className="ai-field">
                <label>
                  Category
                </label>

                <div>
                  {aiAnalysis.category ||
                    "No suggestion"}
                </div>
              </div>

              <div className="ai-field">
                <label>
                  Condition
                </label>

                <div>
                  {aiAnalysis.condition ||
                    "No suggestion"}
                </div>
              </div>

              <div className="ai-field">
                <label>
                  Brand
                </label>

                <div>
                  {aiAnalysis.brand ||
                    "No suggestion"}
                </div>
              </div>

              <div className="ai-field">
                <label>
                  Color
                </label>

                <div>
                  {aiAnalysis.color ||
                    "No suggestion"}
                </div>
              </div>

              <div className="ai-field">
                <label>
                  Size
                </label>

                <div>
                  {aiAnalysis.size ||
                    "No suggestion"}
                </div>
              </div>

              <div className="ai-field">
                <label>
                  Suggested price
                </label>

                <div>
                  {aiAnalysis.suggestedPrice
                    ? `₹${aiAnalysis.suggestedPrice.toLocaleString(
                        "en-IN"
                      )}`
                    : "No suggestion"}
                </div>
              </div>

            </div>

            <button
              type="button"
              className="button button-primary"
              onClick={applyAIAnalysis}
              style={{
                marginTop: "18px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Check size={17} />
              Apply AI suggestions
            </button>

            <div className="ai-features">

              <span>
                <Check size={15} />
                Product detection
              </span>

              <span>
                <Check size={15} />
                Description generation
              </span>

              <span>
                <Check size={15} />
                Attribute detection
              </span>

              <span>
                <Check size={15} />
                Price recommendation
              </span>

            </div>
          </div>
        )}

      </section>
    </main>
  );
}