import type { ProductFilters } from "../services/productService";

export interface ParsedSearchQuery {
  filters: ProductFilters;
  originalQuery: string;
  searchTerm: string;
}

const CATEGORIES = [
  "Fashion",
  "Electronics",
  "Home",
  "Books",
  "Sports",
  "Collectibles",
];

const CATEGORY_ALIASES: Record<string, string> = {
  clothes: "Fashion",
  clothing: "Fashion",
  fashion: "Fashion",

  electronics: "Electronics",
  electronic: "Electronics",
  gadgets: "Electronics",
  gadget: "Electronics",
  phone: "Electronics",
  phones: "Electronics",
  mobile: "Electronics",
  mobiles: "Electronics",
  smartphone: "Electronics",
  smartphones: "Electronics",
  laptop: "Electronics",
  laptops: "Electronics",
  computer: "Electronics",
  computers: "Electronics",
  tablet: "Electronics",
  tablets: "Electronics",
  headphones: "Electronics",
  earphones: "Electronics",

  home: "Home",
  furniture: "Home",
  decor: "Home",
  decoration: "Home",

  books: "Books",
  book: "Books",
  novels: "Books",
  novel: "Books",

  sports: "Sports",
  sport: "Sports",
//   shoes: "Sports",
//   shoe: "Sports",
//   sneakers: "Sports",
//   sneaker: "Sports",
//   jersey: "Sports",
//   jerseys: "Sports",

  collectibles: "Collectibles",
  collectible: "Collectibles",
};

const COMMON_BRANDS = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "Levis",
  "Levi's",
  "Zara",
  "H&M",
  "Uniqlo",
  "Apple",
  "Samsung",
  "Sony",
  "OnePlus",
  "Xiaomi",
  "Realme",
  "Dell",
  "HP",
  "Lenovo",
  "Asus",
  "Acer",
  "Canon",
  "Nikon",
  "LG",
  "JBL",
  "Boat",
  "boAt",
  "IKEA",
];

const COLORS = [
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
  "navy",
  "maroon",
  "silver",
  "gold",
];

function parsePriceValue(value: string): number {
  const normalized = value.toLowerCase().replace(/,/g, "");

  if (normalized.endsWith("k")) {
    return Number(normalized.slice(0, -1)) * 1000;
  }

  return Number(normalized);
}

function extractPrice(query: string): {
  minPrice?: number;
  maxPrice?: number;
} {
  const normalized = query
    .toLowerCase()
    .replace(/,/g, "");

  // "between 2k and 5k"
  const betweenMatch = normalized.match(
    /between\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k?)\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k?)/i
  );

  if (betweenMatch) {
    return {
      minPrice: parsePriceValue(betweenMatch[1]),
      maxPrice: parsePriceValue(betweenMatch[2]),
    };
  }

  // "2k to 5k" / "2000-5000"
  const rangeMatch = normalized.match(
    /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k?)\s*(?:-|to)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k?)/i
  );

  if (rangeMatch) {
    return {
      minPrice: parsePriceValue(rangeMatch[1]),
      maxPrice: parsePriceValue(rangeMatch[2]),
    };
  }

  // "under 20k", "below ₹5000", "less than 3000"
  const maxMatch = normalized.match(
    /(?:under|below|less than|max(?:imum)?|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k?)/i
  );

  if (maxMatch) {
    return {
      maxPrice: parsePriceValue(maxMatch[1]),
    };
  }

  // "above 5k", "over 5000", "more than 3000"
  const minMatch = normalized.match(
    /(?:above|over|more than|min(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k?)/i
  );

  if (minMatch) {
    return {
      minPrice: parsePriceValue(minMatch[1]),
    };
  }

  return {};
}

function extractCondition(query: string): string | undefined {
  const normalized = query.toLowerCase();

  if (
    normalized.includes("brand new") ||
    normalized.includes("brandnew") ||
    normalized.includes("new")
  ) {
    return "New";
  }

  if (
    normalized.includes("like new") ||
    normalized.includes("almost new") ||
    normalized.includes("excellent condition") ||
    normalized.includes("excellent")
  ) {
    return "Like New";
  }

  if (
    normalized.includes("fair condition") ||
    normalized.includes("fair")
  ) {
    return "Fair";
  }

  if (
    normalized.includes("good condition") ||
    normalized.includes("good") ||
    normalized.includes("used")
  ) {
    return "Good";
  }

  return undefined;
}

function extractCategory(query: string): string | undefined {
  const normalized = query.toLowerCase();

  for (const category of CATEGORIES) {
    if (normalized.includes(category.toLowerCase())) {
      return category;
    }
  }

  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    if (normalized.includes(alias)) {
      return category;
    }
  }

  return undefined;
}

function extractBrand(query: string): string | undefined {
  const normalized = query.toLowerCase();

  const matchedBrand = COMMON_BRANDS.find((brand) =>
    normalized.includes(brand.toLowerCase())
  );

  return matchedBrand;
}

function extractColor(query: string): string | undefined {
  const normalized = query.toLowerCase();

  return COLORS.find((color) => {
    const regex = new RegExp(`\\b${color}\\b`, "i");
    return regex.test(normalized);
  });
}

function extractSize(query: string): string | undefined {
  const normalized = query.toLowerCase();

  const explicitSizeMatch = normalized.match(
    /\bsize\s*(xs|s|m|l|xl|xxl|xxxl|\d{2})\b/i
  );

  if (explicitSizeMatch) {
    return explicitSizeMatch[1].toUpperCase();
  }

  const wordSizeMatch = normalized.match(
    /\b(small|medium|large)\b/i
  );

  if (wordSizeMatch) {
    return wordSizeMatch[1];
  }

  return undefined;
}

function cleanSearchTerm(query: string): string {
  let cleaned = query.toLowerCase();

  // Remove price expressions.
  cleaned = cleaned.replace(
    /(?:under|below|less than|max(?:imum)?|upto|up to|above|over|more than|min(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?k?/gi,
    " "
  );

  // Remove "between 2k and 5k".
  cleaned = cleaned.replace(
    /between\s*(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?k?\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?k?/gi,
    " "
  );

  // Remove ranges such as "2k to 5k".
  cleaned = cleaned.replace(
    /(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?k?\s*(?:-|to)\s*(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?k?/gi,
    " "
  );

  // Remove brands that were detected.
  const brand = extractBrand(query);

  if (brand) {
    cleaned = cleaned.replace(
      new RegExp(
        `\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      ),
      " "
    );
  }

  // Remove color that was detected.
  const color = extractColor(query);

  if (color) {
    cleaned = cleaned.replace(
      new RegExp(`\\b${color}\\b`, "gi"),
      " "
    );
  }

  // Remove condition words.
  const conditionWords = [
    "brand new",
    "brandnew",
    "like new",
    "almost new",
    "excellent condition",
    "fair condition",
    "good condition",
    "condition",
    "new",
    "excellent",
    "fair",
    "good",
    "used",
  ];

  for (const word of conditionWords) {
    cleaned = cleaned.replace(
      new RegExp(`\\b${word}\\b`, "gi"),
      " "
    );
  }

  // Remove explicit size.
  cleaned = cleaned.replace(
    /\bsize\s*(xs|s|m|l|xl|xxl|xxxl|\d{2})\b/gi,
    " "
  );

  // Remove word-based sizes.
  cleaned = cleaned.replace(
    /\b(small|medium|large)\b/gi,
    " "
  );

  // Clean whitespace.
  return cleaned
    .replace(/\s+/g, " ")
    .trim();
}

export function parseSearchQuery(
  query: string
): ParsedSearchQuery {
  const originalQuery = query.trim();

  if (!originalQuery) {
    return {
      originalQuery: "",
      searchTerm: "",
      filters: {},
    };
  }

  const category = extractCategory(originalQuery);
  const condition = extractCondition(originalQuery);
  const brand = extractBrand(originalQuery);
  const color = extractColor(originalQuery);
  const size = extractSize(originalQuery);
  const priceFilters = extractPrice(originalQuery);

  const searchTerm = cleanSearchTerm(originalQuery);

  const filters: ProductFilters = {
    ...priceFilters,
  };

  // Only send search when there is
  // an actual keyword remaining.
  if (searchTerm) {
    filters.search = searchTerm;
  }

  if (category) {
    filters.category = category;
  }

  if (condition) {
    filters.condition = condition;
  }

  if (brand) {
    filters.brand = brand;
  }

  if (color) {
    filters.color = color;
  }

  if (size) {
    filters.size = size;
  }

  return {
    originalQuery,
    searchTerm,
    filters,
  };
}