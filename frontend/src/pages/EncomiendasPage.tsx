import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, Filter, ChevronLeft, ChevronRight,
  ArrowUpDown, Eye, MoreHorizontal, Download, Plus, Loader2
} from 'lucide-react';
import type { EstadoEncomienda, Parcel } from '../types';
import { useParcels } from '../hooks/useParcel';
import { RUTAS_DISPONIBLES } from '../types';

// ─── Helpers ───────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  REGISTRADO: { label: 'Pre-registrada', className: 'badge badge--gray' },
  RECEPCIONADO: { label: 'Recepcionada', className: 'badge badge--blue' },
  EN_TRANSITO: { label: 'En tránsito', className: 'badge badge--amber' },
  EN_DESTINO: { label: 'En destino', className: 'badge badge--purple' },
  DISPONIBLE: { label: 'Disponible', className: 'badge badge--emerald' },
  ENTREGADO: { label: 'Entregada', className: 'badge badge--green' },
  CANCELADO: { label: 'Cancelada', className: 'badge badge--red' },
};

const ESTADO_TABS = [
  { key: 'TODOS', label: 'Todas' },
  { key: 'REGISTRADO', label: 'Pre-registradas' },
  { key: 'RECEPCIONADO', label: 'Recepcionadas' },
  { key: 'EN_TRANSITO', label: 'En tránsito' },
  { key: 'EN_DESTINO', label: 'En destino' },
  { key: 'DISPONIBLE', label: 'Disponibles' },
  { key: 'ENTREGADO', label: 'Entregadas' },
  { key: 'CANCELADO', label: 'Canceladas' },
];

const PAGE_SIZE = 8;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

export default function EncomiendasPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<'creadoEn' | 'peso' | 'codigo'>('creadoEn');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Fetch real data from backend
  const { parcels: rawParcels, loading, error } = useParcels(
    estadoFilter !== 'TODOS'
      ? { status: estadoFilter as EstadoEncomienda, search: searchQuery || undefined }
      : { search: searchQuery || undefined }
  );

  // Map Parcel to display row
  const allEncomiendas = useMemo(() => rawParcels.map((p: Parcel) => ({
    id: p.id,
    codigo: p.trackingNumber,
    remitente: p.senderName,
    destinatario: p.recipientName,
    ruta: `${p.originAddress.split(',')[0]} → ${p.destinationAddress.split(',')[0]}`,
    estado: p.status,
    peso: p.weight,
    contenido: p.content,
    creadoEn: p.createdAt,
  })), [rawParcels]);

  // Client-side sort only (filters go to server)
  const filtered = useMemo(() => {
    let result = [...allEncomiendas];

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'creadoEn') cmp = new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
      else if (sortField === 'peso') cmp = a.peso - b.peso;
      else cmp = a.codigo.localeCompare(b.codigo);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allEncomiendas, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Count per state
  const counts = useMemo(() => {
    const c: Record<string, number> = { TODOS: allEncomiendas.length };
    allEncomiendas.forEach((e) => {
      c[e.estado] = (c[e.estado] || 0) + 1;
    });
    return c;
  }, [allEncomiendas]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="panel-page">
      {/* ─── Header Bar ──────────────────────── */}
      <div className="enc-header">
        <div className="enc-header__left">
          <h2 className="enc-header__title">
            <Package size={22} /> Encomiendas
          </h2>
          <span className="enc-header__count">{filtered.length} registros</span>
        </div>
        <div className="enc-header__actions">
          <button className="btn btn--secondary btn--sm">
            <Download size={15} /> Exportar
          </button>
          <button className="btn btn--primary btn--sm" onClick={() => navigate('/crear-envio')}>
            <Plus size={15} /> Nuevo envío
          </button>
        </div>
      </div>

      {/* ─── Search + Filters ───────────────── */}
      <div className="enc-filters">
        <div className="enc-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por código, remitente, destinatario..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* ─── Status Tabs ────────────────────── */}
      <div className="enc-tabs">
        {ESTADO_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`enc-tab ${estadoFilter === tab.key ? 'enc-tab--active' : ''}`}
            onClick={() => { setEstadoFilter(tab.key); setPage(1); }}
          >
            {tab.label}
            <span className="enc-tab__count">{counts[tab.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* ─── Table ──────────────────────────── */}
      <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__sortable" onClick={() => toggleSort('codigo')}>
                  Código <ArrowUpDown size={12} />
                </th>
                <th>Remitente</th>
                <th>Destinatario</th>
                <th>Ruta</th>
                <th>Estado</th>
                <th className="data-table__sortable" onClick={() => toggleSort('peso')}>
                  Peso <ArrowUpDown size={12} />
                </th>
                <th className="data-table__sortable" onClick={() => toggleSort('creadoEn')}>
                  Fecha <ArrowUpDown size={12} />
                </th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                    <Package size={32} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block' }} />
                    No se encontraron encomiendas con esos filtros.
                  </td>
                </tr>
              ) : (
                paginated.map((enc) => {
                  const badge = ESTADO_CONFIG[enc.estado];
                  return (
                    <tr
                      key={enc.id}
                      className="data-table__row--clickable"
                      onClick={() => navigate(`/encomiendas/${enc.id}`)}
                    >
                      <td>
                        <span className="data-table__code">{enc.codigo}</span>
                      </td>
                      <td>{enc.remitente}</td>
                      <td>{enc.destinatario}</td>
                      <td>
                        <span className="data-table__route">
                          {enc.ruta}
                        </span>
                      </td>
                      <td>
                        <span className={badge.className}>
                          <span className="badge__dot" /> {badge.label}
                        </span>
                      </td>
                      <td>{enc.peso} kg</td>
                      <td>
                        <span>{formatDate(enc.creadoEn)}</span>
                        <br />
                        <span className="data-table__time">{formatTime(enc.creadoEn)}</span>
                      </td>
                      <td>
                        <button
                          className="enc-action-btn"
                          title="Ver detalle"
                          onClick={(e) => { e.stopPropagation(); navigate(`/encomiendas/${enc.id}`); }}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─────────────────────── */}
        {totalPages > 1 && (
          <div className="enc-pagination">
            <span className="enc-pagination__info">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="enc-pagination__controls">
              <button
                className="enc-pagination__btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`enc-pagination__btn ${page === i + 1 ? 'enc-pagination__btn--active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="enc-pagination__btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
