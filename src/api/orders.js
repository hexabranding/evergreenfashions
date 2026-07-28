import { api } from "./client";

export const ordersApi = {
  create: (data) => api.post("/orders", data),
  getUserOrders: () => api.get("/orders"),
  getAdminOrders: () => api.get("/orders/admin"),
  getVendorOrders: () => api.get("/orders/vendor"),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  returnOrder: (id) => api.post(`/orders/${id}/return`),
};
