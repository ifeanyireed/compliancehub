export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("compliancehub_token");
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("compliancehub_token", token);
  }
};

export const clearAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("compliancehub_token");
  }
};

const getApiBaseUrl = () => {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
  if (!baseUrl.endsWith("/api")) {
    baseUrl = baseUrl.replace(/\/$/, "") + "/api";
  }
  return baseUrl;
};

const API_BASE_URL = getApiBaseUrl();

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json().catch(() => ({ message: "Unknown JSON error" }));
        errorMessage = error.message || error.error || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (err) {
    console.warn(`[ComplianceHub API] Mock fallback activated for ${endpoint}:`, err);
    return null;
  }
}

export const api = {
  get: (endpoint: string) => apiFetch(endpoint, { method: "GET" }),
  post: (endpoint: string, body: any) => apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => apiFetch(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint: string) => apiFetch(endpoint, { method: "DELETE" }),
  upload: (endpoint: string, formData: FormData) => apiFetch(endpoint, { method: "POST", body: formData }),
};
