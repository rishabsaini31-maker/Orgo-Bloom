"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Clean up invalid items from cart (e.g., temp IDs from old test data)
  useEffect(() => {
    const invalidItems = items.filter(
      (item) =>
        !item.productId ||
        item.productId.startsWith("temp-") ||
        item.productId.length < 10, // Real Prisma IDs are longer
    );

    if (invalidItems.length > 0) {
      invalidItems.forEach((item) => removeItem(item.productId));
      toast.error(`Removed ${invalidItems.length} invalid item(s) from cart`);
    }
  }, [items, removeItem]);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 999 ? 0 : 50;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please login to checkout");
      router.push("/auth/login");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-24 h-24 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Start shopping to add items to your cart
            </p>
            <button
              onClick={() => router.push("/products")}
              className="btn btn-primary"
            >
              Browse Products
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
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8">
            Shopping Cart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white rounded-lg shadow-md p-4 sm:p-6"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-6 flex-col sm:flex-row">
                    <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">
                          {item.name}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">
                          {item.weight}
                        </p>
                        <p className="text-primary-600 font-bold text-base sm:text-lg">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="px-3 sm:px-4 py-2 hover:bg-gray-100 text-lg"
                        >
                          -
                        </button>
                        <span className="px-3 sm:px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          className="px-3 sm:px-4 py-2 hover:bg-gray-100 disabled:opacity-50 text-lg"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-600 hover:text-red-700 p-2"
                        aria-label="Remove item"
                      >
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6"
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

                  <div className="mt-3 sm:mt-4 text-right pt-3 sm:pt-0 border-t sm:border-t-0">
                    <span className="text-gray-600 text-sm sm:text-base">
                      Subtotal:{" "}
                    </span>
                    <span className="font-bold text-base sm:text-lg">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 font-semibold text-sm sm:text-base py-2"
              >
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-24">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>

                  {subtotal < 999 && (
                    <p className="text-xs sm:text-sm text-primary-600 bg-primary-50 p-2 rounded">
                      Add {formatPrice(999 - subtotal)} more for free shipping!
                    </p>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary-600">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full btn btn-primary py-3 text-sm sm:text-base"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => router.push("/products")}
                  className="w-full btn btn-outline mt-3 text-sm sm:text-base"
                >
                  Continue Shopping
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
