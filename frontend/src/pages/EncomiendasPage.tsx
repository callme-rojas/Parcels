import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, Filter, ChevronLeft, ChevronRight,
  ArrowUpDown, Eye, MoreHorizontal, Download, Plus
} from 'lucide-react';
import type { EstadoEncomienda } from '../types';

// ─── Mock Data ─────────────────────────────────────────────
interface EncomiendaRow {
  id: string;
  codigo: string;
  remitente: string;
  destinatario: string;
  ruta: string;
  estado: EstadoEncomienda;
  peso: number;
  contenido: string;
  creadoEn: string;
  bus?: string;
}

const MOCK_ENCOMIENDAS: EncomiendaRow[] = [
  { id: '1', codigo: 'EX-2026-SCZ-0048217', remitente: 'Rosa Méndez S.', destinatario: 'Juan C. Rojas V.', ruta: 'SCZ → PQA', estado: 'EN_TRANSITO' as EstadoEncomienda, peso: 3.3, contenido: 'Repuestos automotrices', creadoEn: '2026-05-10T11:42:00', bus: 'Flota 18 · 2845-KCN' },
  { id: '2', codigo: 'EX-2026-SCZ-0048218', remitente: 'Carlos Gutiérrez', destinatario: 'María López P.', ruta: 'SCZ → PQA', estado: 'RECEPCIONADO' as EstadoEncomienda, peso: 1.2, contenido: 'Documentos legales', creadoEn: '2026-05-10T12:15:00' },
  { id: '3', codigo: 'EX-2026-SCZ-0048219', remitente: 'Ana Vargas M.', destinatario: 'Pedro Suárez', ruta: 'SCZ → SJC', estado: 'REGISTRADO' as EstadoEncomienda, peso: 5.7, contenido: 'Ropa y textiles', creadoEn: '2026-05-10T13:05:00' },
  { id: '4', codigo: 'EX-2026-PQA-0012340', remitente: 'Jorge Mamani', destinatario: 'Luisa Fernández', ruta: 'PQA → SCZ', estado: 'DISPONIBLE' as EstadoEncomienda, peso: 2.1, contenido: 'Artesanías', creadoEn: '2026-05-09T08:30:00' },
  { id: '5', codigo: 'EX-2026-SCZ-0048220', remitente: 'Patricia Rojas', destinatario: 'Miguel Ángel T.', ruta: 'SCZ → ROB', estado: 'ENTREGADO' as EstadoEncomienda, peso: 8.4, contenido: 'Herramientas · Frágil', creadoEn: '2026-05-08T09:20:00' },
  { id: '6', codigo: 'EX-2026-SCZ-0048221', remitente: 'Fernando Díaz', destinatario: 'Sofía Castillo', ruta: 'SCZ → PQA', estado: 'EN_TRANSITO' as EstadoEncomienda, peso: 4.0, contenido: 'Medicamentos', creadoEn: '2026-05-10T10:00:00', bus: 'Flota 22 · 3190-BTZ' },
  { id: '7', codigo: 'EX-2026-SCZ-0048222', remitente: 'Laura Peña', destinatario: 'Ricardo Morales', ruta: 'SCZ → SJC', estado: 'EN_DESTINO' as EstadoEncomienda, peso: 1.8, contenido: 'Componentes electrónicos', creadoEn: '2026-05-09T14:45:00' },
  { id: '8', codigo: 'EX-2026-PQA-0012341', remitente: 'Diego Salazar', destinatario: 'Camila Ortiz', ruta: 'PQA → SCZ', estado: 'CANCELADO' as EstadoEncomienda, peso: 3.5, contenido: 'Productos alimenticios', creadoEn: '2026-05-07T16:10:00' },
  { id: '9', codigo: 'EX-2026-SCZ-0048223', remitente: 'Valentina Cruz', destinatario: 'Andrés Paniagua', ruta: 'SCZ → PQA', estado: 'REGISTRADO' as EstadoEncomienda, peso: 2.3, contenido: 'Libros y papelería', creadoEn: '2026-05-10T15:30:00' },
  { id: '10', codigo: 'EX-2026-SCZ-0048224', remitente: 'Gabriel Torrez', destinatario: 'Daniela Vega', ruta: 'SCZ → ROB', estado: 'EN_TRANSITO' as EstadoEncomienda, peso: 6.1, contenido: 'Repuestos industriales', creadoEn: '2026-05-10T08:15:00', bus: 'Flota 18 · 2845-KCN' },
  { id: '11', codigo: 'EX-2026-SCZ-0048225', remitente: 'Marcela Soliz', destinatario: 'Héctor Montaño', ruta: 'SCZ → PQA', estado: 'ENTREGADO' as EstadoEncomienda, peso: 0.8, contenido: 'Documentos notariales', creadoEn: '2026-05-06T11:00:00' },
  { id: '12', codigo: 'EX-2026-PQA-0012342', remitente: 'Roberto Chávez', destinatario: 'Isabel Quiroga', ruta: 'PQA → SCZ', estado: 'RECEPCIONADO' as EstadoEncomienda, peso: 4.7, contenido: 'Muestras de producto', creadoEn: '2026-05-10T09:50:00' },
  { id: '13', codigo: 'EX-2026-SCZ-0048226', remitente: 'Cecilia Flores', destinatario: 'Martín Peredo', ruta: 'SCZ → SJC', estado: 'DISPONIBLE' as EstadoEncomienda, peso: 3.0, contenido: 'Regalos personales', creadoEn: '2026-05-08T13:25:00' },
  { id: '14', codigo: 'EX-2026-SCZ-0048227', remitente: 'Ramiro Soto', destinatario: 'Natalia Jiménez', ruta: 'SCZ → PQA', estado: 'REGISTRADO' as EstadoEncomienda, peso: 7.2, contenido: 'Equipos de oficina', creadoEn: '2026-05-10T16:40:00' },
  { id: '15', codigo: 'EX-2026-SCZ-0048228', remitente: 'Elena Bustamante', destinatario: 'Oscar Delgado', ruta: 'SCZ → ROB', estado: 'ENTREGADO' as EstadoEncomienda, peso: 1.5, contenido: 'Cosméticos', creadoEn: '2026-05-05T10:10:00' },
  { id: '16', codigo: 'EX-2026-PQA-0012343', remitente: 'Alejandro Rivas', destinatario: 'Pamela Durán', ruta: 'PQA → SCZ', estado: 'EN_TRANSITO' as EstadoEncomienda, peso: 9.3, contenido: 'Materiales de construcción', creadoEn: '2026-05-10T07:00:00', bus: 'Flota 05 · 1876-MNP' },
];

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

  // Filter + search
  const filtered = useMemo(() => {
    let result = [...MOCK_ENCOMIENDAS];

    // Estado filter
    if (estadoFilter !== 'TODOS') {
      result = result.filter((e) => e.estado === estadoFilter);
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.codigo.toLowerCase().includes(q) ||
          e.remitente.toLowerCase().includes(q) ||
          e.destinatario.toLowerCase().includes(q) ||
          e.contenido.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'creadoEn') cmp = new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
      else if (sortField === 'peso') cmp = a.peso - b.peso;
      else cmp = a.codigo.localeCompare(b.codigo);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [searchQuery, estadoFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Count per state
  const counts = useMemo(() => {
    const c: Record<string, number> = { TODOS: MOCK_ENCOMIENDAS.length };
    MOCK_ENCOMIENDAS.forEach((e) => {
      c[e.estado] = (c[e.estado] || 0) + 1;
    });
    return c;
  }, []);

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
