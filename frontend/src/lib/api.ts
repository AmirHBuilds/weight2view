import type {
  CalculateResponse,
  ItemRead,
  ItemRequestRead,
  ItemSearchResult,
  ReferenceObjectRead,
} from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
    setMeasurement: (id: string, payload: Record<string, unknown>) =>
      request<ItemRead>(`/admin/items/${id}/measurement`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    listReferences: (includeInactive = false) =>
      request<ReferenceObjectRead[]>(`/admin/references?include_inactive=${includeInactive}`),
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

    listRequests: (status?: string) =>
      request<ItemRequestRead[]>(`/admin/requests${status ? `?status=${status}` : ""}`),
    getRequest: (id: string) => request<ItemRequestRead>(`/admin/requests/${id}`),
    updateRequest: (id: string, payload: Record<string, unknown>) =>
      request<ItemRequestRead>(`/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },
};

export { ApiError };
