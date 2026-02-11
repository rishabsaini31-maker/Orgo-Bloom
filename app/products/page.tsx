"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { productApi } from "@/lib/api-client";

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Get search query from URL params
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearch(searchQuery);
    }
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productApi.getAll({ page, limit: 12, search });
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  // Separate products by category
  const cowManureProducts = products.filter(
    (p) => p.category === "cow" || !p.category,
  );
  const chickenManureProducts = products.filter(
    (p) => p.category === "chicken",
  );

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="bg-primary-600 text-white py-8 sm:py-10 lg:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
              Our Products
            </h1>
            <p className="text-primary-100 text-sm sm:text-base lg:text-lg">
              Browse our collection of premium organic fertilizers
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
            <div className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input flex-1 text-sm sm:text-base"
              />
              <button
                type="submit"
                className="btn btn-primary text-sm sm:text-base px-4 sm:px-6"
              >
                Search
              </button>
            </div>
          </form>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600 text-sm sm:text-base">
                Loading products...
              </p>
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Cow Manure Section */}
              {cowManureProducts.length > 0 && (
                <section className="mb-8 sm:mb-12">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                      Cow Manure Products
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                      Premium organic cow manure fertilizers
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {cowManureProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              )}

              {/* Chicken Manure Section */}
              {chickenManureProducts.length > 0 && (
                <section className="mb-8 sm:mb-12">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                      Chicken Manure Products
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                      High-nutrient organic chicken manure fertilizers
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {chickenManureProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2 mt-6 sm:mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary disabled:opacity-50 w-full sm:w-auto text-sm sm:text-base"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm sm:text-base">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary disabled:opacity-50 w-full sm:w-auto text-sm sm:text-base"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 text-sm sm:text-base">
              No products found. Try adjusting your search.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
