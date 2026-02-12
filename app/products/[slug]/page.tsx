"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { productApi } from "@/lib/api-client";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem } = useCartStore();

  // Calculate 30% discount
  const discountPercentage = 30;
  const discountedPrice = product
    ? product.price * (1 - discountPercentage / 100)
    : 0;

  const fetchProduct = useCallback(async () => {
    try {
      const response = await productApi.getBySlug(slug);
      setProduct(response.data.product);

      // Fetch related products (all active products except current one)
      const allProductsResponse = await productApi.getAll({ limit: 100 });
      const related = allProductsResponse.data.products
        .filter((p: any) => p.id !== response.data.product.id)
        .slice(0, 8); // Show only 8 related products
      setRelatedProducts(related);
    } catch (error: any) {
      console.error("Error fetching product:", error);
      if (error.response?.status === 404) {
        router.push("/products");
      }
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug, fetchProduct]);

  // Get all available images
  const allImages = product
    ? [
        ...(product.images && product.images.length > 0 ? product.images : []),
        ...(product.imageUrl &&
        (!product.images || !product.images.includes(product.imageUrl))
          ? [product.imageUrl]
          : []),
      ].filter(Boolean)
    : [];

  const currentImage = allImages[selectedImageIndex] || product?.imageUrl || "";

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      toast.error("Product out of stock");
      return;
    }

    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} items available`);
      return;
    }

    // Use currently selected image, or fall back to first image from images array, or imageUrl
    let imageToAdd = currentImage;
    if (!imageToAdd) {
      imageToAdd =
        product.images && product.images.length > 0
          ? product.images[0]
          : product.imageUrl;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: discountedPrice, // Use discounted price
      weight: product.weight,
      quantity,
      imageUrl: imageToAdd || undefined,
      stock: product.stock,
    });

    toast.success("Added to cart!");
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <button
              onClick={() => router.push("/products")}
              className="btn btn-primary"
            >
              Back to Products
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-6"
          >
            ← Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images Collage */}
            <div className="space-y-4">
              {allImages.length === 0 ? (
                // No Images
                <div className="relative h-96 lg:h-[500px] bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg
                      className="w-24 h-24 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-lg">No Image Available</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Main Large Image - Shows Selected Image */}
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex)}
                    className={`relative w-full h-80 lg:h-96 bg-gray-100 rounded-lg overflow-hidden group transition-all flex items-center justify-center ring-4 ring-primary-600`}
                  >
                    {/* Blurred Background Image */}
                    {currentImage && (
                      <Image
                        src={currentImage}
                        alt={`${product.name} background`}
                        fill
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-40"
                        priority
                      />
                    )}

                    {/* Main Product Image */}
                    {currentImage && (
                      <Image
                        src={currentImage}
                        alt={product.name}
                        fill
                        className="relative w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          console.error(
                            `Failed to load image: ${currentImage}`,
                          );
                          e.currentTarget.src = "/placeholder-product.jpg";
                        }}
                      />
                    )}
                    {/* 30% OFF Badge */}
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg text-lg font-bold shadow-lg z-10">
                      {discountPercentage}% OFF
                    </div>
                    {/* Image Counter Badge */}
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      1 / {allImages.length}
                    </div>
                  </button>

                  {/* Collage Grid - Remaining Images */}
                  {allImages.length > 1 && (
                    <div
                      className={`grid gap-3 ${
                        allImages.length === 2
                          ? "grid-cols-1"
                          : allImages.length === 3
                            ? "grid-cols-2"
                            : allImages.length === 4
                              ? "grid-cols-2"
                              : "grid-cols-3"
                      }`}
                    >
                      {allImages.slice(1).map((image, index) => (
                        <button
                          key={index + 1}
                          onClick={() => setSelectedImageIndex(index + 1)}
                          className={`relative h-40 lg:h-52 bg-gray-100 rounded-lg overflow-hidden group transition-all flex items-center justify-center ${
                            selectedImageIndex === index + 1
                              ? "ring-4 ring-primary-600"
                              : "hover:ring-2 hover:ring-gray-300"
                          }`}
                        >
                          {/* Blurred Background Image */}
                          <Image
                            src={image}
                            alt={`${product.name} bg`}
                            fill
                            className="absolute inset-0 w-full h-full object-cover blur-lg scale-125 opacity-40"
                          />

                          {/* Main Thumbnail Image */}
                          <Image
                            src={image}
                            alt={`${product.name} ${index + 2}`}
                            fill
                            className="relative w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              console.error(`Failed to load image: ${image}`);
                            }}
                          />
                          {/* Image Number Badge */}
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                            {index + 2}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  {/* Original Price */}
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                  {/* Discount Badge */}
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                    Save {discountPercentage}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {/* Discounted Price */}
                  <span className="text-4xl font-bold text-primary-600">
                    {formatPrice(discountedPrice)}
                  </span>
                  <span className="text-lg text-gray-600">
                    / {product.weight}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {product.stock > 0
                    ? `${product.stock} in stock`
                    : "Out of stock"}
                </span>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                {product.description}
              </p>

              {product.benefits && product.benefits.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Benefits:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {product.benefits.map((benefit: string, index: number) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {product.usage && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Usage:</h3>
                  <p className="text-gray-700">{product.usage}</p>
                </div>
              )}

              {product.composition && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Composition:</h3>
                  <p className="text-gray-700">{product.composition}</p>
                </div>
              )}

              {/* Add to Cart */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center border-x border-gray-300"
                    min="1"
                    max={product.stock}
                  />
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="btn btn-primary flex-1 text-lg py-3"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-16 border-t border-gray-200">
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-2">Related Products</h2>
                <p className="text-gray-600">
                  You might also be interested in these products
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
