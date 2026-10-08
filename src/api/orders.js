import { api } from "./client";

export const ordersApi = {
  create: (data) => api.post("/orders", data),
  getUserOrders: () => api.get("/orders"),
  getAdminOrders: () => api.get("/orders/admin"),
  getVendorOrders: () => api.get("/orders/vendor"),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updateRentalStatus: (id, rentalStatus) => api.put(`/orders/${id}/status`, { rentalStatus }),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  returnOrder: (id, reason, photos = []) => api.post(`/orders/${id}/return`, { reason, photos }),
  uploadReturnPhotos: (id, photos) => api.post(`/orders/${id}/return-photos`, { photos }),
  confirmReturn: (id) => api.post(`/orders/${id}/confirm-return`),
  inspectOrder: (id, inspectionStatus, notes) => api.post(`/orders/${id}/inspect`, { inspectionStatus, notes }),
  refundDeposit: (id, amount) => api.post(`/orders/${id}/refund-deposit`, { amount }),
};
