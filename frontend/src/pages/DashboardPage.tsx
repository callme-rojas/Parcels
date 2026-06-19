import { useQuery } from '@apollo/client/react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  AlertCircle,
  Loader2,
  DollarSign,
  Award,
  XCircle,
} from 'lucide-react';
import { GET_RESUMEN_DASHBOARD, GET_INDICADORES_OPERATIVOS } from '../graphql/queries';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'Justo ahora';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Hace ${diffInDays} d`;
}

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
  const { data, loading, error } = useQuery<{ resumenDashboard: any }>(GET_RESUMEN_DASHBOARD, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });

  const { data: indData } = useQuery<{ indicadoresOperativos: any }>(GET_INDICADORES_OPERATIVOS, {
    variables: { filter: {} }, // last 30 days by default
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });

  const ind = indData?.indicadoresOperativos;

  if (loading && !data) {
    return (
      <div className="panel-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={40} className="spin" style={{ color: 'var(--navy)' }} />
        <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Cargando resumen del dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-page">
        <div className="taq-scan-result taq-scan-result--error">
          <AlertCircle size={18} />
          <div>
            <strong>Error al cargar el dashboard</strong>
            <span>{error.message}</span>
          </div>
        </div>
      </div>
    );
  }

  const resumen = data?.resumenDashboard;

  if (!resumen) return null;

  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <section className="dashboard__kpis">
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Package size={22} /></span>
          </div>
          <div className="kpi-card__value">{resumen.registradasHoy}</div>
          <div className="kpi-card__label">Registradas Hoy</div>
        </div>
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Truck size={22} /></span>
          </div>
          <div className="kpi-card__value">{resumen.enTransito}</div>
          <div className="kpi-card__label">En Tránsito (Global)</div>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><CheckCircle2 size={22} /></span>
          </div>
          <div className="kpi-card__value">{resumen.entregadasHoy}</div>
          <div className="kpi-card__label">Entregadas Hoy</div>
        </div>
        <div className="kpi-card kpi-card--purple">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Clock size={22} /></span>
          </div>
          <div className="kpi-card__value">{resumen.disponiblesRetiro}</div>
          <div className="kpi-card__label">Disponibles Retiro (Global)</div>
        </div>
      </section>

      {/* ── Operational KPIs (30 days) ───────────────────── */}
      {ind && (
        <section style={{ padding: '0 0 4px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingLeft: 2 }}>
            Indicadores Últimos 30 días
          </div>
          <div className="dashboard__kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div className="kpi-card kpi-card--emerald">
              <div className="kpi-card__header"><span className="kpi-card__icon"><TrendingUp size={20} /></span></div>
              <div className="kpi-card__value">{ind.tasaEntregaExitosa}%</div>
              <div className="kpi-card__label">Tasa de Éxito</div>
            </div>
            <div className="kpi-card kpi-card--blue">
              <div className="kpi-card__header"><span className="kpi-card__icon"><DollarSign size={20} /></span></div>
              <div className="kpi-card__value" style={{ fontSize: 20 }}>{(ind.montoTotalPagado ?? 0).toFixed(0)} Bs</div>
              <div className="kpi-card__label">Recaudado</div>
            </div>
            <div className="kpi-card kpi-card--amber">
              <div className="kpi-card__header"><span className="kpi-card__icon"><Clock size={20} /></span></div>
              <div className="kpi-card__value" style={{ fontSize: 20 }}>{(ind.montoTotalPendiente ?? 0).toFixed(0)} Bs</div>
              <div className="kpi-card__label">Pendiente de Cobro</div>
            </div>
            <div className="kpi-card kpi-card--purple">
              <div className="kpi-card__header"><span className="kpi-card__icon"><Award size={20} /></span></div>
              <div className="kpi-card__value">{ind.totalVentaEtiquetas ?? 0}</div>
              <div className="kpi-card__label">Etiquetas Vendidas</div>
            </div>
            <div className="kpi-card" style={{ borderColor: 'var(--danger)' }}>
              <div className="kpi-card__header"><span className="kpi-card__icon" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)' }}><XCircle size={20} /></span></div>
              <div className="kpi-card__value" style={{ color: 'var(--danger)' }}>{ind.totalCanceladas ?? 0}</div>
              <div className="kpi-card__label">Canceladas</div>
            </div>
          </div>
        </section>
      )}

      {/* Charts Row */}
      <section className="dashboard__charts">
        {/* Recent Shipments */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2 className="dashboard-panel__title">
              <TrendingUp size={18} />
              Últimas Encomiendas Registradas
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
                {resumen.ultimasEncomiendas.length === 0 && (
                   <tr>
                     <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay encomiendas recientes</td>
                   </tr>
                )}
                {resumen.ultimasEncomiendas.map((enc: any) => (
                  <tr key={enc.id}>
                    <td>
                      <span className="data-table__code">{enc.trackingNumber}</span>
                    </td>
                    <td>
                      <span className="data-table__route">
                        <MapPin size={14} />
                        {enc.routeLabel || enc.routeCode}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_CONFIG[enc.status]?.className || ''}`}
                      >
                        <span className="badge__dot" />
                        {STATUS_CONFIG[enc.status]?.label || enc.status}
                      </span>
                    </td>
                    <td className="data-table__time">
                      {formatTimeAgo(enc.createdAt)}
                    </td>
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
              Rutas más Activas (Últimos 7 días)
            </h2>
          </div>
          <div className="dashboard-panel__body">
            <div className="route-stats">
              {resumen.topRutas.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '20px 0' }}>
                  No hay datos suficientes de rutas.
                </p>
              )}
              {resumen.topRutas.map((r: any) => (
                <div key={r.routeCode} className="route-stats__item">
                  <div className="route-stats__info">
                    <span className="route-stats__name">{r.routeLabel || r.routeCode}</span>
                    <span className="route-stats__count">
                      {r.total} envíos
                    </span>
                  </div>
                  <div className="route-stats__bar">
                    <div
                      className="route-stats__bar-fill"
                      style={{ width: `${Math.max(1, Math.min(100, r.porcentaje))}%` }}
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
