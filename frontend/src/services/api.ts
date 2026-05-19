import { API_URL } from "@/src/lib/apiBase";

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || "API request failed");
  }

  return response.json();
}
