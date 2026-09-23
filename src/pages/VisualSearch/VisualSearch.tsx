import { useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";

import ImageUploader from "../../components/common/ImageUploader";
import ProductGrid from "../../components/product/ProductGrid";

import { uploadListingImage } from "../../services/uploadService";
import {
  performVisualSearch,
  type VisualSearchAnalysis,
  type VisualSearchSimilarity,
} from "../../services/visualSearchService";

import type { Product } from "../../types/product";

export default function VisualSearch() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [isSearching, setIsSearching] = useState(false);

  const [analysis, setAnalysis] =
    useState<VisualSearchAnalysis | null>(null);

  const [results, setResults] = useState<Product[]>([]);
  
  const [similarityScores, setSimilarityScores] = useState<
    VisualSearchSimilarity[]
  >([]);

  const handleImagesChange = (files: File[]) => {
    const file = files[0];

    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      setAnalysis(null);
      setResults([]);
      setSimilarityScores([]);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));

    setAnalysis(null);
    setResults([]);
    setSimilarityScores([]);
  };

  const handleVisualSearch = async () => {
    if (!selectedFile) {
      toast.error("Please upload a product image first");
      return;
    }

    try {
      setIsSearching(true);
      setAnalysis(null);
      setResults([]);
      setSimilarityScores([]);

      // Upload image to Cloudinary
      const imageUrl = await uploadListingImage(selectedFile);

      // Send image to AI visual search
      const response = await performVisualSearch(imageUrl);

      setAnalysis(response.analysis);
      setResults(response.products);
      setSimilarityScores(response.similarityScores);

      if (response.products.length > 0) {
        toast.success(
          `Found ${response.products.length} similar products`
        );
      } else {
        toast.success(
          "AI analyzed the image, but no matching products were found"
        );
      }
    } catch (error) {
      console.error("Visual search error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Visual search failed"
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="page">
      <section className="visual-search-page">

        {/* ================= HEADER ================= */}

        <div className="visual-header">
          <span className="section-eyebrow">
            AI-powered discovery
          </span>

          <h1>
            Search with an image
          </h1>

          <p>
            See something you like?
            Upload a photo and we'll find
            similar products.
          </p>
        </div>

        {/* ================= UPLOAD ================= */}

        <div className="visual-upload">

          <ImageUploader
            multiple={false}
            onImagesChange={handleImagesChange}
          />

          {preview && (
            <div className="visual-search-preview">
              <img
                src={preview}
                alt="Selected product"
              />
            </div>
          )}

          <button
            type="button"
            className="visual-search-button"
            onClick={handleVisualSearch}
            disabled={!selectedFile || isSearching}
          >
            {isSearching ? (
              <>
                <Loader2
                  size={18}
                  className="ai-spin"
                />
                Analyzing image...
              </>
            ) : (
              <>
                <Search size={18} />
                Find Similar Products
              </>
            )}
          </button>

        </div>

        {/* ================= AI ANALYSIS ================= */}

        {analysis && (
          <section className="visual-analysis">

            <div className="visual-analysis-header">

              <Sparkles size={20} />

              <div>
                <span className="section-eyebrow">
                  AI Analysis
                </span>

                <h2>
                  We found these characteristics
                </h2>
              </div>

            </div>

            <div className="visual-analysis-grid">

              <div className="visual-analysis-item">
                <span>Product</span>

                <strong>
                  {analysis.productType || "Not detected"}
                </strong>
              </div>

              <div className="visual-analysis-item">
                <span>Category</span>

                <strong>
                  {analysis.category || "Not detected"}
                </strong>
              </div>

              <div className="visual-analysis-item">
                <span>Brand</span>

                <strong>
                  {analysis.brand || "Not detected"}
                </strong>
              </div>

              <div className="visual-analysis-item">
                <span>Color</span>

                <strong>
                  {analysis.color || "Not detected"}
                </strong>
              </div>

            </div>

            {analysis.keywords.length > 0 && (
              <div className="visual-keywords">

                <span>
                  Search keywords
                </span>

                <div className="visual-keyword-list">

                  {analysis.keywords.map(
                    (keyword: string) => (
                      <span
                        key={keyword}
                        className="visual-keyword"
                      >
                        {keyword}
                      </span>
                    )
                  )}

                </div>

              </div>
            )}

          </section>
        )}

        {/* ================= HOW IT WORKS ================= */}

        <div className="visual-how">

          <h2>
            How visual search works
          </h2>

          <div className="visual-steps">

            <div>
              <ImageIcon />

              <strong>
                Upload
              </strong>

              <p>
                Choose a product image.
              </p>
            </div>

            <div>
              <Sparkles />

              <strong>
                AI analyzes
              </strong>

              <p>
                We identify visual characteristics.
              </p>
            </div>

            <div>
              <Camera />

              <strong>
                Find matches
              </strong>

              <p>
                Discover visually similar products.
              </p>
            </div>

          </div>

        </div>

        {/* ================= RESULTS ================= */}

        {analysis && (
          <section className="section visual-results">

            <div className="section-header">

              <div>

                <span className="section-eyebrow">
                  AI-powered results
                </span>

                <h2>
                  Similar products
                </h2>

              </div>

              {results.length > 0 && (
                <span>
                  {results.length} matches
                </span>
              )}

            </div>

            {results.length > 0 ? (
              <ProductGrid
                products={results}
                similarityScores={similarityScores}
              />
            ) : (
              <div className="visual-no-results">

                <Search size={32} />

                <h3>
                  No matching products found
                </h3>

                <p>
                  We analyzed your image, but couldn't
                  find similar active listings yet.
                  Try another product image.
                </p>

              </div>
            )}

          </section>
        )}

      </section>
    </main>
  );
}