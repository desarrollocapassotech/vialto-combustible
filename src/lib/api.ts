/**
 * Cliente HTTP centralizado para hablar con el backend de Vialto (NestJS).
 *
 * `getToken` se recibe como parámetro en vez de resolverse acá adentro porque el
 * mecanismo de autenticación de esta app todavía no está definido (hoy el chofer
 * inicia sesión con DNI+contraseña contra Firebase, no contra Clerk). Cuando se
 * resuelva el puente de auth, el caller pasa la función que sabe obtener el token
 * vigente sin que este módulo tenga que cambiar.
 */

function baseUrl(): string {
  // En dev, el proxy de Vite (puerto 5174) reenvía /api → backend (8080).
  // Usar URL relativa para que el proxy funcione; en producción VITE_API_URL apunta al backend.
  return import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
}

export type TokenGetter = () => Promise<string | null>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * `fetch` rechaza con TypeError cuando la request nunca llega a completarse
 * a nivel de red (sin conexión, DNS, CORS bloqueado, etc.), a diferencia de
 * una respuesta HTTP de error (4xx/5xx), que resuelve normalmente y en este
 * cliente se traduce en ApiError. Esta distinción es la que permite decidir
 * si conviene reintentar/guardar localmente o mostrar el error tal cual.
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

export async function apiFetch(
  path: string,
  getToken: TokenGetter,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}

export async function apiJson<T>(
  path: string,
  getToken: TokenGetter,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, getToken, init);
  const text = await res.text();
  let data: unknown = undefined;

  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    // Si la sesión expiró o el token es inválido
    if (res.status === 401) {
      localStorage.removeItem("vialtoToken");
      localStorage.removeItem("user");

      // Evitar loop de recargas si ya estamos en una página de login
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/login-administrador"
      ) {
        window.location.href = "/login";
      }
    }

    const msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText;
    throw new ApiError(msg || "Respuesta no válida", res.status, data);
  }

  return data as T;
}
