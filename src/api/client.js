const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let authToken = localStorage.getItem("ef_token") || null;

export function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem("ef_token", token);
  else localStorage.removeItem("ef_token");
}

export function getToken() {
  return authToken;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const controller = new AbortController();
  const requestTimeout = window.setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetch(url, { ...options, headers, signal: controller.signal });
  } finally {
    window.clearTimeout(requestTimeout);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};
