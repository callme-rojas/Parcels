import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  Truck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { GET_INDICADORES_OPERATIVOS, GET_REPORTE_ENCOMIENDAS } from '../graphql/queries';

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  REGISTRADO: { label: 'Registrado', className: 'badge--blue' },
  RECEPCIONADO: { label: 'Recepcionado', className: 'badge--cyan' },
  EN_TRANSITO: { label: 'En Tránsito', className: 'badge--amber' },
  EN_DESTINO: { label: 'En Destino', className: 'badge--purple' },
  DISPONIBLE: { label: 'Disponible', className: 'badge--emerald' },
  ENTREGADO: { label: 'Entregado', className: 'badge--green' },
  CANCELADO: { label: 'Cancelado', className: 'badge--red' },
};

export default function ReportesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [page, setPage] = useState(1);

  // Simple debounce for search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: indData, loading: indLoading, error: indError } = useQuery<{ indicadoresOperativos: any }>(GET_INDICADORES_OPERATIVOS, {
    variables: { filter: {} },
    fetchPolicy: 'cache-and-network',
  });

  const { data: repData, loading: repLoading, error: repError } = useQuery<{ reporteEncomiendas: any }>(GET_REPORTE_ENCOMIENDAS, {
    variables: {
      filter: {
        page,
        pageSize: 15,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        routeCode: routeFilter || undefined,
      }
    },
    fetchPolicy: 'cache-and-network',
  });

  const indicadores = indData?.indicadoresOperativos;
  const reporte = repData?.reporteEncomiendas;

  const handleExportCSV = () => {
    // In a real app, this would download a CSV
    alert('Función de exportar CSV en desarrollo');
  };

  return (
    <div className="panel-page">
      <div className="dashboard-panel" style={{ marginBottom: '24px' }}>
        <div className="dashboard-panel__header">
          <h2 className="dashboard-panel__title">
            <BarChart3 size={20} />
            Indicadores Operativos (Últimos 30 días)
          </h2>
        </div>
        <div className="dashboard-panel__body">
          {indLoading && !indicadores ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Loader2 size={30} className="spin" style={{ color: 'var(--navy)' }} />
            </div>
          ) : indError ? (
            <div className="taq-scan-result taq-scan-result--error">
              <AlertCircle size={18} /> Error al cargar indicadores
            </div>
          ) : (
            <div className="detalle-grid">
              <div className="detalle-card">
                <h3 className="detalle-card__title"><CheckCircle2 size={16} /> Rendimiento de Entregas</h3>
                <div className="detalle-card__fields">
                  <div><span>Tasa de Éxito</span><strong style={{ fontSize: '18px', color: 'var(--green)' }}>{indicadores?.tasaEntregaExitosa}%</strong></div>
                  <div><span>Entregadas</span><strong>{indicadores?.totalEntregadas}</strong></div>
                  <div><span>Canceladas / Fallidas</span><strong style={{ color: 'var(--red)' }}>{indicadores?.totalCanceladas}</strong></div>
                </div>
              </div>
              <div className="detalle-card">
                <h3 className="detalle-card__title"><Truck size={16} /> Volumen Operativo</h3>
                <div className="detalle-card__fields">
                  <div><span>Total Registradas</span><strong>{indicadores?.totalRegistradas}</strong></div>
                  <div><span>En Tránsito</span><strong>{indicadores?.totalEnTransito}</strong></div>
                  <div><span>Disponibles en Destino</span><strong>{indicadores?.totalDisponibles}</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2 className="dashboard-panel__title">Historial de Encomiendas</h2>
          <button className="btn btn--secondary btn--sm" onClick={handleExportCSV}>
            <Download size={16} /> Exportar
          </button>
        </div>
        <div className="dashboard-panel__body">
          <div className="taq-actions">
            <div className="form-group" style={{ flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar por CI, Nombre, Guía..."
                  style={{ paddingLeft: 36 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group" style={{ width: 180 }}>
              <select
                className="form-input"
                value={routeFilter}
                onChange={(e) => {
                  setRouteFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas las rutas</option>
                <option value="SCZ-PQA">Santa Cruz → Pto. Quijarro</option>
                <option value="PQA-SCZ">Pto. Quijarro → Santa Cruz</option>
                <option value="SCZ-SJC">Santa Cruz → San José</option>
                <option value="SCZ-ROB">Santa Cruz → Roboré</option>
              </select>
            </div>
            <div className="form-group" style={{ width: 180 }}>
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos los estados</option>
                <option value="REGISTRADO">Registrado</option>
                <option value="RECEPCIONADO">Recepcionado</option>
                <option value="EN_TRANSITO">En Tránsito</option>
                <option value="EN_DESTINO">En Destino</option>
                <option value="DISPONIBLE">Disponible</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Ruta</th>
                  <th>Remitente</th>
                  <th>Destinatario</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {repLoading && !reporte && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                      <Loader2 size={24} className="spin" style={{ color: 'var(--navy)', margin: '0 auto' }} />
                    </td>
                  </tr>
                )}
                {!repLoading && reporte?.items.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron resultados.
                    </td>
                  </tr>
                )}
                {reporte?.items.map((enc: any) => (
                  <tr key={enc.id}>
                    <td>
                      <span className="data-table__code">{enc.trackingNumber}</span>
                    </td>
                    <td className="data-table__time">
                      {dateFormatter.format(new Date(enc.createdAt))}
                    </td>
                    <td>
                      <span className="data-table__route">
                        <MapPin size={14} /> {enc.routeCode}
                      </span>
                    </td>
                    <td>
                      <div>{enc.senderName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{enc.senderCi}</div>
                    </td>
                    <td>
                      <div>{enc.recipientName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{enc.recipientCi}</div>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_CONFIG[enc.status]?.className || ''}`}>
                        <span className="badge__dot" />
                        {STATUS_CONFIG[enc.status]?.label || enc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {reporte && reporte.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <button
                className="btn btn--secondary btn--sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span style={{ fontSize: '14px', alignSelf: 'center', color: 'var(--text-secondary)' }}>
                Página {page} de {reporte.totalPages}
              </span>
              <button
                className="btn btn--secondary btn--sm"
                disabled={page === reporte.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
