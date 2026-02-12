"use client";

import axios from "axios";

const apiClient = axios.create({
  baseURL: "/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
  }
  return config;
});

// Auth APIs
export const authApi = {
  register: (data: any) => apiClient.post("/api/auth/register", data),
  login: (data: any) => apiClient.post("/api/auth/login", data),
  me: () => apiClient.get("/api/auth/me"),
  forgotPassword: (data: { email: string }) =>
    apiClient.post("/api/auth/forgot-password", data),
  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post("/api/auth/reset-password", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post("/api/auth/change-password", data),
  verifyEmail: (data: { token: string }) =>
    apiClient.post("/api/auth/verify-email", data),
  resendVerificationEmail: (data: { email: string }) =>
    apiClient.get(`/api/auth/verify-email?email=${data.email}`),
  logoutAll: () => apiClient.post("/api/auth/logout-all"),
};

// Profile APIs
export const profileApi = {
  get: () => apiClient.get("/api/profile"),
  update: (data: any) => apiClient.patch("/api/profile", data),
};

// Product APIs
export const productApi = {
  getAll: (params?: any) => apiClient.get("/api/products", { params }),
  getById: (id: string) => apiClient.get(`/api/products/${id}`),
  getBySlug: (slug: string) => apiClient.get(`/api/products/slug/${slug}`),
  create: (data: any) => apiClient.post("/api/products", data),
  update: (id: string, data: any) => apiClient.put(`/api/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/products/${id}`),

  // Advanced search with filters
  search: (params?: any) => apiClient.get("/api/products/search", { params }),

  // Reviews
  getReviews: (id: string, params?: any) =>
    apiClient.get(`/api/products/${id}/reviews`, { params }),
  createReview: (id: string, data: any) =>
    apiClient.post(`/api/products/${id}/reviews`, data),
  markReviewHelpful: (id: string, helpful: boolean) =>
    apiClient.patch(`/api/products/${id}/reviews/helpful`, { helpful }),

  // Recommendations
  getRecommendations: (id: string, type?: string, limit?: number) =>
    apiClient.get(`/api/products/${id}/recommendations`, {
      params: { type, limit },
    }),

  // Gallery
  getGallery: (id: string) => apiClient.get(`/api/products/${id}/gallery`),
  addGalleryImage: (id: string, data: any) =>
    apiClient.post(`/api/products/${id}/gallery`, data),
  updateGalleryImage: (id: string, imageId: string, order: number) =>
    apiClient.patch(`/api/products/${id}/gallery/${imageId}`, { order }),
  deleteGalleryImage: (id: string, imageId: string) =>
    apiClient.delete(`/api/products/${id}/gallery/${imageId}`),

  // Stock
  getStock: (id: string) => apiClient.get(`/api/products/${id}/stock`),
  createStockAlert: (id: string) => apiClient.post(`/api/products/${id}/stock`),
};

// Order APIs
export const orderApi = {
  create: (data: any) => apiClient.post("/api/orders", data),
  getAll: (params?: any) => apiClient.get("/api/orders", { params }),
  getById: (id: string) => apiClient.get(`/api/orders/${id}`),
  updateStatus: (id: string, data: any) =>
    apiClient.patch(`/api/orders/${id}`, data),
  cancel: (id: string, reason?: string) =>
    apiClient.post(`/api/orders/${id}/cancel`, { reason }),
  getHistory: (id: string) => apiClient.get(`/api/orders/${id}/history`),
  downloadInvoice: (id: string) =>
    apiClient.get(`/api/orders/${id}/invoice`, { responseType: "blob" }),
  requestRefund: (id: string, reason: string) =>
    apiClient.post(`/api/orders/${id}/refund`, { reason }),
  getRefund: (id: string) => apiClient.get(`/api/orders/${id}/refund`),
};

// Admin APIs
export const adminApi = {
  // Orders
  getOrders: (params?: any) => apiClient.get("/api/admin/orders", { params }),

  // Users
  getUsers: (params?: any) => apiClient.get("/api/admin/users", { params }),
  blockUser: (id: string, action: "BLOCK" | "UNBLOCK", reason?: string) =>
    apiClient.patch(`/api/admin/users/${id}`, { action, reason }),

  // Refunds
  getRefunds: (params?: any) => apiClient.get("/api/admin/refunds", { params }),
  processRefund: (id: string, action: "APPROVE" | "REJECT", notes?: string) =>
    apiClient.patch(`/api/admin/refunds/${id}`, { action, notes }),

  // Analytics
  getAnalytics: (period?: string) =>
    apiClient.get("/api/admin/analytics", { params: { period } }),

  // Reviews
  getReviews: (params?: any) => apiClient.get("/api/admin/reviews", { params }),
  approveReview: (id: string, action: "APPROVE" | "REJECT") =>
    apiClient.patch(`/api/admin/reviews/${id}`, { action }),
};

// Address APIs
export const addressApi = {
  getAll: () => apiClient.get("/api/addresses"),
  create: (data: any) => apiClient.post("/api/addresses", data),
  update: (id: string, data: any) =>
    apiClient.patch(`/api/addresses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/addresses/${id}`),
};

// Notification APIs
export const notificationApi = {
  getAll: (params?: any) => apiClient.get("/api/notifications", { params }),
  markAsRead: (id: string) => apiClient.patch(`/api/notifications/${id}`),
  delete: (id: string) => apiClient.delete(`/api/notifications/${id}`),
  markAllAsRead: () => apiClient.post("/api/notifications/mark-all-read"),
  sendShippingNotification: (data: {
    orderId: string;
    trackingNumber: string;
    courierName: string;
    estimatedDelivery: string;
  }) => apiClient.post("/api/notifications/shipping", data),
  sendRefundNotification: (data: { refundId: string }) =>
    apiClient.post("/api/notifications/refund", data),
};

// Recently Viewed APIs
export const recentlyViewedApi = {
  get: () => apiClient.get("/api/recently-viewed"),
  add: (productId: string) =>
    apiClient.post("/api/recently-viewed", { productId }),
};

// Payment APIs
export const paymentApi = {
  createOrder: (orderId: string) =>
    apiClient.post("/api/payments/create", { orderId }),
  verify: (data: any) => apiClient.post("/api/payments/verify", data),
};

// Chat APIs
export const chatApi = {
  sendMessage: (data: any) => apiClient.post("/api/chat", data),
  getMessages: (sessionId: string) =>
    apiClient.get("/api/chat", { params: { sessionId } }),
};

// Help Articles / FAQ APIs
export const helpArticleApi = {
  getAll: (params?: any) => apiClient.get("/api/help-articles", { params }),
  getBySlug: (slug: string) => apiClient.get(`/api/help-articles/${slug}`),
  create: (data: any) => apiClient.post("/api/help-articles", data),
  update: (slug: string, data: any) =>
    apiClient.patch(`/api/help-articles/${slug}`, data),
  delete: (slug: string) => apiClient.delete(`/api/help-articles/${slug}`),
};

// Shipping APIs
export const shippingApi = {
  calculateShipping: (data: any) =>
    apiClient.post("/api/shipping/calculate", data),
  getShippingZones: () => apiClient.get("/api/shipping/calculate"),
};

// Returns/Refunds APIs
export const returnsApi = {
  create: (data: any) => apiClient.post("/api/returns", data),
  getAll: (params?: any) => apiClient.get("/api/returns", { params }),
  updateStatus: (refundId: string, data: any) =>
    apiClient.patch(`/api/returns/${refundId}`, data),
  getById: (refundId: string) => apiClient.get(`/api/returns/${refundId}`),
};

export default apiClient;
