"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.slug}`}>
        <div className="relative h-48 bg-gray-200 group">
          {currentImage ? (
            <>
              <img
                src={currentImage}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image: ${currentImage}`);
                  e.currentTarget.src = "/placeholder-product.jpg";
                }}
              />
              {/* Favorite Button */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="absolute top-2 left-2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
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
              <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                {discountPercentage}% OFF
              </div>

              {/* Image Counter */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
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

      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary-600">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            {/* Original Price (Strikethrough) */}
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.price)}
            </span>
            {/* Discounted Price */}
            <span className="text-2xl font-bold text-primary-600">
              {formatPrice(discountedPrice)}
            </span>
          </div>
          <span className="text-sm text-gray-500">{product.weight}</span>
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`text-sm ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="btn btn-primary text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
