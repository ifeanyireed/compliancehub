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
    console.error(`[ComplianceHub API] Request failed for ${endpoint}:`, err);
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
    forgotPassword: (body: { email: string }) => apiFetch("/v1/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
    resetPassword: (body: { token: string; new_password: string }) => apiFetch("/v1/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
    getMe: () => apiFetch("/v1/auth/me", { method: "GET" }),
  },

  tenants: {
    getCurrent: () => apiFetch("/v1/tenants/current", { method: "GET" }),
    updateCurrent: (body: any) => apiFetch("/v1/tenants/current", { method: "PATCH", body: JSON.stringify(body) }),
    list: () => apiFetch("/v1/tenants", { method: "GET" }),
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
    createClient: (body: { legal_name: string; rc_number?: string; industry?: string; contact_email?: string; monthly_fee?: number }) =>
      apiFetch("/v1/practice/clients", { method: "POST", body: JSON.stringify(body) }),
    getTasks: () => apiFetch("/v1/practice/tasks", { method: "GET" }),
    createTask: (body: { tenant_id: string; title: string; authority?: string; due_date?: string; is_urgent?: boolean }) =>
      apiFetch("/v1/practice/tasks", { method: "POST", body: JSON.stringify(body) }),
    updateTask: (taskId: string, status: string) =>
      apiFetch(`/v1/practice/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    getTeam: () => apiFetch("/v1/practice/team", { method: "GET" }),
    addTeamMember: (body: { full_name: string; email: string; role?: string; specialisation?: string; hourly_rate?: number }) =>
      apiFetch("/v1/practice/team", { method: "POST", body: JSON.stringify(body) }),
    getExperts: (specialisation?: string) => {
      const query = specialisation && specialisation !== "All" ? `?specialisation=${encodeURIComponent(specialisation)}` : "";
      return apiFetch(`/v1/professionals${query}`, { method: "GET" });
    },
    getEngagements: () => apiFetch("/v1/engagements", { method: "GET" }),
    revokeEngagement: (engagementId: string) =>
      apiFetch(`/v1/engagements/${engagementId}/revoke`, { method: "POST", body: JSON.stringify({}) }),
  },

  // Workspace Activity Trail
  activityLogs: {
    list: () => apiFetch("/v1/activity-logs", { method: "GET" }),
    create: (body: { action_type: string; details: string; actor_name?: string; actor_role?: string }) =>
      apiFetch("/v1/activity-logs", { method: "POST", body: JSON.stringify(body) }),
  },

  // Tenant Workspace Members
  tenantMembers: {
    list: () => apiFetch("/v1/tenant-members", { method: "GET" }),
    invite: (body: { full_name: string; email: string; role?: string; title?: string }) =>
      apiFetch("/v1/tenant-members", { method: "POST", body: JSON.stringify(body) }),
  },

  // Commercial & Invoices
  invoices: {
    list: () => apiFetch("/v1/invoices", { method: "GET" }),
    create: (body: { client_name: string; amount_ngn: number; invoice_type?: string; due_date?: string }) =>
      apiFetch("/v1/invoices", { method: "POST", body: JSON.stringify(body) }),
  },

  // Reports
  reports: {
    getDigest: () => apiFetch("/v1/reports/digest", { method: "GET" }),
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
    getDSARs: () => apiFetch("/v1/specialist/dsar", { method: "GET" }),
    createDSAR: (body: any) => apiFetch("/v1/specialist/dsar", { method: "POST", body: JSON.stringify(body) }),
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

  // Admin Cockpit (Requires ADMIN system role)
  admin: {
    getMetrics: () => apiFetch("/admin/metrics", { method: "GET" }),
    getUsers: () => apiFetch("/admin/users", { method: "GET" }),
    getInvoices: () => apiFetch("/admin/invoices", { method: "GET" }),
    getFilings: () => apiFetch("/admin/filings", { method: "GET" }),
  },

  // Support Operations & Tickets
  support: {
    getTickets: (params?: { status?: string; category?: string }) => {
      let query = "";
      if (params) {
        const q = new URLSearchParams();
        if (params.status && params.status !== "ALL") q.set("status", params.status);
        if (params.category && params.category !== "ALL") q.set("category", params.category);
        const str = q.toString();
        if (str) query = `?${str}`;
      }
      return apiFetch(`/support/tickets${query}`, { method: "GET" });
    },
    getTicket: (id: string) => apiFetch(`/support/tickets/${id}`, { method: "GET" }),
    createTicket: (body: any) => apiFetch("/support/tickets", { method: "POST", body: JSON.stringify(body) }),
    replyTicket: (id: string, body: { sender_name: string; sender_role: string; message: string }) =>
      apiFetch(`/support/tickets/${id}/reply`, { method: "POST", body: JSON.stringify(body) }),
    updateTicketStatus: (id: string, status: string) =>
      apiFetch(`/support/tickets/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    getKb: () => apiFetch("/support/kb", { method: "GET" }),
  },

  // Live Support Chat
  chat: {
    getSessions: () => apiFetch("/chat/sessions", { method: "GET" }),
    getMessages: (sessionId: string) => apiFetch(`/chat/messages?session_id=${sessionId}`, { method: "GET" }),
    sendMessage: (body: { session_id: string; sender_name: string; sender_role: string; message: string }) =>
      apiFetch("/chat/messages", { method: "POST", body: JSON.stringify(body) }),
  },

  // Regulatory Intelligence & Editorial Blog CMS
  blog: {
    getPosts: async (params?: { category?: string; status?: string; search?: string; tag?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.category && params.category !== "ALL" && params.category !== "All") q.set("category", params.category);
      if (params?.status && params.status !== "ALL") q.set("status", params.status);
      if (params?.search) q.set("search", params.search);
      if (params?.tag) q.set("tag", params.tag);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      const queryStr = q.toString() ? `?${q.toString()}` : "";

      try {
        const localRes = await fetch(`/api/blog${queryStr}`);
        if (localRes.ok) {
          const data = await localRes.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch (_) {}

      return apiFetch(`/blog${queryStr}`, { method: "GET" });
    },
    getPost: async (slugOrId: string) => {
      try {
        const localRes = await fetch(`/api/blog/${encodeURIComponent(slugOrId)}`);
        if (localRes.ok) {
          const data = await localRes.json();
          if (data && (data.title || data.id)) return data;
        }
      } catch (_) {}

      return apiFetch(`/blog/${encodeURIComponent(slugOrId)}`, { method: "GET" });
    },
    incrementView: async (slugOrId: string) => {
      try {
        const localRes = await fetch(`/api/blog/${encodeURIComponent(slugOrId)}/view`, { method: "POST" });
        if (localRes.ok) {
          const data = await localRes.json();
          if (data && typeof data.view_count === "number") return data;
        }
      } catch (_) {}

      return apiFetch(`/blog/${encodeURIComponent(slugOrId)}/view`, { method: "POST" });
    },
    createPost: (post: any) => apiFetch("/blog", { method: "POST", body: JSON.stringify(post) }),
    updatePost: (id: number | string, post: any) => apiFetch(`/blog/${id}`, { method: "PUT", body: JSON.stringify(post) }),
    deletePost: (id: number | string) => apiFetch(`/blog/${id}`, { method: "DELETE" }),
    // Categories
    getCategories: () => apiFetch("/blog/categories", { method: "GET" }),
    createCategory: (cat: { name: string; slug?: string; description?: string }) =>
      apiFetch("/blog/categories", { method: "POST", body: JSON.stringify(cat) }),
    deleteCategory: (id: number | string) => apiFetch(`/blog/categories/${id}`, { method: "DELETE" }),
    // Tags
    getTags: () => apiFetch("/blog/tags", { method: "GET" }),
    createTag: (tag: { name: string; slug?: string }) =>
      apiFetch("/blog/tags", { method: "POST", body: JSON.stringify(tag) }),
    deleteTag: (id: number | string) => apiFetch(`/blog/tags/${id}`, { method: "DELETE" }),
    // Comments
    getComments: (params?: { post_id?: number | string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.post_id) q.set("post_id", String(params.post_id));
      if (params?.status && params.status !== "ALL") q.set("status", params.status);
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return apiFetch(`/blog/comments${queryStr}`, { method: "GET" });
    },
    createComment: (comment: { post_id: number; author_name: string; author_email: string; content: string }) =>
      apiFetch("/blog/comments", { method: "POST", body: JSON.stringify(comment) }),
    updateCommentStatus: (id: number | string, status: string) =>
      apiFetch(`/blog/comments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    deleteComment: (id: number | string) => apiFetch(`/blog/comments/${id}`, { method: "DELETE" }),
    // Subscribers
    getSubscribers: () => apiFetch("/blog/subscribers", { method: "GET" }),
    subscribe: (email: string, source: string = "BLOG_EDITORIAL") =>
      apiFetch("/blog/subscribe", { method: "POST", body: JSON.stringify({ email, source }) }),
    deleteSubscriber: (id: number | string) => apiFetch(`/blog/subscribers/${id}`, { method: "DELETE" }),
  },
};
