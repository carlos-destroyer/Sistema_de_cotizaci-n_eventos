import type {
  CatalogoItem,
  CatalogoItemRequest,
  Cliente,
  ClienteOpcion,
  ClienteRequest,
  Cotizacion,
  CotizacionRequest,
  CotizacionResumen,
  Dashboard,
  Empresa,
  EstadoCotizacion,
  PageResponse,
  Plantilla,
  PlantillaAplicada,
  PlantillaRequest,
  Categoria,
  Usuario,
  UsuarioRequest,
  UsuarioUpdateRequest,
  LoginResponse,
} from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/api").replace(/\/+$/, "");

const TOKEN_KEY = "mm_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function queryString(params?: Query) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `No se pudo conectar con la API en ${API_URL}. Verifica que el backend esté en ejecución.`,
      0,
    );
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/login")) {
      setToken(null);
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    let message = `Error ${response.status}`;
    let fields: Record<string, string> | undefined;
    try {
      const body = await response.json();
      message = body?.message ?? message;
      fields = body?.fields;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new ApiError(message, response.status, fields);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  url: API_URL,

  dashboard: () => request<Dashboard>("/dashboard"),

  auth: {
    login: (username: string, password: string) =>
      request<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<Usuario>("/auth/me"),
  },

  usuarios: {
    listar: () => request<Usuario[]>("/usuarios"),
    obtener: (id: number) => request<Usuario>(`/usuarios/${id}`),
    crear: (body: UsuarioRequest) =>
      request<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(body) }),
    actualizar: (id: number, body: UsuarioUpdateRequest) =>
      request<Usuario>(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    eliminar: (id: number) => request<void>(`/usuarios/${id}`, { method: "DELETE" }),
  },

  cotizaciones: {
    listar: (params?: {
      q?: string;
      estado?: EstadoCotizacion | "";
      clienteId?: number;
      desde?: string;
      hasta?: string;
      page?: number;
      size?: number;
      sort?: string;
      dir?: string;
    }) => request<PageResponse<CotizacionResumen>>(`/cotizaciones${queryString(params)}`),
    obtener: (id: number | string) => request<Cotizacion>(`/cotizaciones/${id}`),
    crear: (body: CotizacionRequest) =>
      request<Cotizacion>("/cotizaciones", { method: "POST", body: JSON.stringify(body) }),
    actualizar: (id: number | string, body: CotizacionRequest) =>
      request<Cotizacion>(`/cotizaciones/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    cambiarEstado: (id: number | string, estado: EstadoCotizacion) =>
      request<Cotizacion>(`/cotizaciones/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      }),
    duplicar: (id: number | string) =>
      request<Cotizacion>(`/cotizaciones/${id}/duplicar`, { method: "POST" }),
    eliminar: (id: number | string) =>
      request<void>(`/cotizaciones/${id}`, { method: "DELETE" }),
    pdfUrl: (id: number | string) => `${API_URL}/cotizaciones/${id}/pdf`,
    excelUrl: (id: number | string, tipo: "cliente" | "interno" = "cliente") =>
      `${API_URL}/cotizaciones/${id}/excel?tipo=${tipo}`,
  },

  clientes: {
    listar: (params?: { q?: string; tipo?: string; incluirInactivos?: boolean }) =>
      request<Cliente[]>(`/clientes${queryString(params)}`),
    opciones: () => request<ClienteOpcion[]>("/clientes/opciones"),
    obtener: (id: number) => request<Cliente>(`/clientes/${id}`),
    crear: (body: ClienteRequest) =>
      request<Cliente>("/clientes", { method: "POST", body: JSON.stringify(body) }),
    actualizar: (id: number, body: ClienteRequest) =>
      request<Cliente>(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    desactivar: (id: number) => request<void>(`/clientes/${id}`, { method: "DELETE" }),
  },

  categorias: {
    listar: (incluirInactivas = false) =>
      request<Categoria[]>(`/categorias${queryString({ incluirInactivas })}`),
    crear: (body: { nombre: string; orden?: number; activo?: boolean }) =>
      request<Categoria>("/categorias", { method: "POST", body: JSON.stringify(body) }),
    actualizar: (id: number, body: { nombre: string; orden?: number; activo?: boolean }) =>
      request<Categoria>(`/categorias/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    desactivar: (id: number) => request<void>(`/categorias/${id}`, { method: "DELETE" }),
  },

  catalogo: {
    listar: (params?: { categoriaId?: number; q?: string; incluirInactivos?: boolean }) =>
      request<CatalogoItem[]>(`/catalogo${queryString(params)}`),
    obtener: (id: number) => request<CatalogoItem>(`/catalogo/${id}`),
    crear: (body: CatalogoItemRequest) =>
      request<CatalogoItem>("/catalogo", { method: "POST", body: JSON.stringify(body) }),
    actualizar: (id: number, body: CatalogoItemRequest) =>
      request<CatalogoItem>(`/catalogo/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    desactivar: (id: number) => request<void>(`/catalogo/${id}`, { method: "DELETE" }),
  },

  plantillas: {
    listar: (incluirInactivas = false) =>
      request<Plantilla[]>(`/plantillas${queryString({ incluirInactivas })}`),
    obtener: (id: number | string) => request<Plantilla>(`/plantillas/${id}`),
    aplicar: (id: number | string, invitados = 0) =>
      request<PlantillaAplicada>(`/plantillas/${id}/aplicar${queryString({ invitados })}`),
    crear: (body: PlantillaRequest) =>
      request<Plantilla>("/plantillas", { method: "POST", body: JSON.stringify(body) }),
    actualizar: (id: number | string, body: PlantillaRequest) =>
      request<Plantilla>(`/plantillas/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    eliminar: (id: number | string) =>
      request<void>(`/plantillas/${id}`, { method: "DELETE" }),
  },

  empresa: {
    obtener: () => request<Empresa>("/empresa"),
    actualizar: (body: Omit<Empresa, "id" | "actualizadoEn">) =>
      request<Empresa>("/empresa", { method: "PUT", body: JSON.stringify(body) }),
  },
};
