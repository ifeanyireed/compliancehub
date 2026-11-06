export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("compliancehub_token") || "demo-token-business";
  }
  return "demo-token-business";
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

export const getActiveTenantID = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("compliancehub_tenant_id") || "55555555-5555-5555-5555-555555555501";
  }
  return "55555555-5555-5555-5555-555555555501";
};

export const setActiveTenantID = (tenantId: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("compliancehub_tenant_id", tenantId);
  }
};

export const getActiveRole = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("compliancehub_role") || "BUSINESS";
  }
  return "BUSINESS";
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
  const tenantId = getActiveTenantID();
  const role = getActiveRole();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (tenantId) {
    headers.set("X-Tenant-ID", tenantId);
  }
  if (role) {
    headers.set("X-Demo-Role", role);
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
  // Generic methods
  get: (endpoint: string) => apiFetch(endpoint, { method: "GET" }),
  post: (endpoint: string, body: any) => apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => apiFetch(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint: string) => apiFetch(endpoint, { method: "DELETE" }),
  upload: (endpoint: string, formData: FormData) => apiFetch(endpoint, { method: "POST", body: formData }),

  // Auth & Tenants
  auth: {
    login: (body: { email: string; password: string }) => apiFetch("/v1/auth/login", { method: "POST", body: JSON.stringify(body) }),
    register: (body: any) => apiFetch("/v1/auth/register", { method: "POST", body: JSON.stringify(body) }),
    getMe: () => apiFetch("/v1/auth/me", { method: "GET" }),
  },

  tenants: {
    getCurrent: () => apiFetch("/v1/tenants/current", { method: "GET" }),
  },

  // HubCalendar: Statutory Deadlines
  calendar: {
    getObligations: (params?: { authority?: string; status?: string }) => {
      let query = "";
      if (params) {
        const q = new URLSearchParams();
        if (params.authority && params.authority !== "All") q.set("authority", params.authority);
        if (params.status && params.status !== "All") q.set("status", params.status);
        const str = q.toString();
        if (str) query = `?${str}`;
      }
      return apiFetch(`/v1/calendar/obligations${query}`, { method: "GET" });
    },
    createObligation: (body: { title: string; authority: string; due_date: string; estimated_penalty_ngn?: number; is_urgent?: boolean }) =>
      apiFetch("/v1/calendar/obligations", { method: "POST", body: JSON.stringify(body) }),
    completeObligation: (id: string, body?: { evidence_doc_id?: string; notes?: string }) =>
      apiFetch(`/v1/calendar/obligations/${id}/complete`, { method: "POST", body: JSON.stringify(body || {}) }),
  },

  // HubDocs: Cloudinary Evidence Vault
  documents: {
    list: (category?: string) => {
      const query = category && category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
      return apiFetch(`/v1/documents${query}`, { method: "GET" });
    },
    getUploadSignature: (fileName: string, category: string) =>
      apiFetch("/v1/documents/upload-signature", { method: "POST", body: JSON.stringify({ file_name: fileName, category }) }),
    register: (body: {
      name: string;
      category: string;
      cloudinary_public_id: string;
      cloudinary_secure_url: string;
      file_format: string;
      file_size_bytes: number;
      expiry_date?: string;
      version?: string;
    }) => apiFetch("/v1/documents", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch(`/v1/documents/${id}`, { method: "DELETE" }),

    // Direct Browser Upload to Cloudinary
    uploadToCloudinary: async (file: File, category: string) => {
      // 1. Get signed signature from Go backend
      const sigData = await api.documents.getUploadSignature(file.name, category);
      if (!sigData || !sigData.signature) {
        throw new Error("Failed to obtain Cloudinary upload signature from backend");
      }

      // 2. Upload file directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.api_key);
      formData.append("timestamp", String(sigData.timestamp));
      formData.append("signature", sigData.signature);
      formData.append("folder", sigData.folder);
      formData.append("public_id", sigData.public_id);

      const cloudName = sigData.cloud_name || "yugcjpau";
      const cldResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (!cldResponse.ok) {
        const errText = await cldResponse.text();
        throw new Error(`Cloudinary upload failed: ${errText}`);
      }

      const cldResult = await cldResponse.json();

      // 3. Register document in Neon DB
      const regResult = await api.documents.register({
        name: file.name,
        category,
        cloudinary_public_id: cldResult.public_id,
        cloudinary_secure_url: cldResult.secure_url,
        file_format: cldResult.format || file.name.split(".").pop() || "pdf",
        file_size_bytes: cldResult.bytes || file.size,
      });

      return {
        ...cldResult,
        dbRecord: regResult,
      };
    },
  },

  // Practice & Marketplace
  practice: {
    getClients: () => apiFetch("/v1/practice/clients", { method: "GET" }),
    getTasks: () => apiFetch("/v1/practice/tasks", { method: "GET" }),
    getExperts: (specialisation?: string) => {
      const query = specialisation && specialisation !== "All" ? `?specialisation=${encodeURIComponent(specialisation)}` : "";
      return apiFetch(`/v1/professionals${query}`, { method: "GET" });
    },
    revokeEngagement: (engagementId: string) =>
      apiFetch(`/v1/engagements/${engagementId}/revoke`, { method: "POST", body: JSON.stringify({}) }),
  },

  // Workforce
  people: {
    getEmployees: () => apiFetch("/v1/people/employees", { method: "GET" }),
    createEmployee: (body: any) => apiFetch("/v1/people/employees", { method: "POST", body: JSON.stringify(body) }),
  },
  vendors: {
    getVendors: () => apiFetch("/v1/vendors", { method: "GET" }),
    createVendor: (body: any) => apiFetch("/v1/vendors", { method: "POST", body: JSON.stringify(body) }),
  },

  // Specialist
  specialist: {
    getAMLCases: () => apiFetch("/v1/aml/cases", { method: "GET" }),
    createAMLCase: (body: any) => apiFetch("/v1/aml/cases", { method: "POST", body: JSON.stringify(body) }),
    getPrivacyActivities: () => apiFetch("/v1/privacy/ropa", { method: "GET" }),
    createPrivacyActivity: (body: any) => apiFetch("/v1/privacy/ropa", { method: "POST", body: JSON.stringify(body) }),
  },

  // Onboarding
  onboarding: {
    classify: (data: {
      business_name: string;
      rc_number: string;
      industry: string;
      state: string;
      employee_count: string;
      collects_personal_data: boolean;
      processes_payments: boolean;
      is_dnfbp: boolean;
      engages_vendors: boolean;
      operates_branches: boolean;
      service_preference?: string;
    }) => apiFetch("/v1/onboarding/classify", { method: "POST", body: JSON.stringify(data) }),
  },
};
