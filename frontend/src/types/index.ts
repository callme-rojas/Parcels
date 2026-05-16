// ─── Roles del sistema ────────────────────────────────────────
export enum Rol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  TAQUILLA = 'TAQUILLA',
  BODEGA = 'BODEGA',
  CLIENTE = 'CLIENTE',
}

// ─── Estados de encomienda (alineados con backend) ────────────
export enum EstadoEncomienda {
  REGISTRADO = 'REGISTRADO',
  RECEPCIONADO = 'RECEPCIONADO',
  EN_TRANSITO = 'EN_TRANSITO',
  EN_DESTINO = 'EN_DESTINO',
  DISPONIBLE = 'DISPONIBLE',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

// ─── Interfaces del usuario ───────────────────────────────────
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
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
