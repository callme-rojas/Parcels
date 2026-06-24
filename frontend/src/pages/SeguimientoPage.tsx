import { useState, useMemo } from 'react';
import { MapPin, Package, Truck, Search, Loader2, AlertCircle } from 'lucide-react';
import { useParcels } from '../hooks/useParcel';
import { useBusLocation } from '../hooks/useBusLocation';
import { EstadoEncomienda, ESTADO_CONFIG } from '../types';
import type { Parcel } from '../types';
import MapTracking from '../components/map/MapTracking';

// ── Panel lateral: encomiendas en tránsito ──────────────────────
function ParcelSidebar({
  parcels,
  selected,
  onSelect,
}: {
  parcels: Parcel[];
  selected: Parcel | null;
  onSelect: (p: Parcel) => void;
}) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return parcels;
    const lq = q.toLowerCase();
    return parcels.filter(
      (p) =>
        p.trackingNumber.toLowerCase().includes(lq) ||
        p.senderName.toLowerCase().includes(lq) ||
        p.recipientName.toLowerCase().includes(lq) ||
        p.routeCode.toLowerCase().includes(lq),
    );
  }, [parcels, q]);

  return (
    <div className="seg-sidebar">
      <div className="seg-sidebar__header">
        <h3><Truck size={16} /> En Tránsito ({parcels.length})</h3>
      </div>
      <div className="seg-sidebar__search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Buscar por código o ruta..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="seg-sidebar__list">
        {filtered.length === 0 && (
          <p className="seg-sidebar__empty">No hay encomiendas en tránsito.</p>
        )}
        {filtered.map((p) => (
          <button
            key={p.id}
            className={`seg-sidebar__item ${selected?.id === p.id ? 'seg-sidebar__item--active' : ''}`}
            onClick={() => onSelect(p)}
          >
            <div className="seg-sidebar__item-code">{p.trackingNumber}</div>
            <div className="seg-sidebar__item-meta">
              <span><Package size={11} /> {p.routeCode}</span>
              <span style={{ color: 'var(--text-muted)' }}>{p.weight} kg</span>
            </div>
            <div className="seg-sidebar__item-names">
              {p.senderName} → {p.recipientName}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Vista de mapa activo (con encomienda seleccionada) ──────────
function MapPanel({ parcel }: { parcel: Parcel }) {
  const { location, loading } = useBusLocation(parcel.id, 3_000);

  function fmt(iso?: string | null) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  }

  return (
    <div className="seg-map-panel">
      {/* Header del panel */}
      <div className="seg-map-panel__header">
        <div>
          <span className="seg-map-panel__code">{parcel.trackingNumber}</span>
          <span className="seg-map-panel__route">{parcel.originAddress.split(',')[0]} → {parcel.destinationAddress.split(',')[0]}</span>
        </div>
        <div className="seg-map-panel__bus">
          {parcel.assignedBusPlaca ? (
            <>
              <Truck size={15} />
              <span>{parcel.assignedBusFlota} · {parcel.assignedBusPlaca}</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sin bus asignado</span>
          )}
        </div>
      </div>

      {/* GPS indicator */}
      <div className="seg-map-panel__gps">
        {loading ? (
          <span><Loader2 size={13} className="spin" /> Obteniendo ubicación GPS...</span>
        ) : location ? (
          <>
            <span style={{ color: '#16A34A' }}>● GPS activo</span>
            <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>
              Última sync: {fmt(location.recordedAt)}
              {location.velocidad ? ` · ${location.velocidad} km/h` : ''}
            </span>
            <span style={{ marginLeft: 12, color: 'var(--text-muted)', fontSize: 11 }}>
              ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
            </span>
          </>
        ) : (
          <span style={{ color: '#F59E0B' }}>⚠ Sin datos GPS — esperando sincronización del conductor</span>
        )}
      </div>

      {/* Mapa */}
      <div className="seg-map-panel__map">
        <MapTracking
          originLat={parcel.originLat}
          originLng={parcel.originLng}
          originLabel={`Origen: ${parcel.originAddress}`}
          destinationLat={parcel.destinationLat}
          destinationLng={parcel.destinationLng}
          destinationLabel={`Destino: ${parcel.destinationAddress}`}
          busLat={location?.lat}
          busLng={location?.lng}
          busLabel={`${parcel.assignedBusFlota ?? 'Bus'} · ${parcel.assignedBusPlaca ?? ''}`}
          height="100%"
          routeCode={parcel.routeCode}
        />
      </div>

      {/* Stats rápidos */}
      <div className="seg-map-panel__stats">
        <div className="rastreo-stat">
          <span className="rastreo-stat__label">Remitente</span>
          <span className="rastreo-stat__value">{parcel.senderName}</span>
        </div>
        <div className="rastreo-stat">
          <span className="rastreo-stat__label">Destinatario</span>
          <span className="rastreo-stat__value">{parcel.recipientName}</span>
        </div>
        <div className="rastreo-stat">
          <span className="rastreo-stat__label">Peso</span>
          <span className="rastreo-stat__value">{parcel.weight} kg</span>
        </div>
        <div className="rastreo-stat">
          <span className="rastreo-stat__label">Estado</span>
          <span className="rastreo-stat__value">
            <span className={`badge ${ESTADO_CONFIG[parcel.status]?.badgeClass ?? 'badge--gray'}`} style={{ fontSize: 11 }}>
              <span className="badge__dot" /> {ESTADO_CONFIG[parcel.status]?.label ?? parcel.status}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Página principal de seguimiento ────────────────────────────
export default function SeguimientoPage() {
  const [selected, setSelected] = useState<Parcel | null>(null);

  // Traer encomiendas en tránsito
  const { parcels, loading, error } = useParcels({ status: EstadoEncomienda.EN_TRANSITO });

  if (loading) {
    return (
      <div className="panel-page">
        <div className="empty-state">
          <Loader2 size={40} className="spin" />
          <p>Cargando encomiendas en tránsito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-page">
        <div className="empty-state">
          <AlertCircle size={40} style={{ color: '#EF4444' }} />
          <h2>Error al cargar datos</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seg-layout">
      {/* Panel lateral con lista */}
      <ParcelSidebar
        parcels={parcels}
        selected={selected}
        onSelect={setSelected}
      />

      {/* Área del mapa */}
      {selected ? (
        <MapPanel parcel={selected} />
      ) : (
        <div className="seg-map-empty">
          <MapPin size={56} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
          <h2>Selecciona una encomienda</h2>
          <p>Elige una encomienda en tránsito de la lista de la izquierda para ver su posición GPS en el mapa.</p>
          {parcels.length === 0 && (
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 13 }}>
              No hay encomiendas en tránsito en este momento.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
