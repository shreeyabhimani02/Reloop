import type { Product } from "../../types/product";
import ProductCard from "./ProductCard";
import { Sparkles } from "lucide-react";

interface SimilarityScore {
  productId: string;
  score: number;
}

interface ProductGridProps {
  products: Product[];
  similarityScores?: SimilarityScore[];
}

export default function ProductGrid({
  products,
  similarityScores,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <h3>No products found</h3>
        <p>
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => {
        const similarity = similarityScores?.find(
          (item) => item.productId === product._id
        );

        return (
          <div key={product._id}>
            <ProductCard
              product={product}
            />

            {similarity && (
              <div className="visual-match-score">
                <Sparkles size={14} />
                <span>
                  {similarity.score}% similarity
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}