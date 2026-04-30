import './ParcelList.css';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_TRANSIT: 'En Tránsito',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_ICONS = {
  PENDING: '⏳',
  IN_TRANSIT: '🚚',
  DELIVERED: '✅',
  CANCELLED: '❌',
};

export default function ParcelList({ parcels, loading, error, selectedParcel, onParcelSelect }) {
  if (loading) {
    return (
      <div className="parcel-list-loading">
        <div className="spinner" />
        <p>Cargando encomiendas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="parcel-list-error">
        <span className="error-icon">⚠️</span>
        <p>Error al cargar las encomiendas</p>
        <code>{error.message}</code>
      </div>
    );
  }

  if (!parcels || parcels.length === 0) {
    return (
      <div className="parcel-list-empty">
        <span className="empty-icon">📦</span>
        <p>No hay encomiendas registradas</p>
      </div>
    );
  }

  return (
    <div className="parcel-list">
      <div className="parcel-list-header">
        <h2>Encomiendas</h2>
        <span className="parcel-count">{parcels.length}</span>
      </div>
      <div className="parcel-items">
        {parcels.map((parcel) => (
          <div
            key={parcel.id}
            className={`parcel-card ${selectedParcel?.id === parcel.id ? 'selected' : ''}`}
            onClick={() => onParcelSelect?.(parcel)}
          >
            <div className="parcel-card-header">
              <span className="tracking-number">{parcel.trackingNumber}</span>
              <span className={`status-badge status-${parcel.status.toLowerCase().replace('_', '-')}`}>
                {STATUS_ICONS[parcel.status]} {STATUS_LABELS[parcel.status]}
              </span>
            </div>
            <div className="parcel-route">
              <div className="route-point">
                <span className="route-dot origin" />
                <div>
                  <span className="route-label">Origen</span>
                  <span className="route-address">{parcel.originAddress}</span>
                </div>
              </div>
              <div className="route-line" />
              <div className="route-point">
                <span className="route-dot destination" />
                <div>
                  <span className="route-label">Destino</span>
                  <span className="route-address">{parcel.destinationAddress}</span>
                </div>
              </div>
            </div>
            <div className="parcel-meta">
              <span>📬 {parcel.senderName} → {parcel.recipientName}</span>
              <span>⚖️ {parcel.weight} kg</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
