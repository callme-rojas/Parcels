// ─── Roles del sistema ────────────────────────────────────────
export enum Rol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  TAQUILLA = 'TAQUILLA',
  BODEGA = 'BODEGA',
  CLIENTE = 'CLIENTE', // Usuario común: puede enviar y recibir
}

// ─── Estados de encomienda ────────────────────────────────────
export enum EstadoEncomienda {
  REGISTRADO = 'REGISTRADO',
  RECEPCIONADO = 'RECEPCIONADO',
  EN_TRANSITO = 'EN_TRANSITO',
  EN_DESTINO = 'EN_DESTINO',
  DISPONIBLE = 'DISPONIBLE',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

// ─── Interfaces ───────────────────────────────────────────────
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  telefono?: string;
  ci?: string;
}

export interface Oficina {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  activa: boolean;
}

export interface Ruta {
  id: string;
  nombre: string;
  origen: Oficina;
  destino: Oficina;
  activa: boolean;
}

// Destinatario NO requiere cuenta — solo datos de contacto
export interface DatosDestinatario {
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string;
  email?: string;
}

export interface EventoEstado {
  id: string;
  estado: EstadoEncomienda;
  fechaHora: string;
  usuario?: Usuario;
  observacion?: string;
}

export interface Encomienda {
  id: string;
  codigo: string;
  remitente: Usuario;          // El usuario logueado que envía
  destinatario: DatosDestinatario; // Datos ingresados, no necesita cuenta
  ruta: Ruta;
  descripcion: string;
  peso: number;
  contenido?: string;
  observaciones?: string;
  estadoActual: EstadoEncomienda;
  eventos: EventoEstado[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface Bus {
  id: string;
  placa: string;
  modelo: string;
  activo: boolean;
}
