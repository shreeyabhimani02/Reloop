import {
  Camera,
  Search,
  Sparkles,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ProductCard from "../../components/product/ProductCard";
import { useProducts } from "../../hooks/useProducts";

const categories = [
  "Fashion",
  "Electronics",
  "Home",
  "Books",
  "Sports",
  "Collectibles",
];

export default function Home() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useProducts({
    limit: 8,
    sort: "newest",
  });

  const products = data?.products ?? [];

  function handleSearch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      navigate("/search");
      return;
    }

    navigate(
      `/search?q=${encodeURIComponent(value)}`
    );
  }

  function handleCategory(
    category: string
  ) {
    navigate(
      `/search?category=${encodeURIComponent(category)}`
    );
  }

  return (
    <main>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero">

        <div className="hero-content">

          <span className="hero-label">
            <Sparkles size={16} />
            Intelligent recommerce
          </span>

          <h1>
            Find something
            <br />
            worth a second life.
          </h1>

          <p>
            Discover pre-loved products or give your
            unused things a new home.
          </p>

          {/* SEARCH */}

          <form
            className="hero-search"
            onSubmit={handleSearch}
          >
            <Search size={20} />

            <input
              type="search"
              placeholder="What are you looking for?"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <button type="submit">
              Search
            </button>
          </form>

          {/* VISUAL SEARCH */}

          <button
            type="button"
            className="visual-search-link"
            onClick={() =>
              navigate("/visual-search")
            }
          >
            <Camera size={17} />
            Search with an image
          </button>

        </div>

      </section>

      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section className="section">

        <div className="section-header">

          <div>

            <span className="section-eyebrow">
              Explore
            </span>

            <h2>
              Browse categories
            </h2>

          </div>

        </div>

        <div className="categories">

          {categories.map((category) => (

            <button
              type="button"
              className="category-card"
              key={category}
              onClick={() =>
                handleCategory(category)
              }
            >
              {category}
            </button>

          ))}

        </div>

      </section>

      {/* =================================================
          RECOMMENDED PRODUCTS
      ================================================= */}

      <section className="section">

        <div className="section-header">

          <div>

            <span className="section-eyebrow">
              Personalized
            </span>

            <h2>
              Recommended for you
            </h2>

          </div>

          <button
            type="button"
            className="view-all"
            onClick={() =>
              navigate("/search")
            }
          >
            View all →
          </button>

        </div>

        {/* LOADING */}

        {isLoading && (

          <div className="product-grid">

            {[...Array(8)].map(
              (_, index) => (

                <div
                  key={index}
                  className="product-card-skeleton"
                >
                  Loading...
                </div>

              )
            )}

          </div>

        )}

        {/* ERROR */}

        {isError && (

          <div className="empty-state">

            <h3>
              Unable to load products
            </h3>

            <p>
              {error instanceof Error
                ? error.message
                : "Something went wrong."}
            </p>

          </div>

        )}

        {/* PRODUCTS */}

        {!isLoading &&
          !isError &&
          products.length > 0 && (

            <div className="product-grid">

              {products.map((product) => (

                <ProductCard
                  key={product._id}
                  product={product}
                />

              ))}

            </div>

          )}

        {/* EMPTY */}

        {!isLoading &&
          !isError &&
          products.length === 0 && (

            <div className="empty-state">

              <h3>
                No products yet
              </h3>

              <p>
                Products added to ReLoop will appear here.
              </p>

            </div>

          )}

      </section>

    </main>
  );
}