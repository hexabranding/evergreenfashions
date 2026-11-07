import { api } from "./client";

export const reviewsApi = {
  getAll: () => api.get("/reviews"),
  getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
  add: (data) => api.post("/reviews", data),
  reply: (id, reply) => api.put(`/reviews/${id}/reply`, { reply }),
};
