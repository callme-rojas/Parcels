import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
} from 'lucide-react';

// Mock KPI data (will come from BE-REP-03: Query resumenDashboard)
const MOCK_KPIS = [
  {
    label: 'Registradas Hoy',
    value: 24,
    change: '+12%',
    trend: 'up' as const,
    icon: <Package size={22} />,
    color: 'blue',
  },
  {
    label: 'En Tránsito',
    value: 18,
    change: '+5%',
    trend: 'up' as const,
    icon: <Truck size={22} />,
    color: 'amber',
  },
  {
    label: 'Entregadas Hoy',
    value: 31,
    change: '+22%',
    trend: 'up' as const,
    icon: <CheckCircle2 size={22} />,
    color: 'emerald',
  },
  {
    label: 'Disponibles Retiro',
    value: 7,
    change: '-3%',
    trend: 'down' as const,
    icon: <Clock size={22} />,
    color: 'purple',
  },
];

const MOCK_RECENT = [
  {
    codigo: 'TRV-2026-00142',
    remitente: 'Juan Pérez',
    destinatario: 'María García',
    ruta: 'Santa Cruz → La Paz',
    estado: 'REGISTRADO',
    fecha: 'Hace 5 min',
  },
  {
    codigo: 'TRV-2026-00141',
    remitente: 'Carlos López',
    destinatario: 'Ana Rodríguez',
    ruta: 'Cochabamba → Sucre',
    estado: 'EN_TRANSITO',
    fecha: 'Hace 20 min',
  },
  {
    codigo: 'TRV-2026-00140',
    remitente: 'Pedro Martínez',
    destinatario: 'Lucía Fernández',
    ruta: 'Santa Cruz → Cochabamba',
    estado: 'DISPONIBLE',
    fecha: 'Hace 1 hora',
  },
  {
    codigo: 'TRV-2026-00139',
    remitente: 'Roberto Suárez',
    destinatario: 'Diana Torres',
    ruta: 'La Paz → Oruro',
    estado: 'ENTREGADO',
    fecha: 'Hace 2 horas',
  },
  {
    codigo: 'TRV-2026-00138',
    remitente: 'Sofía Mendoza',
    destinatario: 'Miguel Flores',
    ruta: 'Santa Cruz → Tarija',
    estado: 'EN_TRANSITO',
    fecha: 'Hace 3 horas',
  },
];

const MOCK_ROUTES_STATS = [
  { ruta: 'Santa Cruz → La Paz', total: 45, porcentaje: 35 },
  { ruta: 'Cochabamba → Sucre', total: 28, porcentaje: 22 },
  { ruta: 'Santa Cruz → Cochabamba', total: 24, porcentaje: 19 },
  { ruta: 'La Paz → Oruro', total: 18, porcentaje: 14 },
  { ruta: 'Santa Cruz → Tarija', total: 13, porcentaje: 10 },
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

export default function DashboardPage() {
  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <section className="dashboard__kpis">
        {MOCK_KPIS.map((kpi) => (
          <div key={kpi.label} className={`kpi-card kpi-card--${kpi.color}`}>
            <div className="kpi-card__header">
              <span className="kpi-card__icon">{kpi.icon}</span>
              <span
                className={`kpi-card__trend kpi-card__trend--${kpi.trend}`}
              >
                {kpi.trend === 'up' ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {kpi.change}
              </span>
            </div>
            <div className="kpi-card__value">{kpi.value}</div>
            <div className="kpi-card__label">{kpi.label}</div>
          </div>
        ))}
      </section>

      {/* Charts Row */}
      <section className="dashboard__charts">
        {/* Recent Shipments */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2 className="dashboard-panel__title">
              <TrendingUp size={18} />
              Últimas Encomiendas
            </h2>
          </div>
          <div className="dashboard-panel__body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Ruta</th>
                  <th>Estado</th>
                  <th>Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT.map((enc) => (
                  <tr key={enc.codigo}>
                    <td>
                      <span className="data-table__code">{enc.codigo}</span>
                    </td>
                    <td>
                      <span className="data-table__route">
                        <MapPin size={14} />
                        {enc.ruta}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_CONFIG[enc.estado]?.className || ''}`}
                      >
                        {STATUS_CONFIG[enc.estado]?.label || enc.estado}
                      </span>
                    </td>
                    <td className="data-table__time">{enc.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Routes */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2 className="dashboard-panel__title">
              <Truck size={18} />
              Rutas más Activas
            </h2>
          </div>
          <div className="dashboard-panel__body">
            <div className="route-stats">
              {MOCK_ROUTES_STATS.map((r) => (
                <div key={r.ruta} className="route-stats__item">
                  <div className="route-stats__info">
                    <span className="route-stats__name">{r.ruta}</span>
                    <span className="route-stats__count">
                      {r.total} envíos
                    </span>
                  </div>
                  <div className="route-stats__bar">
                    <div
                      className="route-stats__bar-fill"
                      style={{ width: `${r.porcentaje}%` }}
                    />
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
