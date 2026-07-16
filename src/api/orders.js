import { api } from "./client";

export const ordersApi = {
  create: (data) => api.post("/orders", data),
  getUserOrders: () => api.get("/orders"),
  getVendorOrders: () => api.get("/orders/vendor"),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  returnOrder: (id) => api.post(`/orders/${id}/return`),
};
