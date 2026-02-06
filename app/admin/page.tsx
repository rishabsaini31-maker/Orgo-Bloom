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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-primary-600">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.pendingOrders}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatPrice(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.totalProducts}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-xl font-bold mb-2">Site Settings</h3>
            <p className="text-primary-100">
              Manage home page video and other site configurations
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
          >
            Go to Settings
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order Number</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">{order.user.name}</td>
                    <td className="py-3 px-4 font-bold">
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
        ) : (
          <p className="text-center py-12 text-gray-500">No orders yet</p>
        )}
      </div>
    </div>
  );
}
