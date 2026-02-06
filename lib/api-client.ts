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
};

// Product APIs
export const productApi = {
  getAll: (params?: any) => apiClient.get("/api/products", { params }),
  getById: (id: string) => apiClient.get(`/api/products/${id}`),
  getBySlug: (slug: string) => apiClient.get(`/api/products/slug/${slug}`),
  create: (data: any) => apiClient.post("/api/products", data),
  update: (id: string, data: any) => apiClient.put(`/api/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/products/${id}`),
};

// Order APIs
export const orderApi = {
  create: (data: any) => apiClient.post("/api/orders", data),
  getAll: (params?: any) => apiClient.get("/api/orders", { params }),
  getById: (id: string) => apiClient.get(`/api/orders/${id}`),
  updateStatus: (id: string, data: any) =>
    apiClient.patch(`/api/orders/${id}`, data),
};

// Admin APIs
export const adminApi = {
  getOrders: (params?: any) => apiClient.get("/api/admin/orders", { params }),
};

// Address APIs
export const addressApi = {
  getAll: () => apiClient.get("/api/addresses"),
  create: (data: any) => apiClient.post("/api/addresses", data),
};

// Payment APIs
export const paymentApi = {
  createOrder: (orderId: string) =>
    apiClient.post("/api/payments/create", { orderId }),
  verify: (data: any) => apiClient.post("/api/payments/verify", data),
};

export default apiClient;
