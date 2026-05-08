import { Package, Search, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const MOCK_ENCOMIENDAS = [
  {
    codigo: 'TRV-2026-00142',
    remitente: 'Juan Pérez',
    destinatario: 'María García',
    ruta: 'Santa Cruz → La Paz',
    estado: 'REGISTRADO',
    peso: '2.5 kg',
    fecha: '07/05/2026',
  },
  {
    codigo: 'TRV-2026-00141',
    remitente: 'Carlos López',
    destinatario: 'Ana Rodríguez',
    ruta: 'Cochabamba → Sucre',
    estado: 'RECEPCIONADO',
    peso: '1.2 kg',
    fecha: '07/05/2026',
  },
  {
    codigo: 'TRV-2026-00140',
    remitente: 'Pedro Martínez',
    destinatario: 'Lucía Fernández',
    ruta: 'Santa Cruz → Cochabamba',
    estado: 'DISPONIBLE',
    peso: '5.0 kg',
    fecha: '06/05/2026',
  },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  REGISTRADO: { label: 'Registrado', className: 'badge--blue' },
  RECEPCIONADO: { label: 'Recepcionado', className: 'badge--cyan' },
  EN_TRANSITO: { label: 'En Tránsito', className: 'badge--amber' },
  EN_DESTINO: { label: 'En Destino', className: 'badge--purple' },
  DISPONIBLE: { label: 'Disponible', className: 'badge--emerald' },
  ENTREGADO: { label: 'Entregado', className: 'badge--green' },
  CANCELADO: { label: 'Cancelado', className: 'badge--red' },
};

export default function TaquillaPage() {
  const [searchCode, setSearchCode] = useState('');

  return (
    <div className="panel-page">
      {/* Quick Actions */}
      <section className="panel-page__actions">
        <div className="action-card action-card--primary">
          <div className="action-card__icon">
            <Package size={24} />
          </div>
          <div className="action-card__content">
            <h3>Nueva Encomienda</h3>
            <p>Registrar un nuevo paquete</p>
          </div>
          <ArrowRight size={20} className="action-card__arrow" />
        </div>

        <div className="action-card">
          <div className="action-card__icon">
            <Search size={24} />
          </div>
          <div className="action-card__content">
            <h3>Buscar Encomienda</h3>
            <p>Buscar por código de tracking</p>
          </div>
          <ArrowRight size={20} className="action-card__arrow" />
        </div>
      </section>

      {/* Search */}
      <section className="panel-page__search">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por código, remitente o destinatario..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
          />
        </div>
      </section>

      {/* Table */}
      <section className="panel-page__table">
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2 className="dashboard-panel__title">
              Encomiendas Recientes
            </h2>
          </div>
          <div className="dashboard-panel__body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Remitente</th>
                  <th>Destinatario</th>
                  <th>Ruta</th>
                  <th>Peso</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ENCOMIENDAS.map((enc) => (
                  <tr key={enc.codigo} className="data-table__row--clickable">
                    <td>
                      <span className="data-table__code">{enc.codigo}</span>
                    </td>
                    <td>{enc.remitente}</td>
                    <td>{enc.destinatario}</td>
                    <td>{enc.ruta}</td>
                    <td>{enc.peso}</td>
                    <td>
                      <span className={`badge ${STATUS_CONFIG[enc.estado]?.className}`}>
                        {STATUS_CONFIG[enc.estado]?.label}
                      </span>
                    </td>
                    <td className="data-table__time">{enc.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
