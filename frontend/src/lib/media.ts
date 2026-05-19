import { API_BASE } from "./apiBase";

export const mediaUrl = (value?: string | null, apiBaseUrl = API_BASE) => {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  return `${apiBaseUrl}/${value}`.replace(/\\/g, "/");
};
