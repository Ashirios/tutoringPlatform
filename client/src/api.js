export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:3005";

export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("jwt");

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
