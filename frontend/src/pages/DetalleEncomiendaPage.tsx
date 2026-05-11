import { useParams, useNavigate } from 'react-router-dom';
import {
  Package, ArrowLeft, MapPin, User, Phone, Mail, Truck,
  Clock, CheckCircle2, FileBarChart, Printer, Copy, Weight
} from 'lucide-react';
import type { EstadoEncomienda } from '../types';

// ─── Mock data for detail view ─────────────────────────────
const MOCK_DETALLE = {
  id: '1',
  codigo: 'EX-2026-SCZ-0048217',
  estado: 'EN_TRANSITO' as EstadoEncomienda,
  remitente: { nombre: 'Rosa Méndez Suárez', ci: '9 102 778 SC', telefono: '+591 7654-3210', email: 'rosa@email.com' },
  destinatario: { nombre: 'Juan Carlos Rojas Vargas', ci: '8 205 334 SC', telefono: '+591 6789-0123', email: 'juan.rojas@email.com' },
  ruta: { nombre: 'Santa Cruz → Puerto Quijarro', codigo: 'SCZ-PQA' },
  contenido: 'Repuestos automotrices · Frágil',
  pesoDeclarado: 3.2,
  pesoReal: 3.3,
  observaciones: 'Manejar con cuidado. Contiene piezas de vidrio.',
  bus: { placa: '2845-KCN', flota: 'Flota 18', conductor: 'José Suárez' },
  oficina: { origen: 'Terminal Bimodal SCZ', destino: 'Terminal Pto. Quijarro' },
  creadoEn: '2026-05-10T11:42:00',
  eventos: [
    { estado: 'REGISTRADO', label: 'Registrada en línea', detalle: 'Registrada por Rosa Méndez · Canal web', fecha: '10 may · 11:42', responsable: 'Rosa Méndez S.', done: true },
    { estado: 'RECEPCIONADO', label: 'Recibida en taquilla SCZ', detalle: 'Taquilla Vent. 6 · Recibo #45821 · Peso verificado: 3.3 kg', fecha: '10 may · 11:58', responsable: 'Carla Gutiérrez', done: true },
    { estado: 'EN_TRANSITO', label: 'Cargada al Bus #18', detalle: 'Manifiesto MNF-0312 · Andén 3 · Despacho SCZ → PQA', fecha: '10 may · 13:30', responsable: 'Jorge Mamani', done: true },
    { estado: 'EN_TRANSITO', label: 'En tránsito · Pailón', detalle: 'Punto GPS recibido · 87 km/h · 312 km recorridos', fecha: '10 may · 16:52', responsable: 'Sistema GPS', done: false, current: true },
    { estado: 'EN_DESTINO', label: 'Arribo a terminal Pto. Quijarro', detalle: 'Estimado 13 may · 14:50', fecha: '—', done: false },
    { estado: 'DISPONIBLE', label: 'Disponible en ventanilla', detalle: 'Notificación SMS al destinatario', fecha: '—', done: false },
    { estado: 'ENTREGADO', label: 'Entregada al destinatario', detalle: 'Confirmación con CI del destinatario', fecha: '—', done: false },
  ],
  paradas: ['Santa Cruz', 'Cotoca', 'Pailón', 'San José', 'Roboré', 'Pto. Quijarro'],
  busPosition: 3,
};

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  REGISTRADO: { label: 'Pre-registrada', className: 'badge badge--gray' },
  RECEPCIONADO: { label: 'Recepcionada', className: 'badge badge--blue' },
  EN_TRANSITO: { label: 'En tránsito', className: 'badge badge--amber' },
  EN_DESTINO: { label: 'En destino', className: 'badge badge--purple' },
  DISPONIBLE: { label: 'Disponible para retiro', className: 'badge badge--emerald' },
  ENTREGADO: { label: 'Entregada', className: 'badge badge--green' },
  CANCELADO: { label: 'Cancelada', className: 'badge badge--red' },
};

export default function DetalleEncomiendaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODO: Replace with real query using id
  const enc = MOCK_DETALLE;
  const badge = ESTADO_CONFIG[enc.estado];

  const copyCode = () => {
    navigator.clipboard.writeText(enc.codigo);
  };

  return (
    <div className="panel-page">
      {/* ─── Back + Header ──────────────────── */}
      <div className="detalle-header">
        <button className="detalle-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="detalle-header__main">
          <div className="detalle-header__left">
            <h2 className="detalle-header__code">
              {enc.codigo}
              <button className="detalle-copy" onClick={copyCode} title="Copiar código">
                <Copy size={14} />
              </button>
            </h2>
            <span className={badge.className} style={{ fontSize: 13, padding: '5px 14px' }}>
              <span className="badge__dot" /> {badge.label}
            </span>
          </div>
          <div className="detalle-header__actions">
            <button className="btn btn--secondary btn--sm"><FileBarChart size={15} /> Ver etiqueta</button>
            <button className="btn btn--secondary btn--sm"><Printer size={15} /> Imprimir</button>
          </div>
        </div>
      </div>

      {/* ─── Route Progress ─────────────────── */}
      <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
        <div className="dashboard-panel__header">
          <span className="dashboard-panel__title"><Truck size={16} /> Progreso de ruta</span>
          {enc.bus && <span style={{ fontSize: 12, color: '#6B7280' }}>{enc.bus.flota} · {enc.bus.placa}</span>}
        </div>
        <div className="dashboard-panel__body">
          <div className="rastreo-route">
            {enc.paradas.map((parada, i) => (
              <div key={parada} className={`rastreo-route__stop ${i <= enc.busPosition ? 'rastreo-route__stop--passed' : ''} ${i === enc.busPosition ? 'rastreo-route__stop--current' : ''}`}>
                <div className="rastreo-route__dot" />
                {i < enc.paradas.length - 1 && <div className="rastreo-route__line" />}
                <span className="rastreo-route__name">{parada}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Info Cards + Timeline ──────────── */}
      <div className="detalle-grid">
        {/* Left column: Info cards */}
        <div className="detalle-info-col">
          {/* Remitente */}
          <div className="detalle-card">
            <h3 className="detalle-card__title"><User size={16} /> Remitente</h3>
            <div className="detalle-card__fields">
              <div><span>Nombre</span><strong>{enc.remitente.nombre}</strong></div>
              <div><span>CI</span><strong>{enc.remitente.ci}</strong></div>
              <div><span><Phone size={12} /> Teléfono</span><strong>{enc.remitente.telefono}</strong></div>
              <div><span><Mail size={12} /> Email</span><strong>{enc.remitente.email}</strong></div>
            </div>
          </div>

          {/* Destinatario */}
          <div className="detalle-card">
            <h3 className="detalle-card__title"><User size={16} /> Destinatario</h3>
            <div className="detalle-card__fields">
              <div><span>Nombre</span><strong>{enc.destinatario.nombre}</strong></div>
              <div><span>CI</span><strong>{enc.destinatario.ci}</strong></div>
              <div><span><Phone size={12} /> Teléfono</span><strong>{enc.destinatario.telefono}</strong></div>
              <div><span><Mail size={12} /> Email</span><strong>{enc.destinatario.email}</strong></div>
            </div>
          </div>

          {/* Paquete */}
          <div className="detalle-card">
            <h3 className="detalle-card__title"><Package size={16} /> Detalles del paquete</h3>
            <div className="detalle-card__fields">
              <div><span>Contenido</span><strong>{enc.contenido}</strong></div>
              <div><span><Weight size={12} /> Peso declarado</span><strong>{enc.pesoDeclarado} kg</strong></div>
              <div><span><Weight size={12} /> Peso real</span><strong>{enc.pesoReal} kg</strong></div>
              <div><span><MapPin size={12} /> Ruta</span><strong>{enc.ruta.nombre}</strong></div>
              <div><span>Oficina origen</span><strong>{enc.oficina.origen}</strong></div>
              <div><span>Oficina destino</span><strong>{enc.oficina.destino}</strong></div>
              {enc.observaciones && <div style={{ gridColumn: '1 / -1' }}><span>Observaciones</span><strong>{enc.observaciones}</strong></div>}
            </div>
          </div>

          {/* Bus info */}
          {enc.bus && (
            <div className="detalle-card">
              <h3 className="detalle-card__title"><Truck size={16} /> Transporte asignado</h3>
              <div className="detalle-card__fields">
                <div><span>Flota</span><strong>{enc.bus.flota}</strong></div>
                <div><span>Placa</span><strong>{enc.bus.placa}</strong></div>
                <div><span>Conductor</span><strong>{enc.bus.conductor}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Timeline */}
        <div className="detalle-timeline-col">
          <div className="detalle-card detalle-card--timeline">
            <h3 className="detalle-card__title"><Clock size={16} /> Historial de eventos</h3>
            <div className="rastreo-timeline">
              {enc.eventos.map((ev, i) => (
                <div key={i} className={`rastreo-timeline__item ${ev.done ? 'rastreo-timeline__item--done' : ''} ${ev.current ? 'rastreo-timeline__item--current' : ''}`}>
                  <div className="rastreo-timeline__dot">
                    {ev.done && <CheckCircle2 size={10} style={{ color: 'white' }} />}
                  </div>
                  <div className="rastreo-timeline__content">
                    <strong>{ev.label}</strong>
                    <span className="rastreo-timeline__detail">{ev.detalle}</span>
                    {ev.responsable && (
                      <span className="rastreo-timeline__detail" style={{ fontStyle: 'italic' }}>
                        Responsable: {ev.responsable}
                      </span>
                    )}
                  </div>
                  <span className="rastreo-timeline__date">{ev.fecha}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action panel */}
          <div className="detalle-card">
            <h3 className="detalle-card__title">Acciones disponibles</h3>
            <div className="detalle-actions">
              {enc.estado === 'REGISTRADO' && (
                <button className="btn btn--primary btn--full">Recepcionar en taquilla</button>
              )}
              {enc.estado === 'RECEPCIONADO' && (
                <>
                  <button className="btn btn--primary btn--full">Clasificar en bodega</button>
                  <button className="btn btn--secondary btn--full">Asignar a bus</button>
                </>
              )}
              {enc.estado === 'EN_TRANSITO' && (
                <button className="btn btn--primary btn--full">Registrar descarga</button>
              )}
              {enc.estado === 'EN_DESTINO' && (
                <button className="btn btn--primary btn--full">Marcar como disponible</button>
              )}
              {enc.estado === 'DISPONIBLE' && (
                <button className="btn btn--gold btn--full">Confirmar retiro</button>
              )}
              {enc.estado === 'ENTREGADO' && (
                <p style={{ fontSize: 13, color: '#16A34A', textAlign: 'center' }}>
                  <CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> Envío completado exitosamente
                </p>
              )}
              <button className="btn btn--danger-outline btn--full btn--sm" style={{ marginTop: 8 }}>
                Cancelar encomienda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
