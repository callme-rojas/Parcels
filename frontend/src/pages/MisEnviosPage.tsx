import { useState, useMemo } from 'react';
import { Package, Plus, Search, ArrowRight, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useParcels } from '../hooks/useParcel';
import { ESTADO_CONFIG } from '../types';

export default function MisEnviosPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // Traer todas las encomiendas del sistema (el backend filtra por auth)
  const { parcels, loading, error } = useParcels();

  // Filtrar del lado del cliente: encomiendas donde el email del remitente
  // o del destinatario coincida con el usuario logueado
  const misEnvios = useMemo(() => {
    if (!user || !parcels.length) return parcels;
    const email = user.email.toLowerCase();
    return parcels.filter(
      (p) =>
        p.senderEmail?.toLowerCase() === email ||
        p.recipientEmail?.toLowerCase() === email,
    );
  }, [parcels, user]);

  // Filtro local por búsqueda de texto
  const filtered = useMemo(() => {
    if (!query.trim()) return misEnvios;
    const q = query.toLowerCase();
    return misEnvios.filter(
      (p) =>
        p.trackingNumber.toLowerCase().includes(q) ||
        p.recipientName.toLowerCase().includes(q) ||
        p.senderName.toLowerCase().includes(q) ||
        p.routeCode.toLowerCase().includes(q),
    );
  }, [misEnvios, query]);

  return (
    <div className="panel-page">
      {/* Quick actions */}
      <div className="panel-page__actions">
        <Link to="/crear-envio" className="action-card action-card--primary" style={{ textDecoration: 'none' }}>
          <div className="action-card__icon"><Plus size={24} /></div>
          <div className="action-card__content">
            <h3>Nuevo envío</h3>
            <p>Registra una encomienda y genera tu etiqueta PDF417</p>
          </div>
          <div className="action-card__arrow"><ArrowRight size={18} /></div>
        </Link>

        <Link to="/rastreo" className="action-card" style={{ textDecoration: 'none' }}>
          <div className="action-card__icon"><MapPin size={24} /></div>
          <div className="action-card__content">
            <h3>Rastrear un envío</h3>
            <p>Consulta el estado de cualquier encomienda</p>
          </div>
          <div className="action-card__arrow"><ArrowRight size={18} /></div>
        </Link>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por código, destinatario o ruta..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Shipments table */}
      <div className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2 className="dashboard-panel__title">
            <Package size={18} /> Mis Envíos
            {!loading && (
              <span className="badge badge--blue" style={{ marginLeft: 8 }}>
                {filtered.length}
              </span>
            )}
          </h2>
        </div>
        <div className="dashboard-panel__body" style={{ padding: 0 }}>

          {/* Loading */}
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={28} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
              Cargando tus envíos...
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: 24, textAlign: 'center', color: '#EF4444' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: 13 }}>Error al cargar: {error.message}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={40} strokeWidth={1.2} style={{ margin: '0 auto 12px', display: 'block' }} />
              {query ? (
                <p style={{ fontSize: 14 }}>No hay envíos que coincidan con tu búsqueda.</p>
              ) : (
                <>
                  <p style={{ fontSize: 14, marginBottom: 12 }}>
                    Aún no tienes envíos registrados con este correo ({user?.email}).
                  </p>
                  <Link to="/crear-envio" className="btn btn--primary btn--sm">
                    <Plus size={14} /> Registrar mi primer envío
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Table */}
          {!loading && !error && filtered.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Destinatario</th>
                  <th>Destino</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((envio) => {
                  const cfg = ESTADO_CONFIG[envio.status];
                  return (
                    <tr
                      key={envio.id}
                      className="data-table__row--clickable"
                      onClick={() => navigate(`/encomiendas/${envio.id}`)}
                    >
                      <td><span className="data-table__code">{envio.trackingNumber}</span></td>
                      <td>{envio.recipientName}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{envio.destinationAddress.split(',')[0]}</td>
                      <td>
                        <span className={`badge ${cfg?.badgeClass ?? 'badge--gray'}`}>
                          <span className="badge__dot" /> {cfg?.label ?? envio.status}
                        </span>
                      </td>
                      <td className="data-table__time">
                        {new Intl.DateTimeFormat('es-BO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        }).format(new Date(envio.createdAt))}
                      </td>
                      <td>
                        <button
                          className="enc-action-btn"
                          title="Ver detalle"
                          onClick={(e) => { e.stopPropagation(); navigate(`/encomiendas/${envio.id}`); }}
                        >
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
