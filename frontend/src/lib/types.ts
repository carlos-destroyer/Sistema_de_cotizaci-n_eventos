export type EstadoCotizacion = "BORRADOR" | "ENVIADA" | "APROBADA" | "RECHAZADA";
export type TipoCliente = "SOCIAL" | "CORPORATIVO";
export type ReglaCantidad = "NINGUNA" | "POR_INVITADO" | "POR_MESA" | "POR_MOZO";

export interface Categoria {
  id: number;
  nombre: string;
  orden: number;
  activo: boolean;
  items: number;
}

export interface CatalogoItem {
  id: number;
  categoriaId: number;
  categoriaNombre: string;
  nombre: string;
  descripcion?: string | null;
  unidadMedida?: string | null;
  precioVenta: number;
  costoInterno: number;
  stockReferencial?: number | null;
  reglaCantidad: ReglaCantidad;
  activo: boolean;
  actualizadoEn?: string | null;
}

export interface Cliente {
  id: number;
  nombreRazonSocial: string;
  tipoCliente: TipoCliente;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  notas?: string | null;
  activo: boolean;
  creadoEn?: string | null;
}

export interface ClienteOpcion {
  id: number;
  nombre: string;
  tipoCliente: TipoCliente;
}

export interface CotizacionDetalle {
  id: number;
  categoriaNombre: string;
  orden: number;
  descripcion: string;
  esSubitemInformativo: boolean;
  unidades: number;
  precioUnitarioVenta: number;
  subtotalVenta: number;
  costoUnitarioInterno: number;
  subtotalCostoInterno: number;
}

export interface Cotizacion {
  id: number;
  codigo: string;
  clienteId: number;
  clienteNombre: string;
  clienteTipo: TipoCliente;
  clienteDocumento?: string | null;
  clienteTelefono?: string | null;
  clienteEmail?: string | null;
  fechaEmision: string;
  validoHasta?: string | null;
  fechaEvento?: string | null;
  localEvento?: string | null;
  cantidadInvitados: number;
  tipoEvento?: string | null;
  tematica?: string | null;
  paletaColores?: string | null;
  incluyeIgv: boolean;
  notasCortesia?: string | null;
  notasInternas?: string | null;
  estado: EstadoCotizacion;
  version: number;
  cotizacionOrigenId?: number | null;
  codigoOrigen?: string | null;
  subtotalVenta: number;
  montoIgv: number;
  totalVenta: number;
  costoInternoTotal: number;
  gananciaEstimada: number;
  ticketPorPersona: number;
  creadoEn: string;
  actualizadoEn?: string | null;
  detalles: CotizacionDetalle[];
}

export interface CotizacionResumen {
  id: number;
  codigo: string;
  clienteId: number;
  clienteNombre: string;
  clienteTipo: TipoCliente;
  fechaEmision: string;
  fechaEvento?: string | null;
  localEvento?: string | null;
  cantidadInvitados: number;
  tipoEvento?: string | null;
  estado: EstadoCotizacion;
  totalVenta: number;
  gananciaEstimada: number;
  version: number;
  creadoEn: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PlantillaDetalle {
  id: number;
  catalogoItemId?: number | null;
  categoriaNombre: string;
  descripcion: string;
  cantidadBase: number;
  precioVenta: number;
  costoInterno: number;
  esSubitem: boolean;
  orden: number;
}

export interface Plantilla {
  id: number;
  nombre: string;
  tipoEvento: string;
  descripcion?: string | null;
  incluyeIgv: boolean;
  activo: boolean;
  creadoEn?: string | null;
  detalles: PlantillaDetalle[];
}

export interface PlantillaAplicada {
  plantillaId: number;
  nombre: string;
  incluyeIgv: boolean;
  detalles: Array<{
    catalogoItemId?: number | null;
    categoriaNombre: string;
    descripcion: string;
    cantidad: number;
    precioVenta: number;
    costoInterno: number;
    esSubitem: boolean;
    orden: number;
  }>;
}

export interface Empresa {
  id: number;
  razonSocial: string;
  nombreComercial?: string | null;
  ruc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  sitioWeb?: string | null;
  logoUrl?: string | null;
  igvPorcentaje: number;
  terminosCondiciones?: string | null;
  actualizadoEn?: string | null;
}

export interface Dashboard {
  kpis: {
    cotizacionesTotal: number;
    cotizacionesMes: number;
    aprobadasMes: number;
    montoCotizadoMes: number;
    tasaCierre: number;
    gananciaProyectada: number;
    ticketPromedio: number;
    clientesActivos: number;
  };
  pipeline: Array<{ estado: EstadoCotizacion; cantidad: number; monto: number }>;
  recientes: CotizacionResumen[];
  proximosEventos: CotizacionResumen[];
  serieMensual: Array<{ clave: string; etiqueta: string; total: number; cantidad: number }>;
  topCategorias: Array<{ categoria: string; total: number; porcentaje: number }>;
}

export interface CotizacionRequest {
  clienteId: number;
  codigo?: string | null;
  fechaEmision?: string | null;
  validoHasta?: string | null;
  fechaEvento?: string | null;
  localEvento?: string | null;
  cantidadInvitados: number;
  tipoEvento?: string | null;
  tematica?: string | null;
  paletaColores?: string | null;
  incluyeIgv: boolean;
  notasCortesia?: string | null;
  notasInternas?: string | null;
  estado: EstadoCotizacion;
  detalles: Array<{
    categoriaNombre: string;
    descripcion: string;
    unidades: number;
    precioUnitarioVenta: number;
    costoUnitarioInterno: number;
    esSubitemInformativo: boolean;
    orden: number;
  }>;
}

export interface ClienteRequest {
  nombreRazonSocial: string;
  tipoCliente: TipoCliente;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  notas?: string | null;
  activo: boolean;
}

export interface CatalogoItemRequest {
  categoriaId: number;
  nombre: string;
  descripcion?: string | null;
  unidadMedida?: string | null;
  precioVenta: number;
  costoInterno: number;
  stockReferencial?: number | null;
  reglaCantidad: ReglaCantidad;
  activo: boolean;
}

export interface PlantillaRequest {
  nombre: string;
  tipoEvento: string;
  descripcion?: string | null;
  incluyeIgv: boolean;
  activo: boolean;
  detalles: Array<{
    catalogoItemId?: number | null;
    categoriaNombre: string;
    descripcion: string;
    cantidadBase: number;
    precioVenta: number;
    costoInterno: number;
    esSubitem: boolean;
    orden: number;
  }>;
}

export type RolUsuario = "ADMIN" | "USUARIO";

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  email?: string | null;
  rol: RolUsuario;
  activo: boolean;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEn: number;
  usuario: Usuario;
}

export interface UsuarioRequest {
  username: string;
  password: string;
  nombre: string;
  email?: string | null;
  rol?: RolUsuario;
  activo?: boolean;
}

export interface UsuarioUpdateRequest {
  password?: string;
  nombre?: string;
  email?: string | null;
  rol?: RolUsuario;
  activo?: boolean;
}
