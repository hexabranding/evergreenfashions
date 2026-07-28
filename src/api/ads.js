import { api } from "./client";

export const adsApi = {
  getAll: () => api.get("/ads"),
  getActive: () => api.get("/ads?active=true"),
  getForVendor: (vendorId) => api.get(`/ads/vendor/${vendorId}`),
  create: (ad) => api.post("/ads", ad),
  update: (id, ad) => api.put(`/ads/${id}`, ad),
  remove: (id) => api.delete(`/ads/${id}`),
};
