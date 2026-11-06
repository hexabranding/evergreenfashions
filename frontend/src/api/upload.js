import { api } from "./client";

export const uploadApi = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const token = localStorage.getItem("ef_token");

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  },

  uploadMultiple: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const token = localStorage.getItem("ef_token");

    const res = await fetch(`${API_BASE}/upload/multiple`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  },
};
