"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { formatPrice } from "@/lib/utils";
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
    <div className="bg-white rounded-xl shadow-elegant hover:shadow-elegant-lg transition-all duration-300 overflow-hidden group">
      <Link href={`/products/${product.slug}`}>
        <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-100 group">
          {currentImage ? (
            <>
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  console.error(`Failed to load image: ${currentImage}`);
                  e.currentTarget.src = "/placeholder-product.jpg";
                }}
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

              {/* 30% OFF Badge */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                {discountPercentage}% OFF
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
                    setCurrentImageIndex(
                      currentImageIndex === 0
                        ? productImages.length - 1
                        : currentImageIndex - 1,
                    );
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                    setCurrentImageIndex(
                      currentImageIndex === productImages.length - 1
                        ? 0
                        : currentImageIndex + 1,
                    );
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

      <div className="p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bold text-lg text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            {/* Original Price (Strikethrough) */}
            <span className="text-xs text-gray-400 line-through font-medium">
              {formatPrice(product.price)}
            </span>
            {/* Discounted Price */}
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              {formatPrice(discountedPrice)}
            </span>
          </div>
          <div className="text-right">
            <span className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full">
              {product.weight}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="btn btn-primary text-sm py-2 px-4 flex-1"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
