"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { addressApi, orderApi, paymentApi } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, clearCart, removeItem, getTotalPrice } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  
  // Check if user is authenticated via NextAuth OR the local store
  const isUserAuthenticated =
    status === "authenticated" || isAuthenticated;
  const currentUser =
    session?.user || user;
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");
  const [loading, setLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<
    "economy" | "standard" | "express"
  >("economy");
  const [shippingCost, setShippingCost] = useState(0);
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || "",
    phone: (currentUser as any)?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const subtotal = getTotalPrice();
  const total = subtotal + shippingCost;

  const calculateShippingCost = useCallback(() => {
    // For now, always use economy pricing (₹100 base)
    // In future: Express will be ₹150-200, Standard ₹120-150
    setShippingCost(100);
  }, []);

  useEffect(() => {
    calculateShippingCost();
  }, [calculateShippingCost]);

  const loadRazorpayScript = useCallback(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await addressApi.getAll();
      setAddresses(response.data.addresses);

      const defaultAddress = response.data.addresses.find(
        (addr: any) => addr.isDefault,
      );
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }, []);

  useEffect(() => {
    // Wait for session to load first
    if (status === "loading") {
      return;
    }

    // Check if user is authenticated
    if (!isUserAuthenticated) {
      router.push("/login");
      return;
    }

    if (items.length === 0) {
      router.push("/cart");
      return;
    }

    fetchAddresses();
    loadRazorpayScript();
  }, [
    status,
    isUserAuthenticated,
    items.length,
    router,
    fetchAddresses,
    loadRazorpayScript,
  ]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await addressApi.create(formData);
      setAddresses([...addresses, response.data.address]);
      setSelectedAddress(response.data.address.id);
      setShowAddressForm(false);
      toast.success("Address added successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    // Validate that cart doesn't have temp/invalid product IDs
    const invalidItems = items.filter(
      (item) =>
        !item.productId ||
        item.productId.startsWith("temp-") ||
        item.productId.length < 10, // Real Prisma IDs are longer
    );

    if (invalidItems.length > 0) {
      toast.error(
        "Your cart contains invalid items. Please refresh and re-add products.",
      );
      invalidItems.forEach((item) => removeItem(item.productId));
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderResponse = await orderApi.create({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          weight: item.weight,
        })),
        shippingAddressId: selectedAddress,
      });

      const order = orderResponse.data.order;

      if (paymentMethod === "COD") {
        // Cash on Delivery - Order placed successfully
        clearCart();
        toast.success("Order placed successfully! Pay on delivery.");
        router.push(`/dashboard`);
      } else {
        // UPI/Online Payment - Create Razorpay order
        const paymentResponse = await paymentApi.createOrder(order.id);
        const { razorpayOrderId, amount, currency, keyId } =
          paymentResponse.data;

        // Open Razorpay checkout
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: "Orgobloom",
          description: `Order ${order.orderNumber}`,
          order_id: razorpayOrderId,
          handler: async function (response: any) {
            try {
              await paymentApi.verify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              clearCart();
              toast.success("Payment successful!");
              router.push(`/dashboard`);
            } catch (error) {
              toast.error("Payment verification failed");
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone || "",
          },
          theme: {
            color: "#16a34a",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.response?.data?.error || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                  Delivery Address
                </h2>

                {addresses.length > 0 && !showAddressForm ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddress === address.id
                            ? "border-primary-600 bg-primary-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddress === address.id}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            className="mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm sm:text-base">
                              {address.fullName}
                            </span>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              {address.addressLine1},{" "}
                              {address.addressLine2 &&
                                `${address.addressLine2}, `}
                              {address.city}, {address.state} -{" "}
                              {address.pincode}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Phone: {address.phone}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}

                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-primary-600 hover:text-primary-700 font-semibold text-sm sm:text-base"
                    >
                      + Add New Address
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleAddAddress}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                          className="input text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="input text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.addressLine1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressLine1: e.target.value,
                          })
                        }
                        className="input text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.addressLine2}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressLine2: e.target.value,
                          })
                        }
                        className="input text-sm sm:text-base"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="input text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="input text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                          Pincode
                        </label>
                        <input
                          type="text"
                          required
                          pattern="[0-9]{6}"
                          value={formData.pincode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pincode: e.target.value,
                            })
                          }
                          className="input text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary text-sm sm:text-base"
                      >
                        Save Address
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="btn btn-secondary text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                  Order Items
                </h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-2"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm sm:text-base">
                          {item.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {item.weight} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-sm sm:text-base">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Options */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                  Delivery Options
                </h2>
                <div className="space-y-3">
                  {/* Express - Coming Soon */}
                  <button
                    disabled
                    className="block w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg cursor-not-allowed opacity-60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-sm sm:text-base text-gray-600">
                          Express Delivery
                        </span>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          2-3 days
                        </p>
                      </div>
                      <span className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="badge badge-warning">Coming Soon</span>
                      </span>
                    </div>
                  </button>

                  {/* Standard - Coming Soon */}
                  <button
                    disabled
                    className="block w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg cursor-not-allowed opacity-60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-sm sm:text-base text-gray-600">
                          Standard Delivery
                        </span>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          5-7 days
                        </p>
                      </div>
                      <span className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="badge badge-warning">Coming Soon</span>
                      </span>
                    </div>
                  </button>

                  {/* Economy - Available */}
                  <label
                    className={`block p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedShipping === "economy"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            value="economy"
                            checked={selectedShipping === "economy"}
                            onChange={(e) =>
                              setSelectedShipping(
                                e.target.value as
                                  | "economy"
                                  | "standard"
                                  | "express",
                              )
                            }
                            className="mt-1 flex-shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-sm sm:text-base">
                              Economy Delivery
                            </span>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              7-10 days • Budget-friendly
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-sm sm:text-base text-primary-600">
                          ₹100
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label
                    className={`block p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "UPI"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="UPI"
                        checked={paymentMethod === "UPI"}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as "UPI" | "COD")
                        }
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-sm sm:text-base">
                          UPI / Online Payment
                        </span>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          Pay securely using UPI, Cards, Net Banking, or Wallets
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`block p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "COD"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as "UPI" | "COD")
                        }
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-sm sm:text-base">
                          Cash on Delivery
                        </span>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          Pay when you receive the order
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">
                      {formatPrice(shippingCost)}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary-600">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || !selectedAddress}
                  className="w-full btn btn-primary py-3"
                >
                  {loading
                    ? "Processing..."
                    : paymentMethod === "COD"
                      ? "Place Order (Pay on Delivery)"
                      : "Proceed to Payment"}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  By placing your order, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
