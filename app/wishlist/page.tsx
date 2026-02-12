"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFavoritesStore } from "@/store/favorites-store";
import { useCartStore } from "@/store/cart-store";
import { productApi } from "@/lib/api-client";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  images?: string[];
}

export default function WishlistPage() {
  const { favorites, removeFavorite } = useFavoritesStore();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Favorites from store:", favorites);

        if (favorites.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Fetch product details for all favorites with proper mapping
        const productDetailsWithIds = await Promise.all(
          favorites.map((fav) => {
            console.log("Fetching product:", fav.productId);
            return productApi
              .getById(fav.productId)
              .then((response) => ({
                productId: fav.productId,
                data: response,
                favoriteItem: fav,
              }))
              .catch((err) => {
                console.error("Failed to fetch product:", fav.productId, err);
                return null;
              });
          }),
        );

        console.log("Raw API responses:", productDetailsWithIds);

        const validProducts = productDetailsWithIds
          .filter((p) => p !== null)
          .map(({ data: response, favoriteItem, productId }) => {
            const product = response.data?.product || response.data;

            // Use imageUrl from favorites store if product API doesn't have it
            if (
              !product.imageUrl &&
              !product.images?.length &&
              favoriteItem?.imageUrl
            ) {
              product.imageUrl = favoriteItem.imageUrl;
            }

            console.log("Extracted product:", product);
            return product;
          })
          .filter((product) => product);

        console.log("Wishlist products loaded:", validProducts);
        setProducts(validProducts);
      } catch (err) {
        console.error("Error fetching wishlist products:", err);
        setError("Failed to load wishlist items");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [favorites]);

  const handleAddToCart = (product: WishlistProduct) => {
    if (product.stock <= 0) {
      setError("This product is out of stock");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      weight: "1 kg", // Default weight, can be customized
      quantity: 1,
      imageUrl: product.imageUrl || product.images?.[0] || "",
      stock: product.stock,
    });

    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  const handleRemove = (productId: string) => {
    removeFavorite(productId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your wishlist...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-2">
            {products.length} {products.length === 1 ? "item" : "items"} saved
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-16 px-4 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start adding your favorite products to save them for later
            </p>
            <Link
              href="/products"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => {
              const favoriteItem = favorites.find(
                (f) => f.productId === product.id,
              );
              const imageUrl =
                product.imageUrl ||
                product.images?.[0] ||
                favoriteItem?.imageUrl;

              console.log(
                "Rendering product:",
                product.name,
                "imageUrl:",
                imageUrl,
              );

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log(
                            "Image load error for:",
                            product.name,
                            imageUrl,
                            "- using placeholder"
                          );
                          e.currentTarget.src = "/placeholder-product.svg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition text-xl"
                      aria-label="Remove from wishlist"
                    >
                      ❤️
                    </button>

                    {/* Out of Stock Badge */}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Product Name */}
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-green-600 transition">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    {product.reviewCount > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < Math.round(product.rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({product.reviewCount})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mt-3 mb-4">
                      <p className="text-2xl font-bold text-green-600">
                        ₹{product.price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    {/* Stock Status */}
                    <div className="mb-4">
                      {product.stock > 0 ? (
                        <p className="text-sm text-green-600 font-medium">
                          ✓ In Stock ({product.stock} available)
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 font-medium">
                          Out of Stock
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                        className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                          product.stock <= 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : addedToCart === product.id
                              ? "bg-green-600 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        🛒
                        {addedToCart === product.id ? "Added!" : "Add to Cart"}
                      </button>

                      <button
                        onClick={() => handleRemove(product.id)}
                        className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-red-50 transition text-lg"
                        aria-label="Remove from wishlist"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* View Details Link */}
                    <Link
                      href={`/products/${product.slug}`}
                      className="block mt-3 text-center text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Shopping Button */}
        {products.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-block text-green-600 hover:text-green-700 font-semibold"
            >
              ← Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
