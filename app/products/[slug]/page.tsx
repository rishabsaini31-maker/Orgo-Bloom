"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { productApi } from "@/lib/api-client";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem } = useCartStore();

  // Calculate 30% discount
  const discountPercentage = 30;
  const discountedPrice = product
    ? product.price * (1 - discountPercentage / 100)
    : 0;

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const response = await productApi.getBySlug(slug);
      setProduct(response.data.product);
    } catch (error: any) {
      console.error("Error fetching product:", error);
      if (error.response?.status === 404) {
        router.push("/products");
      }
    } finally {
      setLoading(false);
    }
  };

  // Get all available images
  const allImages = product
    ? [
        ...(product.images && product.images.length > 0
          ? product.images
          : []),
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

    addItem({
      productId: product.id,
      name: product.name,
      price: discountedPrice, // Use discounted price
      weight: product.weight,
      quantity,
      imageUrl: product.imageUrl,
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
              {/* Main Image */}
              <div className="relative h-96 lg:h-[500px] bg-gray-200 rounded-lg overflow-hidden group">
                {currentImage ? (
                  <>
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error(`Failed to load image: ${currentImage}`);
                        e.currentTarget.src = "/placeholder-product.jpg";
                      }}
                    />
                    {/* 30% OFF Badge */}
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg text-lg font-bold shadow-lg z-10">
                      {discountPercentage}% OFF
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image Available
                  </div>
                )}
              </div>

              {/* Image Thumbnails Grid */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-20 bg-gray-200 rounded-lg overflow-hidden transition-all ${
                        selectedImageIndex === index
                          ? "ring-2 ring-primary-600 ring-offset-2"
                          : "hover:ring-2 hover:ring-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`Failed to load thumbnail: ${image}`);
                        }}
                      />
                    </button>
                  ))}
                </div>
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
        </div>
      </main>
      <Footer />
    </>
  );
}
