"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

interface AnalyticsData {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    pendingOrders: number;
  };
  ordersByStatus: Array<{
    status: string;
    _count: { status: number };
  }>;
  revenueByDay: Array<{
    date: string;
    order_count: number;
    revenue: number;
  }>;
  topProducts: Array<{
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
      price: number;
    };
    totalSold: number;
    orderCount: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/analytics?period=${period}`);

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error || data.message || "Failed to fetch analytics";
        console.error("[Analytics Error]", errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      setAnalytics(data);
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      const errorMessage = err.message || "Failed to load analytics";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (status === "authenticated") {
      fetchAnalytics();
    }
  }, [status, period, router, fetchAnalytics]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-left">
              <p className="font-semibold text-blue-900 mb-2">
                How to fix this:
              </p>
              <ol className="list-decimal list-inside text-blue-800 space-y-2">
                <li>Open your browser console (F12 or Cmd+Option+J)</li>
                <li>
                  Paste this command:
                  <code className="bg-blue-100 px-2 py-1 rounded block mt-1">
                    {`fetch('/api/admin/setup', {\n  method: 'POST',\n  headers: {\n    'x-setup-secret': 'dev-setup-123'\n  }\n}).then(r => r.json()).then(d => console.log(d))`}
                  </code>
                </li>
                <li>Press Enter and refresh the page</li>
              </ol>
            </div>

            <button
              onClick={() => {
                router.push("/admin/login");
              }}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 mb-2"
            >
              Back to Admin Login
            </button>

            <button
              onClick={fetchAnalytics}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Revenue",
      value: `₹${analytics.overview.totalRevenue.toLocaleString()}`,
      icon: "💰",
      color: "bg-green-50 border-green-200",
    },
    {
      label: "Total Orders",
      value: analytics.overview.totalOrders,
      icon: "📦",
      color: "bg-blue-50 border-blue-200",
    },
    {
      label: "Total Customers",
      value: analytics.overview.totalCustomers,
      icon: "👥",
      color: "bg-purple-50 border-purple-200",
    },
    {
      label: "Pending Orders",
      value: analytics.overview.pendingOrders,
      icon: "⏳",
      color: "bg-yellow-50 border-yellow-200",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">Track your business performance</p>
            </div>
            <Link
              href="/admin"
              className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
            >
              ← Back to Admin
            </Link>
          </div>

          {/* Period Filter */}
          <div className="flex gap-2">
            {[
              { label: "Last 7 Days", value: "7" },
              { label: "Last 30 Days", value: "30" },
              { label: "Last 90 Days", value: "90" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  period === option.value
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-primary-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`border rounded-lg p-6 ${stat.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-gray-600 text-sm">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Orders by Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Orders by Status</h2>
            <div className="space-y-3">
              {analytics.ordersByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        STATUS_COLORS[item.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-gray-600">
                      {item._count.status} order
                      {item._count.status !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {(
                      (item._count.status / analytics.overview.totalOrders) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Revenue Summary</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-bold text-gray-900">
                    ₹{analytics.overview.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Average Order Value</span>
                  <span className="font-bold text-gray-900">
                    ₹
                    {(
                      analytics.overview.totalRevenue /
                      analytics.overview.totalOrders
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Revenue Per Customer</span>
                  <span className="font-bold text-gray-900">
                    ₹
                    {(
                      analytics.overview.totalRevenue /
                      analytics.overview.totalCustomers
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Product
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Units Sold
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Orders
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/products/${item.product.name.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {item.product.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-medium">
                      {item.totalSold}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {item.orderCount}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      ₹{item.product.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-medium">
                      ₹{(item.totalSold * item.product.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">
            Recent Revenue ({period} days)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Orders
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.revenueByDay.map((day, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(day.date).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-medium">
                      {day.order_count}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-medium">
                      ₹{day.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
