export type BackendRole = "ADMIN" | "CLIENT" | "OPERATIVE";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: BackendRole;
  created_at: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type OrderStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type ServiceStatus = "ACTIVE" | "INACTIVE";

export type Category = {
  id: number;
  name: string;
};

export type Service = {
  id: number;
  title: string;
  description: string;
  price: number;
  status: ServiceStatus;
  category_id: number;
  operative_id: number;
  category?: Category;
  operative?: AuthUser;
};

export type Order = {
  id: number;
  price_at_order: number;
  status: OrderStatus;
  address: string;
  note?: string | null;
  created_at: string;
  client_id: number;
  operative_id: number;
  service_id: number;
  client?: AuthUser;
  operative?: AuthUser;
  service?: Service;
};

function normalizeBaseUrl(v: string) {
  return v.replace(/\/+$/, "");
}

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? normalizeBaseUrl(String(import.meta.env.VITE_API_URL))
  : import.meta.env.DEV
    ? ""
    : "http://localhost:5000";

type ApiError = {
  error?: string;
  message?: string;
};

async function apiFetch<T>(path: string, init?: RequestInit & { token?: string | null }) {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (init?.token) headers.set("Authorization", `Bearer ${init.token}`);

  const resp = await fetch(url, { ...init, headers });
  const text = await resp.text();
  const contentType = resp.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json") || contentType.includes("+json");

  let data: unknown = null;
  if (text) {
    if (isJson) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        throw new Error("Invalid JSON response from server");
      }
    } else {
      data = text;
    }
  }
  if (!resp.ok) {
    const err = data && typeof data === "object" ? (data as ApiError) : {};
    if (typeof data === "string" && data.trim().startsWith("<!DOCTYPE")) {
      throw new Error("API response is HTML. Check backend is running and VITE_API_URL/proxy is correct.");
    }
    throw new Error(err.error || err.message || `Request failed (${resp.status})`);
  }
  if (!isJson) {
    if (typeof data === "string" && data.trim().startsWith("<!DOCTYPE")) {
      throw new Error("API response is HTML. Check backend is running and VITE_API_URL/proxy is correct.");
    }
    throw new Error("Unexpected non-JSON response from server");
  }
  return data as T;
}

export function toUiOrderStatus(status: OrderStatus) {
  if (status === "PENDING") return { status: "pending" as const, label: "pending" };
  if (status === "ACCEPTED") return { status: "in-progress" as const, label: "accepted" };
  if (status === "IN_PROGRESS") return { status: "in-progress" as const, label: "in progress" };
  if (status === "DONE") return { status: "done" as const, label: "done" };
  return { status: "rejected" as const, label: "cancelled" };
}

export function toUiServiceStatus(status: ServiceStatus) {
  if (status === "ACTIVE") return { status: "active" as const, label: "active" };
  return { status: "disabled" as const, label: "inactive" };
}

export async function apiRegister(input: { name: string; email: string; password: string; role: BackendRole }) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiLogin(input: { email: string; password: string }) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiMe(token: string) {
  return apiFetch<AuthUser>("/api/auth/me", { method: "GET", token });
}

export async function apiLogout(token: string) {
  return apiFetch<{ status: "ok" }>("/api/auth/logout", { method: "POST", token });
}

export async function apiUpdateMe(
  token: string,
  patch: Partial<{ name: string; email: string; password: string }>,
) {
  return apiFetch<AuthUser>("/api/auth/me", { method: "PATCH", body: JSON.stringify(patch), token });
}

export async function apiListServices(params?: { status?: ServiceStatus; categoryId?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.categoryId) q.set("categoryId", String(params.categoryId));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch<Service[]>(`/api/services${suffix}`, { method: "GET" });
}

export async function apiGetService(id: number) {
  return apiFetch<Service>(`/api/services/${id}`, { method: "GET" });
}

export async function apiListOrders(params?: { status?: OrderStatus; clientId?: number; operativeId?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.clientId) q.set("clientId", String(params.clientId));
  if (params?.operativeId) q.set("operativeId", String(params.operativeId));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch<Order[]>(`/api/orders${suffix}`, { method: "GET" });
}

export async function apiGetOrder(id: number) {
  return apiFetch<Order>(`/api/orders/${id}`, { method: "GET" });
}

export async function apiCreateOrder(input: { service_id: number; address: string; note?: string }, token?: string | null) {
  return apiFetch<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
    token: token ?? null,
  });
}

export async function apiOrderAction(orderId: number, action: "accept" | "in-progress" | "done" | "cancel") {
  return apiFetch<Order>(`/api/orders/${orderId}/${action}`, { method: "POST" });
}

export async function apiListUsers(params?: { role?: BackendRole }) {
  const q = new URLSearchParams();
  if (params?.role) q.set("role", params.role);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch<AuthUser[]>(`/api/users${suffix}`, { method: "GET" });
}

export async function apiListCategories() {
  return apiFetch<Category[]>("/api/categories", { method: "GET" });
}

export async function apiCreateCategory(input: { name: string }) {
  return apiFetch<Category>("/api/categories", { method: "POST", body: JSON.stringify(input) });
}

export async function apiUpdateCategory(id: number, patch: Partial<{ name: string }>) {
  return apiFetch<Category>(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function apiCreateService(input: {
  title: string;
  description: string;
  price: number;
  status: ServiceStatus;
  category_id: number;
  operative_id: number;
}) {
  return apiFetch<Service>("/api/services", { method: "POST", body: JSON.stringify(input) });
}

export async function apiUpdateService(
  id: number,
  patch: Partial<{
    title: string;
    description: string;
    price: number;
    status: ServiceStatus;
    category_id: number;
  }>,
) {
  return apiFetch<Service>(`/api/services/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function apiUpdateOrder(
  id: number,
  patch: Partial<{ status: OrderStatus; address: string; note: string | null }>,
) {
  return apiFetch<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}
