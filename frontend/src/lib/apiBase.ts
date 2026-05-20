const DEFAULT_API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://match-your-club.onrender.com"
    : "http://localhost:4000";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || DEFAULT_API_BASE;

export const API_URL = `${API_BASE}/api`;
