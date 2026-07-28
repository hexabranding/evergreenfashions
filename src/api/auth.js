import { api, setToken } from "./client";

export const authApi = {
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    setToken(res.token);
    return res;
  },
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setToken(res.token);
    return res;
  },
  requestPhoneOtp: (phone) => api.post("/auth/phone-otp/request", { phone }),
  verifyPhoneOtp: async (phone, otp) => {
    const res = await api.post("/auth/phone-otp/verify", { phone, otp });
    setToken(res.token);
    return res;
  },
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/me", data),
  addAddress: (address) => api.post("/auth/me/addresses", address),
  removeAddress: (id) => api.delete(`/auth/me/addresses/${id}`),
  logout: () => setToken(null),
};
