// ─── Roles del sistema ────────────────────────────────────────
export const Rol = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  TAQUILLA: 'TAQUILLA',
  BODEGA: 'BODEGA',
  CLIENTE: 'CLIENTE',
} as const;

export type Rol = typeof Rol[keyof typeof Rol];

// ─── Estados de encomienda (alineados con backend) ────────────
export const EstadoEncomienda = {
  REGISTRADO: 'REGISTRADO',
  RECEPCIONADO: 'RECEPCIONADO',
  EN_TRANSITO: 'EN_TRANSITO',
  EN_DESTINO: 'EN_DESTINO',
  DISPONIBLE: 'DISPONIBLE',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
} as const;

export type EstadoEncomienda = typeof EstadoEncomienda[keyof typeof EstadoEncomienda];

// ─── Interfaces del usuario ───────────────────────────────────
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: Rol;
  activo: boolean;
}

// ─── Evento de historial de estado ───────────────────────────
export interface ParcelEvent {
  id: string;
  parcelId: string;
  status: EstadoEncomienda;
  note?: string;
  usuarioId?: string;
  createdAt: string;
}

// ─── Categoría de contenido (Fase 16) ──────────────────────────
export const CategoriaContenido = {
  DOCUMENTOS: 'DOCUMENTOS',
  ROPA: 'ROPA',
  ELECTRONICO: 'ELECTRONICO',
  ALIMENTOS: 'ALIMENTOS',
  HERRAMIENTAS: 'HERRAMIENTAS',
  MEDICAMENTOS: 'MEDICAMENTOS',
  OTRO: 'OTRO',
} as const;

export type CategoriaContenido = typeof CategoriaContenido[keyof typeof CategoriaContenido];

// ─── Estado de Pago (Fase 16) ──────────────────────────────────
export const EstadoPago = {
  PENDIENTE: 'PENDIENTE',
  PAGADO: 'PAGADO',
  EXONERADO: 'EXONERADO',
} as const;

export type EstadoPago = typeof EstadoPago[keyof typeof EstadoPago];

// ─── Tipo de Pago (Fase 15) ──────────────────────────────────
export const TipoPago = {
  REMITENTE: 'REMITENTE',
  DESTINATARIO: 'DESTINATARIO',
} as const;

export type TipoPago = typeof TipoPago[keyof typeof TipoPago];

// ─── Encomienda principal (alineada con backend Parcel) ───────
export interface Parcel {
  id: string;
  trackingNumber: string;

  // Sender
  senderName: string;
  senderCi: string;
  senderPhone: string;
  senderEmail: string;

  // Recipient
  recipientName: string;
  recipientCi: string;
  recipientPhone: string;
  recipientEmail?: string;

  // Package
  content: string;
  weight: number;
  observations?: string;

  // Detalles extendidos del paquete (Fase 16)
  largoCm?: number;
  anchoCm?: number;
  altoCm?: number;
  categoria?: CategoriaContenido;
  esFragil: boolean;

  // Costo y pago (Fase 16)
  costoEnvio?: number;
  estadoPago: EstadoPago;
  pagadoEn?: string;
  tipoPago: TipoPago;

  // Asignación a bus
  assignedBusId?: string;
  assignedBusPlaca?: string;
  assignedBusFlota?: string;

  // Route
  routeCode: string;
  originAddress: string;
  destinationAddress: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;

  // Status
  status: EstadoEncomienda;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;

  // History
  events?: ParcelEvent[];
}

// ─── Input types para mutations ───────────────────────────────
export interface CreateParcelInput {
  senderName: string;
  senderCi: string;
  senderPhone: string;
  senderEmail: string;
  recipientName: string;
  recipientCi: string;
  recipientPhone: string;
  recipientEmail?: string;
  content: string;
  weight: number;
  observations?: string;
  routeCode: string;

  // Detalles extendidos (Fase 16)
  largoCm?: number;
  anchoCm?: number;
  altoCm?: number;
  categoria?: CategoriaContenido;
  esFragil?: boolean;
  tipoPago?: TipoPago;
}

export interface UpdateParcelStatusInput {
  id: string;
  status: EstadoEncomienda;
  note?: string;
}

export interface ConfirmarRetiroInput {
  parcelId: string;
  recipientCi: string;
}

// ─── Interfaces de Buses ─────────────────────────────────────
export const BusEstado = {
  CARGANDO: 'CARGANDO',
  LISTO: 'LISTO',
  EN_RUTA: 'EN_RUTA',
  EN_MANTENIMIENTO: 'EN_MANTENIMIENTO',
} as const;

export type BusEstado = typeof BusEstado[keyof typeof BusEstado];

export interface Bus {
  id: string;
  placa: string;
  flota: string;
  modelo?: string;
  conductor?: string;
  capacidad: number;
  cargados: number;
  routeCode: string;
  routeLabel?: string;
  estado: BusEstado;
  activo: boolean;
  salidaProgramada?: string;
}

export interface CrearBusInput {
  placa: string;
  flota?: string;
  modelo?: string;
  routeCode: string;
  capacidad?: number;
  salidaProgramada?: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono?: string;
  activa: boolean;
}

export interface CrearSucursalInput {
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono?: string;
}

export interface ActualizarSucursalInput {
  id: string;
  nombre?: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  activa?: boolean;
}

// ─── Filtros para listado ─────────────────────────────────────
export interface ParcelsFilter {
  status?: EstadoEncomienda;
  routeCode?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── Rutas disponibles ────────────────────────────────────────
export const RUTAS_DISPONIBLES = [
  { value: 'SCZ-PQA', label: 'Santa Cruz → Puerto Quijarro' },
  { value: 'SCZ-SJC', label: 'Santa Cruz → San José de Chiquitos' },
  { value: 'SCZ-ROB', label: 'Santa Cruz → Roboré' },
  { value: 'PQA-SCZ', label: 'Puerto Quijarro → Santa Cruz' },
] as const;

// ─── Configuración visual de estados ─────────────────────────
export const ESTADO_CONFIG: Record<
  EstadoEncomienda,
  { label: string; badgeClass: string; step: number }
> = {
  [EstadoEncomienda.REGISTRADO]:   { label: 'Registrado',   badgeClass: 'badge--blue',    step: 0 },
  [EstadoEncomienda.RECEPCIONADO]: { label: 'Recepcionado', badgeClass: 'badge--cyan',    step: 1 },
  [EstadoEncomienda.EN_TRANSITO]:  { label: 'En tránsito',  badgeClass: 'badge--amber',   step: 2 },
  [EstadoEncomienda.EN_DESTINO]:   { label: 'En destino',   badgeClass: 'badge--purple',  step: 3 },
  [EstadoEncomienda.DISPONIBLE]:   { label: 'Disponible',   badgeClass: 'badge--emerald', step: 4 },
  [EstadoEncomienda.ENTREGADO]:    { label: 'Entregado',    badgeClass: 'badge--green',   step: 5 },
  [EstadoEncomienda.CANCELADO]:    { label: 'Cancelado',    badgeClass: 'badge--red',     step: -1 },
};

// ─── Telemetría e Interfaces de Tracking ──────────────────────
export interface BusLocation {
  busId: string;
  lat: number;
  lng: number;
  velocidad?: number;
  recordedAt: string;
}

export interface RegistrarCoordenadaBusInput {
  busId: string;
  lat: number;
  lng: number;
  velocidad?: number;
  recordedAt?: string;
}

