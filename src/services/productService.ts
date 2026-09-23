import type {
  Product,
  ProductsResponse,
} from "../types/product";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ProductFilters {
  search?: string;
  category?: string;
  condition?: string;
  brand?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-low" | "price-high" | "popular";
  page?: number;
  limit?: number;
}

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  location: string;
  brand?: string;
  size?: string;
  color?: string;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: string;
  images?: string[];
  location?: string;
  brand?: string;
  size?: string;
  color?: string;
  isSold?: boolean;
}

function getToken(): string {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  return token;
}

// ─────────────────────────────────────────────────────────────
// GET ALL PRODUCTS
// ─────────────────────────────────────────────────────────────

export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductsResponse> {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.condition) {
    params.set("condition", filters.condition);
  }

  if (filters.brand) {
    params.set("brand", filters.brand);
  }

  if (filters.color) {
    params.set("color", filters.color);
  }

  if (filters.size) {
    params.set("size", filters.size);
  }

  if (filters.minPrice !== undefined) {
    params.set("minPrice", String(filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    params.set("maxPrice", String(filters.maxPrice));
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/api/products${query ? `?${query}` : ""}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch products"
    );
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// GET PRODUCT BY ID
// ─────────────────────────────────────────────────────────────

export async function getProductById(
  id: string
): Promise<Product> {
  const response = await fetch(
    `${API_URL}/api/products/${id}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch product"
    );
  }

  return data.product;
}

// ─────────────────────────────────────────────────────────────
// GET SELLER PRODUCTS
// ─────────────────────────────────────────────────────────────

export async function getSellerProducts(
  sellerId: string
): Promise<Product[]> {
  const response = await fetch(
    `${API_URL}/api/products/seller/${sellerId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch seller listings"
    );
  }

  return data.products;
}

// ─────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────────────────────

export async function createProduct(
  productData: CreateProductData
): Promise<Product> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/products`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new Error(
      data.message || "Failed to create product"
    );
  }

  return data.product;
}

// ─────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────

export async function updateProduct(
  id: string,
  productData: UpdateProductData
): Promise<Product> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/products/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new Error(
      data.message || "Failed to update product"
    );
  }

  return data.product;
}

// ─────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────────────────────

export async function deleteProduct(
  id: string
): Promise<void> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/products/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new Error(
      data.message || "Failed to delete product"
    );
  }
}