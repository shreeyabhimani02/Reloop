import { Response } from "express";
import { pipeline } from "@huggingface/transformers";

import { AuthRequest } from "../middleware/auth.middleware.js";
import Product from "../models/Product.js";

interface VisualSearchAnalysis {
  productType: string;
  category: string;
  brand: string;
  color: string;
  keywords: string[];
}

interface ImageFeatureExtractor {
  (
    input: Blob,
    options?: {
      pooling?: "mean" | "max";
      normalize?: boolean;
    }
  ): Promise<{
    data: Float32Array;
    dims: number[];
  }>;
}

let extractor: ImageFeatureExtractor | null = null;

async function getExtractor(): Promise<ImageFeatureExtractor> {
  if (!extractor) {
    console.log("Loading local CLIP model...");

    extractor =
      (await pipeline(
        "image-feature-extraction",
        "Xenova/clip-vit-base-patch32"
      )) as unknown as ImageFeatureExtractor;

    console.log("✅ CLIP model loaded");
  }

  return extractor;
}

function cosineSimilarity(
  a: Float32Array,
  b: Float32Array
): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  );
}

function buildKeywords(product: {
  title?: string;
  brand?: string;
  category?: string;
  color?: string;
}): string[] {
  const words = [
    ...(product.title || "").split(/\s+/),
    product.brand || "",
    product.category || "",
    product.color || "",
  ];

  return [
    ...new Set(
      words
        .map((word) =>
          word
            .replace(/[^a-zA-Z0-9'-]/g, "")
            .trim()
            .toLowerCase()
        )
        .filter((word) => word.length >= 3)
    ),
  ].slice(0, 8);
}

/**
 * Download an image URL and convert it to a data URL.
 * Transformers.js accepts this string format.
 */
async function imageUrlToBlob(
  imageUrl: string
): Promise<Blob> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download image: ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") ||
    "image/jpeg";

  const arrayBuffer =
    await response.arrayBuffer();

  return new Blob(
    [arrayBuffer],
    {
      type: contentType,
    }
  );
}

export async function visualSearch(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { imageUrl } = req.body;

    if (
      !imageUrl ||
      typeof imageUrl !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    // --------------------------------------------------
    // 2. Convert uploaded Cloudinary image
    //    into a Transformers.js-compatible data URL
    // --------------------------------------------------

    console.log(
      "Downloading uploaded image..."
    );

    const uploadedImage =
        await imageUrlToBlob(imageUrl);

    // --------------------------------------------------
    // 3. Load local CLIP model
    // --------------------------------------------------

    const model = await getExtractor();

    // --------------------------------------------------
    // 4. Generate uploaded image embedding
    // --------------------------------------------------

    console.log(
      "Generating image embedding..."
    );

    const uploadedEmbedding =
      await model(uploadedImage, {
        pooling: "mean",
        normalize: true,
      });

    // --------------------------------------------------
    // 5. Get active products
    // --------------------------------------------------

    const products =
      await Product.find({
        isSold: false,
      })
        .populate(
          "seller",
          "name avatar bio location rating totalRatings itemsSold responseRate"
        )
        .sort({
          createdAt: -1,
        })
        .limit(100)
        .lean();

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        analysis: {
          productType: "Product",
          category: "",
          brand: "",
          color: "",
          keywords: [],
        },
        products: [],
        searchQuery:
          "Visual similarity search",
      });
    }

    // --------------------------------------------------
    // 6. Compare against product images
    // --------------------------------------------------

    const scoredProducts: Array<{
      product: (typeof products)[number];
      score: number;
    }> = [];

    for (const product of products) {
      if (
        !product.images ||
        product.images.length === 0
      ) {
        continue;
      }

      try {
        console.log(
          `Processing: ${product.title}`
        );

        const productImage =
          await imageUrlToBlob(
            product.images[0]
          );

        const productEmbedding =
          await model(productImage, {
            pooling: "mean",
            normalize: true,
          });

        const score =
          cosineSimilarity(
            uploadedEmbedding.data,
            productEmbedding.data
          );

        scoredProducts.push({
          product,
          score,
        });

        console.log(
          `${product.title}: ${score.toFixed(4)}`
        );
      } catch (error) {
        console.warn(
          `Could not process product ${product._id}:`,
          error
        );
      }
    }

    // --------------------------------------------------
    // 7. Sort by visual similarity
    // --------------------------------------------------

    scoredProducts.sort(
      (a, b) => b.score - a.score
    );

    // --------------------------------------------------
    // 8. Get top matches
    // --------------------------------------------------

    const matchingProducts =
      scoredProducts
        .filter(
          (item) => item.score >= 0.45
        )
        .slice(0, 20);

    // --------------------------------------------------
    // 9. Build analysis from best match
    // --------------------------------------------------

    const topProduct =
      matchingProducts[0]?.product;

    const analysis: VisualSearchAnalysis = {
      productType:
        topProduct?.title ||
        "Product",

      category:
        topProduct?.category ||
        "",

      brand:
        topProduct?.brand ||
        "",

      color:
        topProduct?.color ||
        "",

      keywords:
        topProduct
          ? buildKeywords(topProduct)
          : [],
    };

    // --------------------------------------------------
    // 10. Return results
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      analysis,
      products: matchingProducts.map(
        ({ product }) => product
      ),
      searchQuery:
        "Visual similarity search",
      similarityScores:
        matchingProducts.map(
          ({ product, score }) => ({
            productId: product._id,
            score: Number(
                (score * 100).toFixed(1)
            ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "Visual search error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Visual search failed",
    });
  }
}