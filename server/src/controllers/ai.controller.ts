import { Response } from "express";
import { pipeline } from "@huggingface/transformers";

import { AuthRequest } from "../middleware/auth.middleware.js";

interface ListingAIAnalysis {
  title: string;
  description: string;
  category: string;
  condition: string;
  brand: string;
  size: string;
  color: string;
  suggestedPrice: number | null;
}

interface CaptionResult {
  generated_text: string;
}

type ImageCaptioner = (
  image: Blob,
  options?: {
    max_new_tokens?: number;
  }
) => Promise<CaptionResult[]>;

let captioner: ImageCaptioner | null = null;

async function getCaptioner(): Promise<ImageCaptioner> {
  if (!captioner) {
    console.log(
      "🤖 Loading local image captioning model..."
    );

    captioner =
      (await pipeline(
        "image-to-text",
        "Xenova/vit-gpt2-image-captioning"
      )) as unknown as ImageCaptioner;

    console.log(
      "✅ Local image captioning model loaded"
    );
  }

  return captioner;
}

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
    { type: contentType }
  );
}

function detectCategory(
  text: string
): string {
  const value =
    text.toLowerCase();

  if (
    /shirt|tshirt|t-shirt|dress|jeans|jacket|shoe|sneaker|bag|clothing|coat|skirt|pants|trouser/.test(
      value
    )
  ) {
    return "Fashion";
  }

  if (
    /phone|smartphone|laptop|computer|tablet|camera|headphone|earphone|television|keyboard|mouse|monitor/.test(
      value
    )
  ) {
    return "Electronics";
  }

  if (
    /book|novel|textbook|magazine/.test(
      value
    )
  ) {
    return "Books";
  }

  if (
    /sofa|chair|table|lamp|furniture|pillow|cushion|kitchen|mug/.test(
      value
    )
  ) {
    return "Home";
  }

  if (
    /cosmetic|makeup|lipstick|perfume|skincare|cream/.test(
      value
    )
  ) {
    return "Beauty";
  }

  if (
    /ball|football|basketball|cricket|bat|racket|sports|bicycle|bike/.test(
      value
    )
  ) {
    return "Sports";
  }

  return "Other";
}

function detectColor(
  text: string
): string {
  const colors = [
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "pink",
    "purple",
    "brown",
    "grey",
    "gray",
    "beige",
    "cream",
    "gold",
    "silver",
  ];

  const value =
    text.toLowerCase();

  const found =
    colors.find((color) =>
      value.includes(color)
    );

  if (!found) {
    return "";
  }

  if (found === "gray") {
    return "Grey";
  }

  return (
    found.charAt(0).toUpperCase() +
    found.slice(1)
  );
}

function detectCondition(
  caption: string
): string {
  const value =
    caption.toLowerCase();

  if (
    /new|unused|brand new|sealed|packaged/.test(
      value
    )
  ) {
    return "New";
  }

  if (
    /clean|pristine|excellent/.test(
      value
    )
  ) {
    return "Like New";
  }

  return "Good";
}

function suggestPrice(
  category: string,
  condition: string
): number {
  const prices: Record<
    string,
    number
  > = {
    Fashion: 1200,
    Electronics: 3500,
    Books: 400,
    Home: 1000,
    Beauty: 800,
    Sports: 1500,
    Other: 1000,
  };

  const multipliers: Record<
    string,
    number
  > = {
    New: 1,
    "Like New": 0.8,
    Good: 0.6,
    Fair: 0.4,
  };

  const base =
    prices[category] ?? 1000;

  const multiplier =
    multipliers[condition] ?? 0.6;

  return Math.max(
    100,
    Math.round(
      (base * multiplier) / 100
    ) * 100
  );
}

function createTitle(
  caption: string
): string {
  if (!caption) {
    return "Second-hand Product";
  }

  const words =
    caption
      .replace(/[.!?]+/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 8);

  const title =
    words.join(" ");

  return (
    title.charAt(0).toUpperCase() +
    title.slice(1)
  );
}

function createDescription(
  caption: string,
  category: string,
  color: string,
  condition: string
): string {
  const parts: string[] = [];

  if (caption) {
    parts.push(
      `AI detected: ${caption}.`
    );
  }

  parts.push(
    `Category: ${category}.`
  );

  if (color) {
    parts.push(
      `Primary color: ${color}.`
    );
  }

  parts.push(
    `Suggested condition: ${condition}.`
  );

  parts.push(
    "Please review the generated details before publishing."
  );

  return parts.join(" ");
}

export async function analyzeListing(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const { imageUrl } = req.body;

    if (
      !imageUrl ||
      typeof imageUrl !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Image URL is required",
      });
    }

    console.log(
      "🔍 Starting local AI listing analysis..."
    );

    const image =
      await imageUrlToBlob(
        imageUrl
      );

    const model =
      await getCaptioner();

    const result =
      await model(image, {
        max_new_tokens: 30,
      });

    const caption =
      result[0]
        ?.generated_text
        ?.trim() || "";

    console.log(
      "📝 AI caption:",
      caption
    );

    const category =
      detectCategory(caption);

    const color =
      detectColor(caption);

    const condition =
      detectCondition(caption);

    const analysis: ListingAIAnalysis =
      {
        title:
          createTitle(caption),

        description:
          createDescription(
            caption,
            category,
            color,
            condition
          ),

        category,

        condition,

        brand: "",

        size: "",

        color,

        suggestedPrice:
          suggestPrice(
            category,
            condition
          ),
      };

    console.log(
      "✅ Local AI analysis completed:",
      analysis
    );

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error(
      "❌ Local AI listing analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to analyze listing",
    });
  }
}