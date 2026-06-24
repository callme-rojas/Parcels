import { useState, useEffect, useRef } from 'react';
import {
  Package, Search, Clock, ScanBarcode, CheckCircle2,
  MapPin, Loader2, AlertCircle, Navigation,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { GET_PARCEL_BY_TRACKING, GET_HISTORIAL_UBICACIONES_BUS } from '../graphql/queries';
import { useBusLocation } from '../hooks/useBusLocation';
import { ESTADO_CONFIG } from '../types';
import type { Parcel } from '../types';
import MapTracking from '../components/map/MapTracking';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

// ── Helpers ────────────────────────────────────────────────────
function fmt(iso?: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

const estadoBadge: Record<string, { label: string; className: string }> = {
  REGISTRADO:   { label: 'Pre-registrada',         className: 'badge badge--gray' },
  RECEPCIONADO: { label: 'Recibida en taquilla',   className: 'badge badge--cyan' },
  EN_TRANSITO:  { label: 'En tránsito',            className: 'badge badge--amber' },
  EN_DESTINO:   { label: 'En destino',             className: 'badge badge--purple' },
  DISPONIBLE:   { label: 'Disponible para retiro', className: 'badge badge--emerald' },
  ENTREGADO:    { label: 'Entregada',              className: 'badge badge--green' },
  CANCELADO:    { label: 'Cancelada',              className: 'badge badge--red' },
};

// ── Componente de resultado de rastreo ─────────────────────────
function ResultCard({ parcel }: { parcel: Parcel }) {
  const badge = estadoBadge[parcel.status] ?? { label: parcel.status, className: 'badge' };
  const events = parcel.events ?? [];
  const isEnTransito = parcel.status === 'EN_TRANSITO';
  const isEntregado = parcel.status === 'ENTREGADO';

  // Fetch GPS history for active parcels (in transit or nearby states)
  const showGpsHistory = ['EN_TRANSITO', 'EN_DESTINO', 'DISPONIBLE', 'ENTREGADO'].includes(parcel.status);
  const { data: gpsData } = useQuery<{ historialUbicacionesBus: any[] }>(
    GET_HISTORIAL_UBICACIONES_BUS,
    {
      variables: { parcelId: parcel.id },
      skip: !showGpsHistory,
      fetchPolicy: 'cache-and-network',
    }
  );
  const gpsHistory = gpsData?.historialUbicacionesBus ?? [];

  const { location: busLocation } = useBusLocation(
    isEnTransito ? parcel.id : undefined,
    3_000,
  );

  const showMap = showGpsHistory;

  return (
    <>
      {/* ── Tarjeta de resultado ──────────────────────────── */}
      <div className="rastreo-result">
        <div className="rastreo-result__header">
          <div>
            <span style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Resultado
            </span>
            <div className="rastreo-result__code">{parcel.trackingNumber}</div>
          </div>
          <span className={badge.className}>
            <span className="badge__dot" /> {badge.label}
          </span>
        </div>

        <div className="rastreo-result__grid">
          <div>
            <span className="rastreo-result__label">Remitente</span>
            <span className="rastreo-result__value">{parcel.senderName}</span>
          </div>
          <div>
            <span className="rastreo-result__label">Destinatario</span>
            <span className="rastreo-result__value">{parcel.recipientName}</span>
          </div>
          <div>
            <span className="rastreo-result__label">Origen</span>
            <span className="rastreo-result__value">{parcel.originAddress.split(',')[0]}</span>
          </div>
          <div>
            <span className="rastreo-result__label">Destino</span>
            <span className="rastreo-result__value">{parcel.destinationAddress.split(',')[0]}</span>
          </div>
          <div>
            <span className="rastreo-result__label">Peso</span>
            <span className="rastreo-result__value">{parcel.weight} kg</span>
          </div>
          <div>
            <span className="rastreo-result__label">Registrada</span>
            <span className="rastreo-result__value">{fmt(parcel.createdAt)}</span>
          </div>
          {parcel.assignedBusPlaca && (
            <div>
              <span className="rastreo-result__label">Bus asignado</span>
              <span className="rastreo-result__value">
                {parcel.assignedBusFlota} · {parcel.assignedBusPlaca}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mapa Mapbox ──────────────────────────────────── */}
      {showMap && (
        <section className="rastreo-timeline-section" style={{ gap: 16 }}>
          <div className="rastreo-info-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 10 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={15} /> Rastreo de ruta
              </h3>
              {busLocation && (
                <span style={{ fontSize: 11, color: '#16A34A', marginTop: 4, display: 'block' }}>
                  ● GPS actualizado: {fmt(busLocation.recordedAt)}
                  {busLocation.velocidad ? ` · ${busLocation.velocidad} km/h` : ''}
                </span>
              )}
              {!busLocation && isEnTransito && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Sin datos GPS disponibles — se actualizará automáticamente
                </span>
              )}
            </div>
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
              height={340}
            />
          </div>

          {/* ── Timeline ────────────────────────────────── */}
          <div className="rastreo-timeline-panel">
            <h3>Historial de eventos</h3>
            {events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin eventos registrados.</p>
            ) : (
              <div className="rastreo-timeline">
                {events.map((ev, i) => {
                  const isLast = i === events.length - 1;
                  // If parcel is fully delivered, all events including last are 'done' (green)
                  const isCurrent = isLast && !isEntregado;
                  const isDone = !isCurrent;
                  const evBadge = estadoBadge[ev.status];
                  return (
                    <div
                      key={ev.id}
                      className={`rastreo-timeline__item ${isDone ? 'rastreo-timeline__item--done' : ''} ${isCurrent ? 'rastreo-timeline__item--current' : ''}`}
                    >
                      <div className="rastreo-timeline__dot">
                        {isDone && <CheckCircle2 size={10} style={{ color: 'white' }} />}
                      </div>
                      <div className="rastreo-timeline__content">
                        <strong>{evBadge?.label ?? ev.status}</strong>
                        {ev.note && (
                          <span className="rastreo-timeline__detail">{ev.note}</span>
                        )}
                      </div>
                      <span className="rastreo-timeline__date">{fmt(ev.createdAt)}</span>
                    </div>
                  );
                })}

                {/* ── GPS Snapshots ─────────────────────── */}
                {gpsHistory.length > 0 && (
                  <>
                    <div className="rastreo-timeline__gps-header">
                      <Navigation size={13} style={{ color: 'var(--accent)' }} />
                      <span>Posiciones GPS registradas ({gpsHistory.length})</span>
                    </div>
                    {gpsHistory.map((gps: any, idx: number) => (
                      <div key={`gps-${idx}`} className="rastreo-timeline__item rastreo-timeline__item--gps">
                        <div className="rastreo-timeline__dot rastreo-timeline__dot--gps">
                          <Navigation size={8} style={{ color: 'white' }} />
                        </div>
                        <div className="rastreo-timeline__content">
                          <strong style={{ fontSize: 12, color: 'var(--accent)' }}>📍 En ruta</strong>
                          <span className="rastreo-timeline__detail">
                            {gps.lat.toFixed(4)}°, {gps.lng.toFixed(4)}°
                            {gps.velocidad ? ` · ${Math.round(gps.velocidad)} km/h` : ''}
                          </span>
                        </div>
                        <span className="rastreo-timeline__date">{fmt(gps.recordedAt)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Timeline solo (sin mapa, si no está en tránsito) ─ */}
      {!showMap && events.length > 0 && (
        <section className="rastreo-timeline-section">
          <div className="rastreo-timeline-panel" style={{ maxWidth: 700 }}>
            <h3>Historial de eventos</h3>
            <div className="rastreo-timeline">
              {events.map((ev, i) => {
                const isLast = i === events.length - 1;
                const isCurrent = isLast && !isEntregado;
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
                      <strong>{estadoBadge[ev.status]?.label ?? ev.status}</strong>
                      {ev.note && <span className="rastreo-timeline__detail">{ev.note}</span>}
                    </div>
                    <span className="rastreo-timeline__date">{fmt(ev.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

// ── Página principal de rastreo ────────────────────────────────
export default function RastreoPublicoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('code') ?? '');
  const [searched, setSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [fetchParcel, { data, loading, error }] = useLazyQuery<{
    parcelByTracking: Parcel;
  }>(GET_PARCEL_BY_TRACKING, { fetchPolicy: 'network-only' });

  const result: Parcel | null = data?.parcelByTracking ?? null;

  const handleScanSuccess = (text: string) => {
    setShowScanner(false);
    let tracking = text.trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.t) {
        tracking = parsed.t;
      }
    } catch (e) {
      // not a JSON, use raw text
    }
    setQuery(tracking);
    setSearched(true);
    setSearchParams({ code: tracking });
    fetchParcel({ variables: { trackingNumber: tracking } });
  };

  // Auto-search si hay code en la URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setQuery(code);
      setSearched(true);
      fetchParcel({ variables: { trackingNumber: code } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearched(true);
    setSearchParams({ code: trimmed });
    fetchParcel({ variables: { trackingNumber: trimmed } });
  };

  return (
    <div className="rastreo-page">
      {/* ── Public Navbar ────────────────────────────────── */}
      <nav className="rastreo-nav">
        <div className="rastreo-nav__left">
          <div className="rastreo-nav__logo">
            <Package size={20} strokeWidth={2.5} />
          </div>
          <span className="rastreo-nav__brand">Sistema de <span>Encomiendas</span></span>
        </div>
        <div className="rastreo-nav__links">
          <a href="/rastreo" className="rastreo-nav__link rastreo-nav__link--active">Rastrear</a>
          <a href="/enviar" className="rastreo-nav__link">Enviar encomienda</a>
          <a href="/login" className="btn btn--primary btn--sm">Iniciar sesión</a>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="rastreo-hero">
        <div className="rastreo-hero__content">
          <h1 className="rastreo-hero__title">
            Rastrea tu encomienda en la ruta{' '}
            <span className="rastreo-hero__highlight">Santa Cruz · Puerto Quijarro</span>
          </h1>
          <p className="rastreo-hero__desc">
            Ingresa tu número de rastreo o escanea el código de barras de la etiqueta.
            Sigue el bus en el mapa en tiempo real, sin llamadas ni colas.
          </p>

          <form className="rastreo-search" onSubmit={handleSearch}>
            <input
              ref={inputRef}
              type="text"
              className="rastreo-search__input"
              placeholder="Ej: EX-2026-SCZ-0048217"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searched) setSearched(false);
              }}
              autoFocus
            />
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              Rastrear envío
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              title="Escanear código de barras"
              onClick={() => setShowScanner(true)}
            >
              <ScanBarcode size={18} /> Escanear
            </button>
          </form>

          <div className="rastreo-hero__stats">
            <span><span className="rastreo-hero__dot rastreo-hero__dot--green" /> Sistema activo</span>
            <span><span className="rastreo-hero__dot rastreo-hero__dot--blue" /> Rastreo en tiempo real</span>
          </div>
        </div>

        {/* ── Loading ────────────────────────────────────── */}
        {loading && (
          <div className="rastreo-result rastreo-result--loading">
            <Loader2 size={36} className="spin" style={{ margin: 'auto', display: 'block' }} />
            <p style={{ textAlign: 'center', color: '#6B7280', marginTop: 12 }}>
              Buscando encomienda...
            </p>
          </div>
        )}

        {/* ── Not found ─────────────────────────────────── */}
        {!loading && searched && error && (
          <div className="rastreo-result" style={{ textAlign: 'center', padding: 40 }}>
            <AlertCircle size={40} style={{ color: '#EF4444', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#6B7280' }}>
              No se encontró ninguna encomienda con el código <strong>{query}</strong>.
            </p>
            <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
              Verifica que el número sea correcto.
            </p>
          </div>
        )}
      </section>

      {/* ── Result ─────────────────────────────────────────── */}
      {!loading && result && (
        <ResultCard parcel={result} />
      )}

      {/* ── Steps (cuando no hay resultado) ─────────────── */}
      {!result && !loading && !searched && (
        <section className="rastreo-steps">
          <div className="rastreo-step">
            <h3>1. Registra en línea</h3>
            <p>Completa los datos del remitente, destinatario y contenido. Obtienes una etiqueta PDF417 lista para imprimir.</p>
          </div>
          <div className="rastreo-step">
            <h3>2. Entrega en oficina</h3>
            <p>El personal de taquilla escanea la etiqueta, verifica el paquete y confirma la recepción en el sistema.</p>
          </div>
          <div className="rastreo-step">
            <h3>3. Sigue al bus</h3>
            <p>Visualiza la ubicación del bus en el mapa y recibe actualizaciones cuando tu paquete esté disponible para retiro.</p>
          </div>
        </section>
      )}

      {/* ── Stats bar (si hay resultado) ─────────────────── */}
      {!loading && result && (
        <section className="rastreo-stats-bar">
          <div className="rastreo-stat">
            <span className="rastreo-stat__label">Contenido</span>
            <span className="rastreo-stat__value">{result.content}</span>
          </div>
          <div className="rastreo-stat">
            <span className="rastreo-stat__label">Peso declarado</span>
            <span className="rastreo-stat__value">{result.weight} kg</span>
          </div>
          <div className="rastreo-stat">
            <span className="rastreo-stat__label">Ruta</span>
            <span className="rastreo-stat__value">{result.routeCode}</span>
          </div>
          <div className="rastreo-stat">
            <span className="rastreo-stat__label">Eventos</span>
            <span className="rastreo-stat__value" style={{ color: '#C9A84C' }}>
              <Clock size={13} style={{ verticalAlign: 'middle' }} /> {result.events?.length ?? 0} registros
            </span>
          </div>
        </section>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
