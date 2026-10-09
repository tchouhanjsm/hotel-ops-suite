const API_BASE_URL = "/api";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const method = (options.method ?? "GET").toUpperCase();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: method === "GET" ? "no-store" : options.cache,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
