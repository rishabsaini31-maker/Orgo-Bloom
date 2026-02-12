"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { orderApi } from "@/lib/api-client";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await orderApi.getAll({ page: 1, limit: 10 });
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") return;

    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Fetch orders if authenticated
    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router, fetchOrders]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      CONFIRMED: "bg-purple-100 text-purple-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="bg-primary-600 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-primary-100">
              Welcome back, {session?.user?.name || "User"}!
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-primary-600">
                {orders.length}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm mb-2">Active Orders</h3>
              <p className="text-3xl font-bold text-blue-600">
                {
                  orders.filter(
                    (o) => !["DELIVERED", "CANCELLED"].includes(o.status),
                  ).length
                }
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm mb-2">Completed Orders</h3>
              <p className="text-3xl font-bold text-green-600">
                {orders.filter((o) => o.status === "DELIVERED").length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all"
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-gray-900">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ml-2 ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-gray-100">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Items
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {order.items.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Total
                        </p>
                        <p className="text-lg font-semibold text-primary-600">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Shipping
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(order.shippingCost || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Quantity
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {order.items.reduce(
                            (sum: number, item: any) => sum + item.quantity,
                            0,
                          )}{" "}
                          units
                        </p>
                      </div>
                    </div>

                    {/* Shipping Address Preview */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-1">
                        Shipping to
                      </p>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {order.shippingAddress.fullName}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}
                      </p>
                    </div>

                    {/* Tracking Info */}
                    {order.trackingNumber && order.status === "SHIPPED" && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium mb-1">
                          📦 Tracking Number
                        </p>
                        <p className="text-sm font-mono font-semibold text-blue-700">
                          {order.trackingNumber}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="btn btn-primary text-xs sm:text-sm py-2 px-4 flex-1"
                      >
                        Track Order
                      </Link>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `Order #${order.orderNumber}`,
                          );
                          toast.success("Order ID copied!");
                        }}
                        className="btn btn-outline text-xs sm:text-sm py-2 px-3"
                        title="Copy Order ID"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No orders yet</p>
                <Link href="/products" className="btn btn-primary">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
