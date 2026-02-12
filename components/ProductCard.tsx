"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { formatPrice } from "@/lib/utils";
import SafeImage from "@/components/SafeImage";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    weight: string;
    stock: number;
    imageUrl?: string | null;
    images?: string[];
    description: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isFav = isFavorite(product.id);

  // Use images array if available, otherwise fall back to imageUrl
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const currentImage = productImages[currentImageIndex] || null;
  const hasMultipleImages = productImages.length > 1;

  // Calculate 30% discount
  const discountPercentage = 30;
  const discountedPrice = product.price * (1 - discountPercentage / 100);

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error("Product out of stock");
      return;
    }

    // Use first image from images array, or fall back to imageUrl
    const cartImage =
      product.images && product.images.length > 0
        ? product.images[0]
        : product.imageUrl;

    addItem({
      productId: product.id,
      name: product.name,
      price: discountedPrice, // Use discounted price
      weight: product.weight,
      quantity: 1,
      imageUrl: cartImage ?? undefined,
      stock: product.stock,
    });

    toast.success("Added to cart!");
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFav) {
      removeFavorite(product.id);
      toast.success("Removed from favorites");
    } else {
      addFavorite({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: discountedPrice,
        weight: product.weight,
        imageUrl: product.imageUrl ?? undefined,
      });
      toast.success("Added to favorites!");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant hover:shadow-elegant-lg transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-primary-200">
      <Link href={`/products/${product.slug}`}>
        <div className="relative h-40 sm:h-48 md:h-56 bg-gradient-to-br from-gray-200 to-gray-100 overflow-hidden group/image">
          {currentImage ? (
            <>
              {/* Main product image */}
              <SafeImage
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
              {/* Favorite Button */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 hover:bg-white"
              >
                <svg
                  className={`w-6 h-6 ${isFav ? "text-red-500 fill-current" : "text-gray-400"}`}
                  fill={isFav ? "currentColor" : "none"}
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
              </button>

              {/* 30% OFF Badge + Organic Badge */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  {discountPercentage}% OFF
                </div>
                <div className="badge-organic text-xs">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.633l4-12a1 1 0 011.265-.632zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Organic
                </div>
              </div>

              {/* Image Counter */}
              {hasMultipleImages && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                  {currentImageIndex + 1}/{productImages.length}
                </div>
              )}

              {/* Navigate Previous Image */}
              {hasMultipleImages && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(
                      currentImageIndex === 0
                        ? productImages.length - 1
                        : currentImageIndex - 1,
                    );
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity"
                >
                  ‹
                </button>
              )}

              {/* Navigate Next Image */}
              {hasMultipleImages && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(
                      currentImageIndex === productImages.length - 1
                        ? 0
                        : currentImageIndex + 1,
                    );
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity"
                >
                  ›
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 sm:p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3 hover:text-primary-600 transition-colors line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 h-8 sm:h-10 leading-snug">
          {product.description}
        </p>

        {/* Organic & Benefits Badges */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100">
          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Natural
          </span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                clipRule="evenodd"
              />
            </svg>
            Pure
          </span>
        </div>

        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex flex-col gap-0.5 sm:gap-1">
            {/* Original Price (Strikethrough) */}
            <span className="text-[10px] sm:text-xs text-gray-400 line-through font-medium">
              {formatPrice(product.price)}
            </span>
            {/* Discounted Price */}
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              {formatPrice(discountedPrice)}
            </span>
          </div>
          <div className="text-right">
            <span className="inline-block bg-primary-50 text-primary-700 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
              {product.weight}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
          <span
            className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 ${
              product.stock > 0
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                : "bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200"
            }`}
          >
            {product.stock > 0 ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {product.stock} left
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 105.11 2.697a6 6 0 008.367 12.193z"
                    clipRule="evenodd"
                  />
                </svg>
                Sold out
              </>
            )}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="btn btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 flex-1"
          >
            {product.stock > 0 ? "Add to Cart" : "Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
}
