export interface Seller {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  rating: number;
  totalRatings: number;
  itemsSold: number;
  responseRate: number;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  seller: Seller;
  location: string;
  brand?: string;
  size?: string;
  color?: string;
  views: number;
  likes: number;
  isSold: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: ProductPagination;
}