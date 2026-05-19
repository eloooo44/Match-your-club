export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:4000";

export const API_URL = `${API_BASE}/api`;
