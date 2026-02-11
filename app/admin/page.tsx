"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi, productApi } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        adminApi.getOrders({ page: 1, limit: 5 }),
        productApi.getAll({ page: 1, limit: 1 }),
      ]);

      const orders = ordersResponse.data.orders;
      const totalOrders = ordersResponse.data.pagination.total;
      const pendingOrders = orders.filter(
        (o: any) => !["DELIVERED", "CANCELLED"].includes(o.status),
      ).length;
      const totalRevenue = orders.reduce(
        (sum: number, o: any) =>
          o.paymentStatus === "COMPLETED" ? sum + o.total : sum,
        0,
      );

      setStats({
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalProducts: productsResponse.data.pagination.total,
      });

      setRecentOrders(orders);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8">
        Dashboard Overview
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">
            Total Orders
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-primary-600">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">
            Pending Orders
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
            {stats.pendingOrders}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">
            Total Revenue
          </h3>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
            {formatPrice(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">
            Total Products
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">
            {stats.totalProducts}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
              Site Settings
            </h3>
            <p className="text-xs sm:text-sm text-primary-100">
              Manage home page video and other site configurations
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="bg-white text-primary-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-primary-50 transition text-sm sm:text-base w-full sm:w-auto text-center"
          >
            Go to Settings
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          Recent Orders
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : recentOrders.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Order Number
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Total
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-sm">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-sm">{order.user.name}</td>
                      <td className="py-3 px-4 font-bold text-sm">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 space-y-2 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500">Order Number</p>
                      <p className="font-semibold text-sm">
                        {order.orderNumber}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm">{order.user.name}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-bold text-sm">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Payment</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${order.paymentStatus === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center py-12 text-gray-500">No orders yet</p>
        )}
      </div>
    </div>
  );
}
