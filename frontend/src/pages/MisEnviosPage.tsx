import { Package, Plus, Search, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const MOCK_ENVIOS = [
  { codigo: 'EX-2026-SCZ-0048217', destino: 'Puerto Quijarro · Of. Central', destinatario: 'Juan C. Rojas V.', estado: 'EN_TRANSITO', fecha: '12 mar 2026' },
  { codigo: 'EX-2026-SCZ-0048190', destino: 'San José de Chiquitos', destinatario: 'María López', estado: 'ENTREGADO', fecha: '08 mar 2026' },
  { codigo: 'EX-2026-SCZ-0048165', destino: 'Roboré', destinatario: 'Pedro Aguilar', estado: 'ENTREGADO', fecha: '01 mar 2026' },
];

const estadoBadge: Record<string, { label: string; className: string }> = {
  REGISTRADO: { label: 'Pre-registrada', className: 'badge badge--gray' },
  RECEPCIONADO: { label: 'Recibida', className: 'badge badge--blue' },
  EN_TRANSITO: { label: 'En tránsito', className: 'badge badge--amber' },
  DISPONIBLE: { label: 'Disponible', className: 'badge badge--emerald' },
  ENTREGADO: { label: 'Entregada', className: 'badge badge--green' },
};

export default function MisEnviosPage() {
  const user = useAuthStore((s) => s.user);

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
        <input type="text" placeholder="Buscar en mis envíos por código o destinatario..." />
      </div>

      {/* Shipments table */}
      <div className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2 className="dashboard-panel__title"><Package size={18} /> Mis Envíos</h2>
        </div>
        <div className="dashboard-panel__body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Destinatario</th>
                <th>Destino</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ENVIOS.map((envio) => {
                const badge = estadoBadge[envio.estado];
                return (
                  <tr key={envio.codigo} className="data-table__row--clickable">
                    <td><span className="data-table__code">{envio.codigo}</span></td>
                    <td>{envio.destinatario}</td>
                    <td style={{ color: '#6B7280' }}>{envio.destino}</td>
                    <td>
                      <span className={badge?.className}>
                        <span className="badge__dot" /> {badge?.label}
                      </span>
                    </td>
                    <td className="data-table__time">{envio.fecha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
