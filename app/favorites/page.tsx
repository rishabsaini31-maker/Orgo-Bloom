"use client";

import { useFavoritesStore } from "@/store/favorites-store";
import { useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavoritesStore();
  const { addItem } = useCartStore();
  const router = useRouter();

  const handleAddToCart = (favorite: any) => {
    addItem({
      productId: favorite.productId,
      name: favorite.name,
      price: favorite.price,
      weight: favorite.weight,
      quantity: 1,
      imageUrl: favorite.imageUrl,
      stock: 100, // Default stock
    });
    toast.success("Added to cart!");
  };

  const handleRemove = (productId: string) => {
    removeFavorite(productId);
    toast.success("Removed from favorites");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white hover:text-primary-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="text-lg font-semibold">Back</span>
            </button>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">My Favorites</h1>
          <p className="text-xl text-primary-100 max-w-2xl">
            Your favorite organic fertilizer products
          </p>
        </div>
      </section>

      {/* Favorites Content */}
      <div className="container mx-auto px-4 py-16">
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              No favorites yet
            </h2>
            <p className="text-gray-500 mb-8">
              Start adding products to your favorites!
            </p>
            <Link href="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                {favorites.length} {favorites.length === 1 ? "Item" : "Items"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite) => (
                <div
                  key={favorite.productId}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/products/${favorite.slug}`}>
                    <div className="relative h-48 bg-gray-200">
                      {favorite.imageUrl ? (
                        <Image
                          src={favorite.imageUrl}
                          alt={favorite.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link href={`/products/${favorite.slug}`}>
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary-600 line-clamp-2">
                        {favorite.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-primary-600">
                          {formatPrice(favorite.price)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {favorite.weight}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(favorite)}
                        className="flex-1 btn btn-primary text-sm"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemove(favorite.productId)}
                        className="btn bg-red-500 hover:bg-red-600 text-white text-sm px-3"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
