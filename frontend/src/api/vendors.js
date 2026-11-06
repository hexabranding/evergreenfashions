import { api } from "./client";

export const vendorsApi = {
  getAll: () => api.get("/vendors"),
  getById: (id) => api.get(`/vendors/${id}`),
  getStats: (id) => api.get(`/vendors/${id}/stats`),
  updateCommission: (id, commission) => api.put(`/vendors/${id}/commission`, { commission }),
  requestPayout: (id) => api.post(`/vendors/${id}/payout`),
};
