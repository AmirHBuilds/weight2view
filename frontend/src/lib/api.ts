import type {
  AdminUserRead,
  CalculateResponse,
  ItemRead,
  ItemRequestRead,
  ItemSearchResult,
  ReferenceObjectRead,
} from "../types/api";

// Empty by default so requests go through Vite's dev proxy (same-origin -
// see vite.config.ts for why this matters for the admin session cookie).
// VITE_API_BASE_URL remains available as an explicit override (e.g.
// pointing a deployed frontend directly at a separately-hosted API that
// sits behind its own reverse proxy / shares a cookie domain).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include", // send/receive the admin session cookie
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  searchItems: (q: string, limit = 8) =>
    request<ItemSearchResult[]>(`/items/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  getItem: (id: string) => request<ItemRead>(`/items/${id}`),

  calculate: (item_id: string, amount: number, unit: string) =>
    request<CalculateResponse>(`/calculate`, {
      method: "POST",
      body: JSON.stringify({ item_id, amount, unit }),
    }),

  listReferences: () => request<ReferenceObjectRead[]>(`/references`),

  submitRequest: (query_text: string) =>
    request<ItemRequestRead>(`/requests`, {
      method: "POST",
      body: JSON.stringify({ query_text }),
    }),

  // Auth
  auth: {
    login: (email: string, password: string) =>
      request<AdminUserRead>(`/admin/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request<void>(`/admin/auth/logout`, { method: "POST" }),
    me: () => request<AdminUserRead>(`/admin/auth/me`),
  },

  // Admin
  admin: {
    listItems: (q?: string, includeInactive = false) =>
      request<ItemRead[]>(
        `/admin/items?${q ? `q=${encodeURIComponent(q)}&` : ""}include_inactive=${includeInactive}`
      ),
    getItem: (id: string) => request<ItemRead>(`/admin/items/${id}`),
    createItem: (payload: Record<string, unknown>) =>
      request<ItemRead>(`/admin/items`, { method: "POST", body: JSON.stringify(payload) }),
    updateItem: (id: string, payload: Record<string, unknown>) =>
      request<ItemRead>(`/admin/items/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    deactivateItem: (id: string) =>
      request<ItemRead>(`/admin/items/${id}/deactivate`, { method: "POST" }),
    activateItem: (id: string) =>
      request<ItemRead>(`/admin/items/${id}/activate`, { method: "POST" }),
    deleteItem: (id: string) => request<void>(`/admin/items/${id}`, { method: "DELETE" }),
    setMeasurement: (id: string, payload: Record<string, unknown>) =>
      request<ItemRead>(`/admin/items/${id}/measurement`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    listReferences: (params?: { q?: string; category?: string; status?: string; sort?: string }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      if (params?.category) qs.set("category", params.category);
      if (params?.status) qs.set("status", params.status);
      if (params?.sort) qs.set("sort", params.sort);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<ReferenceObjectRead[]>(`/admin/references${suffix}`);
    },
    createReference: (payload: Record<string, unknown>) =>
      request<ReferenceObjectRead>(`/admin/references`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateReference: (id: string, payload: Record<string, unknown>) =>
      request<ReferenceObjectRead>(`/admin/references/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deactivateReference: (id: string) =>
      request<ReferenceObjectRead>(`/admin/references/${id}/deactivate`, { method: "POST" }),
    activateReference: (id: string) =>
      request<ReferenceObjectRead>(`/admin/references/${id}/activate`, { method: "POST" }),
    deleteReference: (id: string) => request<void>(`/admin/references/${id}`, { method: "DELETE" }),

    listRequests: (status?: string) =>
      request<ItemRequestRead[]>(`/admin/requests${status ? `?status=${status}` : ""}`),
    getRequest: (id: string) => request<ItemRequestRead>(`/admin/requests/${id}`),
    updateRequest: (id: string, payload: Record<string, unknown>) =>
      request<ItemRequestRead>(`/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    // Admin user management (super admin only - backend enforces this regardless)
    listAdmins: () => request<AdminUserRead[]>(`/admin/admins`),
    createAdmin: (payload: { email: string; password: string; role: string }) =>
      request<AdminUserRead>(`/admin/admins`, { method: "POST", body: JSON.stringify(payload) }),
    updateAdmin: (id: string, payload: Record<string, unknown>) =>
      request<AdminUserRead>(`/admin/admins/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    resetAdminPassword: (id: string, newPassword: string) =>
      request<AdminUserRead>(`/admin/admins/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword }),
      }),
  },
};

export { ApiError };
