import { useParams, useNavigate } from 'react-router-dom';
import {
  Package, ArrowLeft, MapPin, User, Phone, Mail, Truck,
  Clock, CheckCircle2, FileBarChart, Printer, Copy, Weight,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useParcel, useUpdateParcelStatus, useConfirmarRetiro } from '../hooks/useParcel';
import { useBusLocation } from '../hooks/useBusLocation';
import { useAuthStore } from '../stores/authStore';
import { ESTADO_CONFIG, Rol, EstadoEncomienda } from '../types';
import type { EstadoEncomienda as EstadoType } from '../types';
import MapTracking from '../components/map/MapTracking';
import { useState } from 'react';

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  REGISTRADO:   { label: 'Pre-registrada',         className: 'badge badge--gray' },
  RECEPCIONADO: { label: 'Recepcionada',            className: 'badge badge--cyan' },
  EN_TRANSITO:  { label: 'En tránsito',             className: 'badge badge--amber' },
  EN_DESTINO:   { label: 'En destino',              className: 'badge badge--purple' },
  DISPONIBLE:   { label: 'Disponible para retiro',  className: 'badge badge--emerald' },
  ENTREGADO:    { label: 'Entregada',               className: 'badge badge--green' },
  CANCELADO:    { label: 'Cancelada',               className: 'badge badge--red' },
};

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function DetalleEncomiendaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { parcel, loading, error, refetch } = useParcel(id);
  const { updateStatus, loading: updatingStatus } = useUpdateParcelStatus();
  const { confirmarRetiro, loading: confirmando } = useConfirmarRetiro();
  const { location: busLocation } = useBusLocation(
    parcel?.status === EstadoEncomienda.EN_TRANSITO ? id : undefined,
    30_000,
  );

  // Para la acción de confirmar retiro (solicita CI)
  const [showCiModal, setShowCiModal] = useState(false);
  const [ciInput, setCiInput] = useState('');
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (text: string, ok = true) => {
    setActionMsg({ ok, text });
    setTimeout(() => setActionMsg(null), 5000);
  };

  const copyCode = () => {
    if (parcel) navigator.clipboard.writeText(parcel.trackingNumber);
  };

  const handleTransition = async (newStatus: EstadoType, note?: string) => {
    if (!parcel) return;
    try {
      await updateStatus({ id: parcel.id, status: newStatus, note });
      notify(`Estado actualizado a: ${ESTADO_CONFIG[newStatus]?.label ?? newStatus}`);
      refetch();
    } catch (e: any) {
      notify(e?.message || 'Error al actualizar estado', false);
    }
  };

  const handleConfirmarRetiro = async () => {
    if (!parcel || !ciInput.trim()) return;
    try {
      await confirmarRetiro({ parcelId: parcel.id, recipientCi: ciInput });
      notify('✅ Identidad verificada. Encomienda entregada.');
      setShowCiModal(false);
      setCiInput('');
      refetch();
    } catch (e: any) {
      notify(e?.message || 'CI incorrecto o error del servidor', false);
    }
  };

  // ── Estados de carga y error ──────────────────────────────
  if (loading) {
    return (
      <div className="panel-page">
        <div className="empty-state">
          <Loader2 size={40} className="spin" />
          <p>Cargando encomienda...</p>
        </div>
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="panel-page">
        <div className="empty-state">
          <AlertCircle size={40} style={{ color: '#EF4444' }} />
          <h2>Encomienda no encontrada</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {error?.message || 'No existe una encomienda con ese ID.'}
          </p>
          <button className="btn btn--secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </div>
    );
  }

  const badge = ESTADO_BADGE[parcel.status] ?? { label: parcel.status, className: 'badge' };
  const events = parcel.events ?? [];
  const st = parcel.status;
  const showMap =
    st === EstadoEncomienda.EN_TRANSITO ||
    st === EstadoEncomienda.EN_DESTINO ||
    st === EstadoEncomienda.DISPONIBLE ||
    st === EstadoEncomienda.ENTREGADO;

  // Permiso de acciones (solo personal interno)
  const canAct =
    user &&
    (user.rol === Rol.ADMINISTRADOR || user.rol === Rol.TAQUILLA || user.rol === Rol.BODEGA);

  return (
    <div className="panel-page">
      {/* ─── Notificación global ───────────────────────────── */}
      {actionMsg && (
        <div
          className={`taq-scan-result ${actionMsg.ok ? 'taq-scan-result--success' : 'taq-scan-result--error'}`}
          style={{ marginBottom: 12 }}
        >
          {actionMsg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* ─── Back + Header ───────────────────────────────── */}
      <div className="detalle-header">
        <button className="detalle-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="detalle-header__main">
          <div className="detalle-header__left">
            <h2 className="detalle-header__code">
              {parcel.trackingNumber}
              <button className="detalle-copy" onClick={copyCode} title="Copiar código">
                <Copy size={14} />
              </button>
            </h2>
            <span className={badge.className} style={{ fontSize: 13, padding: '5px 14px' }}>
              <span className="badge__dot" /> {badge.label}
            </span>
          </div>
          <div className="detalle-header__actions">
            <button className="btn btn--secondary btn--sm" onClick={() => refetch()} title="Actualizar datos">
              <RefreshCw size={15} />
            </button>
            <button className="btn btn--secondary btn--sm">
              <FileBarChart size={15} /> Ver etiqueta
            </button>
            <button className="btn btn--secondary btn--sm" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mapa de Rastreo (si corresponde) ─────────────── */}
      {showMap && (
        <div className="dashboard-panel" style={{ animationDelay: '0s', marginBottom: 16 }}>
          <div className="dashboard-panel__header">
            <span className="dashboard-panel__title"><MapPin size={16} /> Rastreo en Ruta</span>
            {busLocation && (
              <span style={{ fontSize: 12, color: '#16A34A' }}>
                ● Última actualización: {fmt(busLocation.recordedAt)}
                {busLocation.velocidad ? ` · ${busLocation.velocidad} km/h` : ''}
              </span>
            )}
            {!busLocation && parcel.status === EstadoEncomienda.EN_TRANSITO && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Sin datos GPS aún
              </span>
            )}
          </div>
          <div className="dashboard-panel__body" style={{ padding: 0 }}>
            <MapTracking
              originLat={parcel.originLat}
              originLng={parcel.originLng}
              originLabel={`Origen: ${parcel.originAddress}`}
              destinationLat={parcel.destinationLat}
              destinationLng={parcel.destinationLng}
              destinationLabel={`Destino: ${parcel.destinationAddress}`}
              busLat={busLocation?.lat}
              busLng={busLocation?.lng}
              busLabel={`Bus · ${parcel.assignedBusFlota ?? ''} ${parcel.assignedBusPlaca ?? ''}`.trim()}
              height={300}
            />
          </div>
        </div>
      )}

      {/* ─── Info Cards + Timeline ──────────────────────────── */}
      <div className="detalle-grid">
        {/* Columna izquierda: tarjetas de info */}
        <div className="detalle-info-col">

          {/* Remitente */}
          <div className="detalle-card">
            <h3 className="detalle-card__title"><User size={16} /> Remitente</h3>
            <div className="detalle-card__fields">
              <div><span>Nombre</span><strong>{parcel.senderName}</strong></div>
              <div><span>CI</span><strong>{parcel.senderCi}</strong></div>
              <div><span><Phone size={12} /> Teléfono</span><strong>{parcel.senderPhone}</strong></div>
              <div><span><Mail size={12} /> Email</span><strong>{parcel.senderEmail}</strong></div>
            </div>
          </div>

          {/* Destinatario */}
          <div className="detalle-card">
            <h3 className="detalle-card__title"><User size={16} /> Destinatario</h3>
            <div className="detalle-card__fields">
              <div><span>Nombre</span><strong>{parcel.recipientName}</strong></div>
              <div><span>CI</span><strong>{parcel.recipientCi}</strong></div>
              <div><span><Phone size={12} /> Teléfono</span><strong>{parcel.recipientPhone}</strong></div>
              {parcel.recipientEmail && (
                <div><span><Mail size={12} /> Email</span><strong>{parcel.recipientEmail}</strong></div>
              )}
            </div>
          </div>

          {/* Paquete */}
          <div className="detalle-card">
            <h3 className="detalle-card__title"><Package size={16} /> Detalles del paquete</h3>
            <div className="detalle-card__fields">
              <div><span>Contenido</span><strong>{parcel.content}</strong></div>
              <div><span><Weight size={12} /> Peso</span><strong>{parcel.weight} kg</strong></div>
              <div><span><MapPin size={12} /> Ruta</span><strong>{parcel.routeCode}</strong></div>
              <div><span>Origen</span><strong>{parcel.originAddress}</strong></div>
              <div><span>Destino</span><strong>{parcel.destinationAddress}</strong></div>
              {parcel.observations && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span>Observaciones</span><strong>{parcel.observations}</strong>
                </div>
              )}
              <div><span>Registrada</span><strong>{fmt(parcel.createdAt)}</strong></div>
              {parcel.deliveredAt && (
                <div><span>Entregada</span><strong>{fmt(parcel.deliveredAt)}</strong></div>
              )}
            </div>
          </div>

          {/* Bus asignado */}
          {parcel.assignedBusPlaca && (
            <div className="detalle-card">
              <h3 className="detalle-card__title"><Truck size={16} /> Transporte asignado</h3>
              <div className="detalle-card__fields">
                {parcel.assignedBusFlota && <div><span>Flota</span><strong>{parcel.assignedBusFlota}</strong></div>}
                <div><span>Placa</span><strong>{parcel.assignedBusPlaca}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Timeline + Acciones */}
        <div className="detalle-timeline-col">
          {/* Timeline de eventos */}
          <div className="detalle-card detalle-card--timeline">
            <h3 className="detalle-card__title"><Clock size={16} /> Historial de eventos</h3>
            {events.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px 0' }}>
                No hay eventos registrados aún.
              </p>
            ) : (
              <div className="rastreo-timeline">
                {events.map((ev, i) => {
                  const isCurrent = i === events.length - 1;
                  const isDone = !isCurrent;
                  return (
                    <div
                      key={ev.id}
                      className={`rastreo-timeline__item ${isDone ? 'rastreo-timeline__item--done' : ''} ${isCurrent ? 'rastreo-timeline__item--current' : ''}`}
                    >
                      <div className="rastreo-timeline__dot">
                        {isDone && <CheckCircle2 size={10} style={{ color: 'white' }} />}
                      </div>
                      <div className="rastreo-timeline__content">
                        <strong>{ESTADO_BADGE[ev.status]?.label ?? ev.status}</strong>
                        {ev.note && (
                          <span className="rastreo-timeline__detail">{ev.note}</span>
                        )}
                      </div>
                      <span className="rastreo-timeline__date">{fmt(ev.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel de acciones (solo personal interno) */}
          {canAct && (
            <div className="detalle-card">
              <h3 className="detalle-card__title">Acciones disponibles</h3>
              <div className="detalle-actions">

                {/* REGISTRADO → RECEPCIONADO (Taquilla) */}
                {parcel.status === EstadoEncomienda.REGISTRADO &&
                  (user!.rol === Rol.ADMINISTRADOR || user!.rol === Rol.TAQUILLA) && (
                    <button
                      className="btn btn--primary btn--full"
                      disabled={updatingStatus}
                      onClick={() => handleTransition(
                        EstadoEncomienda.RECEPCIONADO,
                        'Recepcionada físicamente en Taquilla',
                      )}
                    >
                      {updatingStatus ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                      Recepcionar en taquilla
                    </button>
                  )}

                {/* RECEPCIONADO → EN_TRANSITO (Bodega) */}
                {parcel.status === EstadoEncomienda.RECEPCIONADO &&
                  (user!.rol === Rol.ADMINISTRADOR || user!.rol === Rol.BODEGA) && (
                    <button
                      className="btn btn--primary btn--full"
                      disabled={updatingStatus}
                      onClick={() => handleTransition(
                        EstadoEncomienda.EN_TRANSITO,
                        'Cargada en bus y despachada',
                      )}
                    >
                      {updatingStatus ? <Loader2 size={15} className="spin" /> : <Truck size={15} />}
                      Registrar carga (En Tránsito)
                    </button>
                  )}

                {/* EN_TRANSITO → EN_DESTINO (Bodega) */}
                {parcel.status === EstadoEncomienda.EN_TRANSITO &&
                  (user!.rol === Rol.ADMINISTRADOR || user!.rol === Rol.BODEGA) && (
                    <button
                      className="btn btn--primary btn--full"
                      disabled={updatingStatus}
                      onClick={() => handleTransition(
                        EstadoEncomienda.EN_DESTINO,
                        'Descargada en terminal de destino',
                      )}
                    >
                      {updatingStatus ? <Loader2 size={15} className="spin" /> : <MapPin size={15} />}
                      Registrar descarga (En Destino)
                    </button>
                  )}

                {/* EN_DESTINO → DISPONIBLE (Bodega / Taquilla) */}
                {parcel.status === EstadoEncomienda.EN_DESTINO &&
                  (user!.rol === Rol.ADMINISTRADOR || user!.rol === Rol.BODEGA || user!.rol === Rol.TAQUILLA) && (
                    <button
                      className="btn btn--primary btn--full"
                      disabled={updatingStatus}
                      onClick={() => handleTransition(
                        EstadoEncomienda.DISPONIBLE,
                        'Disponible para retiro en ventanilla',
                      )}
                    >
                      {updatingStatus ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                      Marcar como disponible
                    </button>
                  )}

                {/* DISPONIBLE → ENTREGADO (Taquilla) */}
                {parcel.status === EstadoEncomienda.DISPONIBLE &&
                  (user!.rol === Rol.ADMINISTRADOR || user!.rol === Rol.TAQUILLA) && (
                    <button
                      className="btn btn--gold btn--full"
                      onClick={() => setShowCiModal(true)}
                    >
                      <CheckCircle2 size={15} /> Confirmar retiro
                    </button>
                  )}

                {/* ENTREGADO */}
                {parcel.status === EstadoEncomienda.ENTREGADO && (
                  <p style={{ fontSize: 13, color: '#16A34A', textAlign: 'center', padding: '8px 0' }}>
                    <CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> Envío completado exitosamente
                  </p>
                )}

                {/* Cancelar (no terminal) */}
                {parcel.status !== EstadoEncomienda.ENTREGADO &&
                  parcel.status !== EstadoEncomienda.CANCELADO &&
                  user?.rol === Rol.ADMINISTRADOR && (
                    <button
                      className="btn btn--danger-outline btn--full btn--sm"
                      style={{ marginTop: 8 }}
                      disabled={updatingStatus}
                      onClick={() => handleTransition(EstadoEncomienda.CANCELADO, 'Cancelada por administrador')}
                    >
                      Cancelar encomienda
                    </button>
                  )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── Modal CI para Retiro ──────────────────────────── */}
      {showCiModal && (
        <div className="modal-overlay" onClick={() => setShowCiModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Verificar identidad del destinatario</h3>
              <button className="modal__close" onClick={() => setShowCiModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Ingrese el CI del destinatario para confirmar la entrega de la encomienda{' '}
                <strong>{parcel.trackingNumber}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">CI del destinatario</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`CI registrado: ${parcel.recipientCi}`}
                  value={ciInput}
                  onChange={(e) => setCiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmarRetiro()}
                  autoFocus
                />
              </div>
              {actionMsg && !actionMsg.ok && (
                <div className="taq-scan-result taq-scan-result--error" style={{ marginTop: 8 }}>
                  <AlertCircle size={16} /> {actionMsg.text}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowCiModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn--gold"
                disabled={!ciInput.trim() || confirmando}
                onClick={handleConfirmarRetiro}
              >
                {confirmando ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                Confirmar retiro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
