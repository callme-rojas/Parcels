import React, { useState, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  BarChart3,
  Search,
  Download,
  AlertCircle,
  Loader2,
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  DollarSign,
  Printer,
  Users,
  Building2,
  Package,
  TrendingUp,
  Clock,
  Award,
  Banknote,
} from 'lucide-react';
import {
  GET_INDICADORES_OPERATIVOS,
  GET_REPORTE_ENCOMIENDAS,
  GET_USERS,
  GET_SUCURSALES,
  GET_BUSES,
} from '../graphql/queries';

// ─── Types ─────────────────────────────────────────────────────

type PeriodKey = 'today' | 'week' | 'month' | '3months' | 'all';
type ReportType = 'encomiendas' | 'usuarios' | 'sucursales' | 'buses';

// ─── Period Helpers ────────────────────────────────────────────

function getPeriodDates(key: PeriodKey): { fechaDesde?: string; fechaHasta?: string } {
  const now = new Date();
  const start = (days: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };
  const end = (): string => {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  };
  if (key === 'all') return {};
  if (key === 'today') return { fechaDesde: start(0), fechaHasta: end() };
  if (key === 'week') return { fechaDesde: start(7), fechaHasta: end() };
  if (key === 'month') return { fechaDesde: start(30), fechaHasta: end() };
  if (key === '3months') return { fechaDesde: start(90), fechaHasta: end() };
  return {};
}

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Última semana' },
  { key: 'month', label: 'Último mes' },
  { key: '3months', label: 'Últimos 3 meses' },
  { key: 'all', label: 'Todo el tiempo' },
];

// ─── Formatters ─────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
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

// ─── Stat Card Premium Component ──────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'emerald';
}

const COLOR_MAP = {
  green:   { bg: '#22C55E', pale: 'rgba(34,197,94,0.10)',    text: '#16A34A' },
  blue:    { bg: '#3B82F6', pale: 'rgba(59,130,246,0.10)',   text: '#2563EB' },
  amber:   { bg: '#F59E0B', pale: 'rgba(245,158,11,0.10)',   text: '#D97706' },
  red:     { bg: '#EF4444', pale: 'rgba(239,68,68,0.10)',    text: '#DC2626' },
  purple:  { bg: '#8B5CF6', pale: 'rgba(139,92,246,0.10)',   text: '#7C3AED' },
  emerald: { bg: '#10B981', pale: 'rgba(16,185,129,0.10)',   text: '#059669' },
};

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="stat-card-print" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.18s, box-shadow 0.18s',
    }}>
      {/* Background blob */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 110, height: 110, borderRadius: '50%',
        background: c.pale, pointerEvents: 'none',
      }} />
      {/* Icon badge */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: c.pale, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: c.text, flexShrink: 0,
      }}>
        {icon}
      </div>
      {/* Big number */}
      <div style={{ fontSize: 38, fontWeight: 800, color: c.text, lineHeight: 1 }}>
        {value}
      </div>
      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function ReportesPage() {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [reportType, setReportType] = useState<ReportType>('encomiendas');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [page, setPage] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  // Debounce
  React.useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(h);
  }, [searchTerm]);

  const periodDates = getPeriodDates(period);
  const filterVars = periodDates.fechaDesde
    ? { fechaDesde: periodDates.fechaDesde, fechaHasta: periodDates.fechaHasta }
    : {};

  // ── Queries ─────────────────────────────────────────────────
  const { data: indData, loading: indLoading, error: indError } = useQuery<{ indicadoresOperativos: any }>(
    GET_INDICADORES_OPERATIVOS,
    { variables: { filter: filterVars }, fetchPolicy: 'cache-and-network' }
  );

  const { data: repData, loading: repLoading } = useQuery<{ reporteEncomiendas: any }>(
    GET_REPORTE_ENCOMIENDAS,
    {
      variables: {
        filter: {
          page, pageSize: 15,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          routeCode: routeFilter || undefined,
          ...filterVars,
        }
      },
      fetchPolicy: 'cache-and-network',
      skip: reportType !== 'encomiendas',
    }
  );

  const { data: usersData, loading: usersLoading } = useQuery<{ users: any[] }>(
    GET_USERS,
    { fetchPolicy: 'cache-and-network', skip: reportType !== 'usuarios' }
  );

  const { data: sucData, loading: sucLoading } = useQuery<{ sucursales: any[] }>(
    GET_SUCURSALES,
    { fetchPolicy: 'cache-and-network', skip: reportType !== 'sucursales' }
  );

  const { data: busesData, loading: busesLoading } = useQuery<{ buses: any[] }>(
    GET_BUSES,
    { fetchPolicy: 'cache-and-network', skip: reportType !== 'buses' }
  );

  const ind = indData?.indicadoresOperativos;
  const reporte = repData?.reporteEncomiendas;

  // ── Print ────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── PDF Export ───────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const periodLabel = PERIODS.find(p => p.key === period)?.label ?? 'Reporte';
      pdf.save(`Reporte_${periodLabel}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    }
  };

  const REPORT_TYPES = [
    { key: 'encomiendas' as ReportType, label: 'Encomiendas', icon: <Package size={14} /> },
    { key: 'usuarios'   as ReportType, label: 'Usuarios',    icon: <Users size={14} /> },
    { key: 'sucursales' as ReportType, label: 'Sucursales',  icon: <Building2 size={14} /> },
    { key: 'buses'      as ReportType, label: 'Buses',       icon: <Truck size={14} /> },
  ];

  return (
    <div className="panel-page" id="reportes-page">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #reportes-page-content, #reportes-page-content * {
            visibility: visible;
          }
          #reportes-page-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print, .btn, select, input, .dashboard-panel__header button, .form-group, .data-table th:last-child, .data-table td:last-child {
            display: none !important;
          }
          .print-only-header {
            display: block !important;
          }
          .dashboard-panel {
            border: none !important;
            box-shadow: none !important;
            margin-bottom: 24px !important;
            background: transparent !important;
          }
          .dashboard-panel__header {
            border-bottom: 2px solid #1e293b !important;
            padding-bottom: 8px !important;
            margin-bottom: 16px !important;
          }
          .dashboard-panel__title {
            color: #1e293b !important;
            font-size: 16px !important;
            font-weight: 700 !important;
          }
          .stats-grid-print {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .stat-card-print {
            border: 1px solid #cbd5e1 !important;
            background: #f8fafc !important;
            padding: 16px !important;
            border-radius: 12px !important;
            text-align: left !important;
            box-shadow: none !important;
          }
          .data-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .data-table th {
            background-color: #f1f5f9 !important;
            color: #1e293b !important;
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            font-size: 12px !important;
          }
          .data-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      <div id="reportes-page-content">
        {/* Encabezado exclusivo para impresión */}
        <div className="print-only-header" style={{ display: 'none', marginBottom: 24, borderBottom: '2px solid #1e293b', paddingBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#1e293b' }}>REPORTE GENERAL DE ENCOMIENDAS</h1>
              <span style={{ fontSize: '12px', color: '#475569' }}>Sistema de Gestión de Encomiendas</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
              <div><strong>Período:</strong> {PERIODS.find(p => p.key === period)?.label}</div>
              <div><strong>Fecha de Reporte:</strong> {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>

        {/* ── Indicadores Panel ─────────────────────────────────── */}
        <div className="dashboard-panel" style={{ marginBottom: 24 }}>
          <div className="dashboard-panel__header">
            <h2 className="dashboard-panel__title">
              <BarChart3 size={20} /> Indicadores Operativos
            </h2>
            <div style={{ display: 'flex', gap: 8 }} className="no-print">
              <button className="btn btn--secondary btn--sm" onClick={handlePrint}>
                <Printer size={15} /> Imprimir
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleExportPDF}>
                <Download size={15} /> Exportar PDF
              </button>
            </div>
          </div>

        {/* ── Period Pills ──────────────────────────────────────── */}
        <div style={{ padding: '0 24px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }} className="no-print">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: '6px 16px',
                borderRadius: 99,
                border: period === p.key ? '2px solid var(--navy)' : '2px solid var(--border)',
                background: period === p.key ? 'var(--navy)' : 'transparent',
                color: period === p.key ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Stat Cards ────────────────────────────────────────── */}
        <div ref={printRef} className="dashboard-panel__body">
          {indLoading && !ind ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={32} className="spin" style={{ color: 'var(--navy)' }} />
            </div>
          ) : indError ? (
            <div className="taq-scan-result taq-scan-result--error">
              <AlertCircle size={18} /> Error al cargar indicadores
            </div>
          ) : (
            <>
              {/* Row 1 — Operational KPIs */}
              <div className="stats-grid-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 16 }}>
                <StatCard icon={<TrendingUp size={22} />} title="Tasa de Éxito" value={`${ind?.tasaEntregaExitosa ?? 0}%`} subtitle={`${ind?.totalEntregadas ?? 0} entregadas`} color="green" />
                <StatCard icon={<Package size={22} />} title="Total Registradas" value={ind?.totalRegistradas ?? 0} subtitle="Período seleccionado" color="blue" />
                <StatCard icon={<Truck size={22} />} title="En Tránsito" value={ind?.totalEnTransito ?? 0} subtitle={`${ind?.totalDisponibles ?? 0} disponibles`} color="amber" />
                <StatCard icon={<XCircle size={22} />} title="Canceladas" value={ind?.totalCanceladas ?? 0} subtitle={`${ind?.totalRecepcionadas ?? 0} recepcionadas`} color="red" />
              </div>
              {/* Row 2 — Financial KPIs */}
              <div className="stats-grid-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
                <StatCard icon={<Banknote size={22} />} title="Total Recaudado" value={`${(ind?.montoTotalPagado ?? 0).toFixed(2)} Bs`} subtitle={`${ind?.totalVentaEtiquetas ?? 0} etiquetas pagadas`} color="emerald" />
                <StatCard icon={<Clock size={22} />} title="Pendiente de Cobro" value={`${(ind?.montoTotalPendiente ?? 0).toFixed(2)} Bs`} subtitle="Sin cobrar aún" color="purple" />
                <StatCard icon={<Award size={22} />} title="Monto Total Registrado" value={`${(ind?.montoTotalRegistrado ?? 0).toFixed(2)} Bs`} subtitle="Suma de todos los envíos" color="blue" />
                <CheckCircle2 size={22} className="no-print" style={{ display: 'none' }} />
                <StatCard icon={<CheckCircle2 size={22} />} title="Entregas del Período" value={ind?.totalEntregadas ?? 0} subtitle={`${ind?.totalEnDestino ?? 0} en destino`} color="green" />
              </div>

              {/* Route breakdown */}
              {(ind?.encomiendasPorRuta?.length ?? 0) > 0 && (
                <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-page)', borderRadius: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} /> Distribución por Ruta
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ind.encomiendasPorRuta.map((r: any) => (
                      <div key={r.routeCode} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, width: 220, flexShrink: 0, color: 'var(--text-primary)', fontWeight: 500 }}>
                          {r.routeLabel}
                        </span>
                        <div style={{ flex: 1, background: 'var(--border)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, r.porcentaje)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--navy), #3B82F6)',
                            borderRadius: 99,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 80, textAlign: 'right', fontWeight: 600 }}>
                          {r.total} ({r.porcentaje}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Report Table Panel ────────────────────────────────── */}
      <div className="dashboard-panel">
        <div className="dashboard-panel__header" style={{ flexWrap: 'wrap', gap: 8 }}>
          <h2 className="dashboard-panel__title">Detalle del Reporte</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} className="no-print">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.key}
                className={`btn btn--sm ${reportType === rt.key ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setReportType(rt.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {rt.icon} {rt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-panel__body">
          {/* ── Encomiendas ──────────────────────────────────── */}
          {reportType === 'encomiendas' && (
            <>
              <div className="taq-actions no-print" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1, position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input type="text" className="form-input" placeholder="Buscar por CI, Nombre, Guía..." style={{ paddingLeft: 36 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="form-group" style={{ width: 180 }}>
                  <select className="form-input" value={routeFilter} onChange={(e) => { setRouteFilter(e.target.value); setPage(1); }}>
                    <option value="">Todas las rutas</option>
                    <option value="SCZ-PQA">Santa Cruz → Pto. Quijarro</option>
                    <option value="PQA-SCZ">Pto. Quijarro → Santa Cruz</option>
                    <option value="SCZ-SJC">Santa Cruz → San José</option>
                    <option value="SCZ-ROB">Santa Cruz → Roboré</option>
                  </select>
                </div>
                <div className="form-group" style={{ width: 180 }}>
                  <select className="form-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
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
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Código</th><th>Fecha</th><th>Ruta</th><th>Remitente</th><th>Destinatario</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {repLoading && !reporte && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--navy)', margin: '0 auto' }} />
                      </td></tr>
                    )}
                    {!repLoading && reporte?.items.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron resultados.</td></tr>
                    )}
                    {reporte?.items.map((enc: any) => (
                      <tr key={enc.id}>
                        <td><span className="data-table__code">{enc.trackingNumber}</span></td>
                        <td className="data-table__time">{dateFormatter.format(new Date(enc.createdAt))}</td>
                        <td><span className="data-table__route"><MapPin size={14} /> {enc.routeCode}</span></td>
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
              {reporte && reporte.totalPages > 1 && (
                <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                  <button className="btn btn--secondary btn--sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
                  <span style={{ fontSize: 14, alignSelf: 'center', color: 'var(--text-secondary)' }}>Página {page} de {reporte.totalPages}</span>
                  <button className="btn btn--secondary btn--sm" disabled={page === reporte.totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
                </div>
              )}
            </>
          )}

          {/* ── Usuarios ─────────────────────────────────────── */}
          {reportType === 'usuarios' && (
            <div style={{ overflowX: 'auto' }}>
              {usersLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 size={24} className="spin" style={{ color: 'var(--navy)' }} /></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Estado</th></tr></thead>
                  <tbody>
                    {(usersData?.users ?? []).map((u: any) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td>{u.telefono || '—'}</td>
                        <td>
                          <span className={`badge ${u.rol === 'ADMINISTRADOR' ? 'badge--purple' : u.rol === 'TAQUILLERO' ? 'badge--blue' : 'badge--cyan'}`}>
                            <span className="badge__dot" />{u.rol}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.activo ? 'badge--green' : 'badge--red'}`}>
                            <span className="badge__dot" />{u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Sucursales ───────────────────────────────────── */}
          {reportType === 'sucursales' && (
            <div style={{ overflowX: 'auto' }}>
              {sucLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 size={24} className="spin" style={{ color: 'var(--navy)' }} /></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Nombre</th><th>Ciudad</th><th>Dirección</th><th>Teléfono</th><th>Estado</th></tr></thead>
                  <tbody>
                    {(sucData?.sucursales ?? []).map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}><Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{s.nombre}</td>
                        <td>{s.ciudad}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.direccion || '—'}</td>
                        <td>{s.telefono || '—'}</td>
                        <td>
                          <span className={`badge ${s.activa ? 'badge--green' : 'badge--red'}`}>
                            <span className="badge__dot" />{s.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Buses ────────────────────────────────────────── */}
          {reportType === 'buses' && (
            <div style={{ overflowX: 'auto' }}>
              {busesLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 size={24} className="spin" style={{ color: 'var(--navy)' }} /></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Placa</th><th>Flota</th><th>Ruta</th><th>Capacidad</th><th>Cargados</th><th>Estado</th></tr></thead>
                  <tbody>
                    {(busesData?.buses ?? []).map((b: any) => (
                      <tr key={b.id}>
                        <td><span className="data-table__code">{b.placa}</span></td>
                        <td style={{ fontWeight: 600 }}>{b.flota}</td>
                        <td><span className="data-table__route"><MapPin size={14} />{b.routeCode}</span></td>
                        <td>{b.capacidad}</td>
                        <td>
                          <span style={{ color: b.cargados >= b.capacidad ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                            {b.cargados}/{b.capacidad}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${b.estado === 'EN_RUTA' ? 'badge--amber' : b.estado === 'DISPONIBLE' ? 'badge--green' : 'badge--blue'}`}>
                            <span className="badge__dot" />{b.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
