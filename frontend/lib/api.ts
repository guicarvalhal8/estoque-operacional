const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const AUTH_STORAGE_KEY = "estoque_auth_token";

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | undefined | null>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${API_URL}${path}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const headers = new Headers(options.headers ?? {});
  const storedToken =
    typeof window !== "undefined" ? window.localStorage.getItem(AUTH_STORAGE_KEY) : null;

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (storedToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${storedToken}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      ...options,
      signal: controller.signal,
      credentials: "include",
      headers
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ message: "Falha ao processar a requisicao" }));
    throw new Error(errorPayload.message ?? "Falha ao processar a requisicao");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function downloadFile(path: string, fileName: string, query?: RequestOptions["query"]) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const storedToken =
    typeof window !== "undefined" ? window.localStorage.getItem(AUTH_STORAGE_KEY) : null;
  const headers = new Headers();

  if (storedToken) {
    headers.set("Authorization", `Bearer ${storedToken}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      credentials: "include",
      signal: controller.signal,
      headers
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ message: "Falha ao exportar arquivo" }));
    throw new Error(errorPayload.message ?? "Falha ao exportar arquivo");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function persistAuthToken(token: string | null) {
  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
