import { api } from "./client";

export const productsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/products${query ? `?${query}` : ""}`);
  },
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getStock: (id) => api.get(`/products/${id}/stock`),
  updateStock: (id, stock) => api.put(`/products/${id}/stock`, { stock }),
};
