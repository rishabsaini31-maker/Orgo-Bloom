"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi, orderApi } from "@/lib/api-client";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "",
    trackingNumber: "",
    notes: "",
  });

  const fetchOrders = useCallback(async () => {
    try {
      const params: any = { page: 1, limit: 50 };
      if (filter) params.status = filter;

      const response = await adminApi.getOrders(params);
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) return;

    try {
      await orderApi.updateStatus(selectedOrder.id, updateData);
      toast.success("Order updated successfully");
      setShowModal(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update order");
    }
  };

  const openUpdateModal = (order: any) => {
    setSelectedOrder(order);
    setUpdateData({
      status: order.status,
      trackingNumber: order.trackingNumber || "",
      notes: order.notes || "",
    });
    setShowModal(true);
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
      <h1 className="text-3xl font-bold mb-8">Orders Management</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order #</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p>{order.user.name}</p>
                        <p className="text-sm text-gray-600">
                          {order.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4">{order.items.length}</td>
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
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openUpdateModal(order)}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-12 text-gray-500">No orders found</p>
        )}
      </div>

      {/* Update Order Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Update Order #{selectedOrder.orderNumber}
            </h2>

            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Order Status
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, status: e.target.value })
                  }
                  className="input"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={updateData.trackingNumber}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      trackingNumber: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={updateData.notes}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, notes: e.target.value })
                  }
                  className="input min-h-[80px]"
                  placeholder="Add notes for customer"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Order Items:</h3>
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="text-sm mb-1">
                    {item.product.name} x {item.quantity} -{" "}
                    {formatPrice(item.price * item.quantity)}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Update Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
