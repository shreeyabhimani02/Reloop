import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import "./Wishlist.css";

import ProductCard from "../../components/product/ProductCard";
import { useWishlistStore } from "../../store/wishlistStore";
import {
  getProductById,
} from "../../services/productService";
import type { Product } from "../../types/product";

export default function Wishlist() {
  const wishlist = useWishlistStore(
    (state) => state.wishlist
  );

  const isInitialized = useWishlistStore(
    (state) => state.isInitialized
  );

  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      if (!isInitialized) return;

      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const results = await Promise.all(
          wishlist.map((id) =>
            getProductById(id)
          )
        );

        setProducts(
          results.filter(
            (product): product is Product =>
              Boolean(product)
          )
        );
      } catch (error) {
        console.error(
          "Failed to load wishlist products:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [wishlist, isInitialized]);

  if (!isInitialized || loading) {
    return (
      <main className="page">
        <div className="empty-state">
          <p>Loading your wishlist...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>My Wishlist</h1>

          <p>
            {products.length}{" "}
            {products.length === 1
              ? "item"
              : "items"}{" "}
            saved
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <Heart size={40} />

          <h2>Your wishlist is empty</h2>

          <p>
            Save products you love and find them
            here later.
          </p>

          <Link to="/">
            Explore products
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}
        </div>
      )}
    </main>
  );
}