import { Warehouse, Truck, PackageCheck, PackageX } from 'lucide-react';

const MOCK_PENDING = [
  {
    codigo: 'TRV-2026-00139',
    destino: 'La Paz',
    peso: '3.2 kg',
    estado: 'RECEPCIONADO',
    remitente: 'Roberto Suárez',
  },
  {
    codigo: 'TRV-2026-00137',
    destino: 'Cochabamba',
    peso: '1.8 kg',
    estado: 'RECEPCIONADO',
    remitente: 'Diana Torres',
  },
  {
    codigo: 'TRV-2026-00135',
    destino: 'La Paz',
    peso: '4.5 kg',
    estado: 'RECEPCIONADO',
    remitente: 'Miguel Flores',
  },
];

const MOCK_BUSES = [
  { placa: 'ABC-1234', modelo: 'Mercedes Benz O500', ruta: 'Santa Cruz → La Paz', encomiendas: 12 },
  { placa: 'DEF-5678', modelo: 'Volvo B420R', ruta: 'Santa Cruz → Cochabamba', encomiendas: 8 },
];

export default function BodegaPage() {
  return (
    <div className="panel-page">
      {/* Stats */}
      <section className="dashboard__kpis">
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Warehouse size={22} /></span>
          </div>
          <div className="kpi-card__value">5</div>
          <div className="kpi-card__label">Por Clasificar</div>
        </div>
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Truck size={22} /></span>
          </div>
          <div className="kpi-card__value">2</div>
          <div className="kpi-card__label">Buses Activos</div>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><PackageCheck size={22} /></span>
          </div>
          <div className="kpi-card__value">20</div>
          <div className="kpi-card__label">Cargadas Hoy</div>
        </div>
        <div className="kpi-card kpi-card--purple">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><PackageX size={22} /></span>
          </div>
          <div className="kpi-card__value">15</div>
          <div className="kpi-card__label">Descargadas Hoy</div>
        </div>
      </section>

      <section className="dashboard__charts">
        {/* Pending Classification */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2 className="dashboard-panel__title">
              <Warehouse size={18} />
              Encomiendas por Clasificar
            </h2>
          </div>
          <div className="dashboard-panel__body">
            <div className="bodega-list">
              {MOCK_PENDING.map((enc) => (
                <div key={enc.codigo} className="bodega-card">
                  <div className="bodega-card__info">
                    <span className="bodega-card__code">{enc.codigo}</span>
                    <span className="bodega-card__detail">
                      {enc.remitente} → {enc.destino} · {enc.peso}
                    </span>
                  </div>
                  <div className="bodega-card__actions">
                    <button className="btn btn--sm btn--primary">
                      Asignar a Bus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Buses */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2 className="dashboard-panel__title">
              <Truck size={18} />
              Buses Activos
            </h2>
          </div>
          <div className="dashboard-panel__body">
            <div className="bodega-list">
              {MOCK_BUSES.map((bus) => (
                <div key={bus.placa} className="bodega-card">
                  <div className="bodega-card__info">
                    <span className="bodega-card__code">{bus.placa}</span>
                    <span className="bodega-card__detail">
                      {bus.modelo} · {bus.ruta}
                    </span>
                  </div>
                  <div className="bodega-card__badge">
                    {bus.encomiendas} enc.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
