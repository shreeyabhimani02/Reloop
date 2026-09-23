import { X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import ProductGrid from "../../components/product/ProductGrid";
import { useInfiniteProducts } from "../../hooks/useProducts";
import { parseSearchQuery } from "../../utils/parseSearchQuery";

type SortOption =
  | "relevance"
  | "price-low"
  | "price-high"
  | "newest";

const categories = [
  "All",
  "Fashion",
  "Electronics",
  "Home",
  "Books",
  "Sports",
  "Collectibles",
];

const conditions = [
  "All",
  "New",
  "Like New",
  "Good",
  "Fair",
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // ─────────────────────────────────────────────
  // URL PARAMETERS
  // ─────────────────────────────────────────────

  const query = (searchParams.get("q") || "").trim();

  const categoryParam =
    searchParams.get("category") || "All";

  const conditionParam =
    searchParams.get("condition") || "All";

  const maxPriceParam =
    Number(searchParams.get("maxPrice")) || 50000;

  const sortParam =
    (searchParams.get("sort") as SortOption) ||
    "relevance";

  // ─────────────────────────────────────────────
  // LOCAL UI STATE
  // ─────────────────────────────────────────────

  const [category, setCategory] =
    useState(categoryParam);

  const [condition, setCondition] =
    useState(conditionParam);

  const [maxPrice, setMaxPrice] =
    useState(maxPriceParam);

  const [sort, setSort] =
    useState<SortOption>(sortParam);


  // Keep local state synchronized with URL.
  useEffect(() => {
    setCategory(categoryParam);
    setCondition(conditionParam);
    setMaxPrice(maxPriceParam);
    setSort(sortParam);
  }, [
    categoryParam,
    conditionParam,
    maxPriceParam,
    sortParam,
  ]);

  // ─────────────────────────────────────────────
  // UPDATE URL
  // ─────────────────────────────────────────────

  function updateFilters(
    updates: Record<string, string | null>
  ) {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(
      ([key, value]) => {
        if (
          value === null ||
          value === "" ||
          value === "All" ||
          value === "relevance"
        ) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
    );

    params.delete("page");

    setSearchParams(params);
  }

  // ─────────────────────────────────────────────
  // FILTER HANDLERS
  // ─────────────────────────────────────────────

  function handleCategoryChange(
    value: string
  ) {
    setCategory(value);

    updateFilters({
      category: value,
    });
  }

  function handleConditionChange(
    value: string
  ) {
    setCondition(value);

    updateFilters({
      condition: value,
    });
  }

  function handlePriceChange(
    value: number
  ) {
    setMaxPrice(value);

    updateFilters({
      maxPrice:
        value < 50000
          ? String(value)
          : null,
    });
  }

  function handleSortChange(
    value: SortOption
  ) {
    setSort(value);

    updateFilters({
      sort: value,
    });
  }

  // ─────────────────────────────────────────────
  // PRODUCT FILTERS
  // ─────────────────────────────────────────────

  const productFilters = useMemo(() => {
    const parsedQuery = parseSearchQuery(query);
    console.log("Natural Search:", {
      query,
      parsedQuery,
    });
    const filters: {
      search?: string;
      category?: string;
      condition?: string;
      brand?: string;
      color?: string;
      size?: string;
      minPrice?: number;
      maxPrice?: number;
      sort?: "newest" | "price-low" | "price-high";
      limit: number;
    } = {
      limit: 20,
    };

    // Natural-language search
    if (parsedQuery.searchTerm) {
      filters.search = parsedQuery.searchTerm;
    }

    // Parsed category
    if (category !== "All") {
      filters.category = category;
    } else if (parsedQuery.filters.category) {
      filters.category = parsedQuery.filters.category;
    }

    // Parsed condition
    if (condition !== "All") {
      filters.condition = condition;
    } else if (parsedQuery.filters.condition) {
      filters.condition = parsedQuery.filters.condition;
    }

    // Parsed brand
    if (parsedQuery.filters.brand) {
      filters.brand = parsedQuery.filters.brand;
    }

    // Parsed color
    if (parsedQuery.filters.color) {
      filters.color = parsedQuery.filters.color;
    }

    // Parsed size
    if (parsedQuery.filters.size) {
      filters.size = parsedQuery.filters.size;
    }

    // Manual maximum price filter
    if (maxPrice < 50000) {
      filters.maxPrice = maxPrice;
    } else if (parsedQuery.filters.maxPrice !== undefined) {
      filters.maxPrice = parsedQuery.filters.maxPrice;
    }

    // Natural-language minimum price
    if (parsedQuery.filters.minPrice !== undefined) {
      filters.minPrice = parsedQuery.filters.minPrice;
    }

    // Sorting
    if (sort !== "relevance") {
      filters.sort = sort;
    }

    return filters;
  }, [
    query,
    category,
    condition,
    maxPrice,
    sort,
  ]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(productFilters);

  const products =
    data?.pages.flatMap(
      (page) => page.products
    ) ?? [];

  const totalProducts =
    data?.pages[0]?.pagination?.total ??
    products.length;

    useEffect(() => {
      const target = loadMoreRef.current;

      if (!target) {
        return;
      }

      if (!hasNextPage || isFetchingNextPage) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const firstEntry = entries[0];

          if (
            firstEntry.isIntersecting &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            fetchNextPage();
          }
        },
        {
          rootMargin: "300px",
        }
      );

      observer.observe(target);

      return () => {
        observer.disconnect();
      };
    }, [
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    ]);

  // ─────────────────────────────────────────────
  // CLEAR FILTERS
  // ─────────────────────────────────────────────

  function clearFilters() {
    setCategory("All");
    setCondition("All");
    setMaxPrice(50000);
    setSort("relevance");

    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    setSearchParams(params);
  }

  return (
    <main className="page">
      <section className="search-page">

        {/* ═══════════════════════════════════════
            HEADER
        ═══════════════════════════════════════ */}

        <div className="search-header">

          <span className="section-eyebrow">
            Marketplace
          </span>

          <h1>
            {query
              ? `Results for "${query}"`
              : "Explore products"}
          </h1>

          <p>
            {isLoading
              ? "Finding products..."
              : `${totalProducts} products found`}
          </p>

        </div>

        <div className="search-layout">

          {/* ═══════════════════════════════════════
              FILTER PANEL
          ═══════════════════════════════════════ */}

          <aside className="filter-panel">

            <div className="filter-header">

              <strong>
                Filters
              </strong>

              <button
                type="button"
                onClick={clearFilters}
              >
                <X size={16} />
                Clear
              </button>

            </div>

            {/* CATEGORY */}

            <div className="filter-group">

              <label>
                Category
              </label>

              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    category === item
                      ? "filter-option active"
                      : "filter-option"
                  }
                  onClick={() =>
                    handleCategoryChange(item)
                  }
                >
                  {item}
                </button>
              ))}

            </div>

            {/* CONDITION */}

            <div className="filter-group">

              <label>
                Condition
              </label>

              {conditions.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    condition === item
                      ? "filter-option active"
                      : "filter-option"
                  }
                  onClick={() =>
                    handleConditionChange(item)
                  }
                >
                  {item}
                </button>
              ))}

            </div>

            {/* PRICE */}

            <div className="filter-group">

              <label>
                Maximum price
              </label>

              <input
                type="range"
                min="0"
                max="50000"
                step="500"
                value={maxPrice}
                onChange={(event) =>
                  handlePriceChange(
                    Number(event.target.value)
                  )
                }
              />

              <strong>
                ₹
                {maxPrice.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </aside>

          {/* ═══════════════════════════════════════
              RESULTS
          ═══════════════════════════════════════ */}

          <div className="search-results">

            <div className="search-toolbar">

              <span>
                {isLoading
                  ? "Loading..."
                  : `${totalProducts} results`}
              </span>

              <select
                value={sort}
                onChange={(event) =>
                  handleSortChange(
                    event.target.value as SortOption
                  )
                }
              >
                <option value="relevance">
                  Relevance
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="newest">
                  Newest
                </option>
              </select>

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
                <ProductGrid
                  products={products}
                />
              )}

            {/* EMPTY */}

            {!isLoading &&
              !isError &&
              products.length === 0 && (
                <div className="empty-state">

                  <h3>
                    No products found
                  </h3>

                  <p>
                    Try changing your search
                    or filters.
                  </p>

                </div>
              )}
              
              {!isLoading &&
                !isError &&
                products.length > 0 &&
                hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="infinite-scroll-trigger"
                  >
                    {isFetchingNextPage && (
                      <div className="infinite-scroll-loader">
                        <div className="infinite-spinner" />
                        <span>Loading more products...</span>
                      </div>
                    )}
                  </div>
                )}

              {!isLoading &&
                !isError &&
                products.length > 0 &&
                !hasNextPage && (
                  <div className="all-products-loaded">
                    <span>
                      You've reached the end of the results.
                    </span>
                  </div>
                )}

          </div>

        </div>

      </section>
    </main>
  );
}