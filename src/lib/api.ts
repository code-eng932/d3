export const API_BASE_URL = "http://localhost:5000/api";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT";

const getToken = () => localStorage.getItem("token");

const redirectToAuth = () => {
  window.location.href = "/";
};

const request = async <TResponse>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  options?: { requireAuth?: boolean }
): Promise<TResponse> => {
  const requireAuth = options?.requireAuth ?? true;
  const token = getToken();

  if (requireAuth && !token) {
    redirectToAuth();
    throw new AuthError("No token found");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 401 && requireAuth) {
    localStorage.removeItem("token");
    redirectToAuth();
    throw new AuthError("Token invalid or expired");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { message?: string }).message || `Request failed: ${response.status}`);
  }

  return data as TResponse;
};

export const api = {
  get: <TResponse>(path: string, options?: { requireAuth?: boolean }) =>
    request<TResponse>(path, "GET", undefined, options),
  post: <TResponse>(path: string, body?: unknown, options?: { requireAuth?: boolean }) =>
    request<TResponse>(path, "POST", body, options),
  patch: <TResponse>(path: string, body?: unknown, options?: { requireAuth?: boolean }) =>
    request<TResponse>(path, "PATCH", body, options),
  put: <TResponse>(path: string, body?: unknown, options?: { requireAuth?: boolean }) =>
    request<TResponse>(path, "PUT", body, options),
};

