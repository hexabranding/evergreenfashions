import { api } from "./client";

export const ordersApi = {
  create: (data) => api.post("/orders", data),
  getUserOrders: () => api.get("/orders"),
  getAdminOrders: () => api.get("/orders/admin"),
  getVendorOrders: () => api.get("/orders/vendor"),
  updateStatus: (id, statusOrPayload) => {
    const payload = typeof statusOrPayload === "string" ? { status: statusOrPayload } : statusOrPayload;
    return api.put(`/orders/${id}/status`, payload);
  },
  updateRentalStatus: (id, rentalStatusOrPayload) => {
    const payload = typeof rentalStatusOrPayload === "string"
      ? { rentalStatus: rentalStatusOrPayload }
      : { rentalStatus: rentalStatusOrPayload.rentalStatus || rentalStatusOrPayload.status, ...rentalStatusOrPayload };
    return api.put(`/orders/${id}/status`, payload);
  },
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  returnOrder: (id, reason, photos = []) => api.post(`/orders/${id}/return`, { reason, photos }),
  uploadReturnPhotos: (id, photos) => api.post(`/orders/${id}/return-photos`, { photos }),
  confirmReturn: (id) => api.post(`/orders/${id}/confirm-return`),
  completeRefund: (id) => api.post(`/orders/${id}/complete-refund`),
  inspectOrder: (id, inspectionStatus, notes) => api.post(`/orders/${id}/inspect`, { inspectionStatus, notes }),
  refundDeposit: (id, amount) => api.post(`/orders/${id}/refund-deposit`, { amount }),
  requestConfirmOtp: (id) => api.post(`/orders/${id}/confirm-otp/request`),
  verifyConfirmOtp: (id, otp) => api.post(`/orders/${id}/confirm-otp/verify`, { otp }),
};
