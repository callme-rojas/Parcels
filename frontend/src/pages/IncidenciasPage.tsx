import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Filter,
  Trash2,
  Eye,
  CheckSquare
} from 'lucide-react';

interface Incidencia {
  id: string;
  trackingNumber: string;
  tipo: string;
  prioridad: string;
  descripcion: string;
  estado: 'ABIERTA' | 'PROCESO' | 'RESOLUTA';
  creadoEn: string;
  creadoPor: string;
}

const TIPO_LABELS: Record<string, string> = {
  DANIO: 'Paquete Dañado',
  PERDIDA: 'Pérdida parcial/total',
  DEMORA: 'Retraso de entrega',
  DIRECCION: 'Dirección errónea',
  OTRO: 'Otro reclamo',
};

const PRIORIDAD_CLASSES: Record<string, string> = {
  ALTA: 'badge badge--red',
  MEDIA: 'badge badge--amber',
  BAJA: 'badge badge--blue',
};

const ESTADO_CLASSES: Record<string, string> = {
  ABIERTA: 'badge badge--red',
  PROCESO: 'badge badge--amber',
  RESOLUTA: 'badge badge--green',
};

const INITIAL_MOCK_INCIDENCIAS: Incidencia[] = [
  {
    id: 'inc-1',
    trackingNumber: 'TRV-2026-9827',
    tipo: 'DANIO',
    prioridad: 'ALTA',
    descripcion: 'La caja llegó con humedad y golpeada en la esquina inferior izquierda. Contenido sin daño mayor aparente, pero el embalaje está roto.',
    estado: 'ABIERTA',
    creadoEn: new Date(Date.now() - 3600000 * 2).toISOString(),
    creadoPor: 'Jorge Bodega',
  },
  {
    id: 'inc-2',
    trackingNumber: 'TRV-2026-4410',
    tipo: 'DIRECCION',
    prioridad: 'MEDIA',
    descripcion: 'El destinatario reporta que la dirección escrita no coincide con su domicilio actual. Se solicita cambio a Calle Bolívar Nro 42.',
    estado: 'PROCESO',
    creadoEn: new Date(Date.now() - 3600000 * 24).toISOString(),
    creadoPor: 'Carla Taquilla',
  },
  {
    id: 'inc-3',
    trackingNumber: 'TRV-2026-1185',
    tipo: 'DEMORA',
    prioridad: 'BAJA',
    descripcion: 'Retraso en el bus SCZ-ROB debido a bloqueo en la carretera. Las encomiendas llegarán con 4 horas de retraso estimado.',
    estado: 'RESOLUTA',
    creadoEn: new Date(Date.now() - 3600000 * 48).toISOString(),
    creadoPor: 'Jorge Bodega',
  },
];

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(null);

  // Form states
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    trackingNumber: '',
    tipo: 'DANIO',
    prioridad: 'MEDIA',
    descripcion: '',
  });

  // Load from LocalStorage or initialize with mock data
  useEffect(() => {
    const stored = localStorage.getItem('travell_incidencias');
    if (stored) {
      setIncidencias(JSON.parse(stored));
    } else {
      setIncidencias(INITIAL_MOCK_INCIDENCIAS);
      localStorage.setItem('travell_incidencias', JSON.stringify(INITIAL_MOCK_INCIDENCIAS));
    }
  }, []);

  const saveToStorage = (list: Incidencia[]) => {
    setIncidencias(list);
    localStorage.setItem('travell_incidencias', JSON.stringify(list));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.trackingNumber.trim()) {
      setFormError('Por favor introduce un número de tracking válido.');
      return;
    }
    if (!formData.descripcion.trim()) {
      setFormError('Introduce una descripción de la incidencia.');
      return;
    }

    const newInc: Incidencia = {
      id: `inc-${Date.now()}`,
      trackingNumber: formData.trackingNumber.trim().toUpperCase(),
      tipo: formData.tipo,
      prioridad: formData.prioridad,
      descripcion: formData.descripcion,
      estado: 'ABIERTA',
      creadoEn: new Date().toISOString(),
      creadoPor: 'Admin / Operador',
    };

    const updated = [newInc, ...incidencias];
    saveToStorage(updated);
    setShowCreateModal(false);
    setFormData({
      trackingNumber: '',
      tipo: 'DANIO',
      prioridad: 'MEDIA',
      descripcion: '',
    });
  };

  const handleUpdateStatus = (id: string, nextStatus: 'ABIERTA' | 'PROCESO' | 'RESOLUTA') => {
    const updated = incidencias.map((inc) => {
      if (inc.id === id) {
        return { ...inc, estado: nextStatus };
      }
      return inc;
    });
    saveToStorage(updated);
    if (selectedIncidencia && selectedIncidencia.id === id) {
      setSelectedIncidencia({ ...selectedIncidencia, estado: nextStatus });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro de incidencia?')) {
      const updated = incidencias.filter((inc) => inc.id !== id);
      saveToStorage(updated);
      setShowDetailModal(false);
    }
  };

  // Filter calculations
  const filteredIncidencias = useMemo(() => {
    return incidencias.filter((inc) => {
      const matchesSearch =
        inc.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.creadoPor.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTipo = tipoFilter === 'TODOS' || inc.tipo === tipoFilter;
      const matchesEstado = estadoFilter === 'TODOS' || inc.estado === estadoFilter;

      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [incidencias, searchQuery, tipoFilter, estadoFilter]);

  // Metrics
  const stats = useMemo(() => {
    return {
      total: incidencias.length,
      abiertas: incidencias.filter((inc) => inc.estado === 'ABIERTA').length,
      proceso: incidencias.filter((inc) => inc.estado === 'PROCESO').length,
      resueltas: incidencias.filter((inc) => inc.estado === 'RESOLUTA').length,
    };
  }, [incidencias]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="panel-page">
      {/* ─── Header Bar ──────────────────────── */}
      <div className="enc-header" style={{ marginBottom: 20 }}>
        <div className="enc-header__left">
          <h2 className="enc-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={24} style={{ color: 'var(--navy)' }} /> Registro de Incidencias
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Monitorea incidencias operativas, demoras de buses, reclamos de clientes y estados de resolución.
          </p>
        </div>
        <div className="enc-header__actions">
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Registrar Incidencia
          </button>
        </div>
      </div>

      {/* ─── KPI Metrics Dashboard ───────────── */}
      <section className="dashboard__kpis" style={{ marginBottom: 24 }}>
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><AlertOctagon size={22} /></span>
          </div>
          <div className="kpi-card__value">{stats.total}</div>
          <div className="kpi-card__label">Incidencias Reportadas</div>
        </div>
        
        <div className="kpi-card kpi-card--red">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><AlertTriangle size={22} /></span>
          </div>
          <div className="kpi-card__value">{stats.abiertas}</div>
          <div className="kpi-card__label">Sin Resolver (Abiertas)</div>
        </div>

        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Clock size={22} /></span>
          </div>
          <div className="kpi-card__value">{stats.proceso}</div>
          <div className="kpi-card__label">En Proceso de Solución</div>
        </div>

        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><CheckCircle2 size={22} /></span>
          </div>
          <div className="kpi-card__value">{stats.resueltas}</div>
          <div className="kpi-card__label">Resueltas / Cerradas</div>
        </div>
      </section>

      {/* ─── Search & Filters Bar ────────────── */}
      <div className="enc-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="enc-search" style={{ flex: '1 1 300px' }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por tracking, descripción o reportado por..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: '0 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-input"
              style={{ width: 180, padding: '6px 12px', fontSize: 13 }}
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="DANIO">Paquete Dañado</option>
              <option value="PERDIDA">Pérdida parcial/total</option>
              <option value="DEMORA">Retraso de bus</option>
              <option value="DIRECCION">Dirección errónea</option>
              <option value="OTRO">Otro problema</option>
            </select>
          </div>

          <select
            className="form-input"
            style={{ width: 150, padding: '6px 12px', fontSize: 13 }}
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ABIERTA">Abierta</option>
            <option value="PROCESO">En Proceso</option>
            <option value="RESOLUTA">Resuelta</option>
          </select>
        </div>
      </div>

      {/* ─── Data Table ──────────────────────── */}
      <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
        <div className="dashboard-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="dashboard-panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} /> Listado de incidencias operacionales
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Mostrando {filteredIncidencias.length} de {incidencias.length} incidentes
          </span>
        </div>
        <div className="dashboard-panel__body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Tracking</th>
                <th>Tipo Problema</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha Reporte</th>
                <th style={{ width: 140, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidencias.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={24} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--success)' }} />
                    No hay incidencias registradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredIncidencias.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <span className="data-table__code">{inc.trackingNumber}</span>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                      {TIPO_LABELS[inc.tipo] || inc.tipo}
                    </td>
                    <td>
                      <span className={PRIORIDAD_CLASSES[inc.prioridad] || 'badge'}>
                        {inc.prioridad}
                      </span>
                    </td>
                    <td>
                      <span className={ESTADO_CLASSES[inc.estado] || 'badge'}>
                        <span className="badge__dot" /> {inc.estado}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(inc.creadoEn)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        style={{ padding: '4px 8px', minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => {
                          setSelectedIncidencia(inc);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye size={13} /> Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Registrar Incidencia ──────── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reportar Incidencia Operativa</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="taq-scan-result taq-scan-result--error animate-fade-in" style={{ marginBottom: 14 }}>
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Código Tracking Encomienda <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej: TRV-2026-XXXX"
                      value={formData.trackingNumber}
                      onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prioridad <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select
                      className="form-input"
                      value={formData.prioridad}
                      onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    >
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta (Urgente)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Problema <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="form-input"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="DANIO">{TIPO_LABELS.DANIO}</option>
                    <option value="PERDIDA">{TIPO_LABELS.PERDIDA}</option>
                    <option value="DEMORA">{TIPO_LABELS.DEMORA}</option>
                    <option value="DIRECCION">{TIPO_LABELS.DIRECCION}</option>
                    <option value="OTRO">{TIPO_LABELS.OTRO}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Detalle y Descripción <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea
                    required
                    rows={4}
                    className="form-input"
                    placeholder="Describe en detalle la anomalía, daños encontrados o solicitud de modificación de dirección..."
                    style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13, padding: '8px 12px' }}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn--primary">Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Detalle Incidencia ────────── */}
      {showDetailModal && selectedIncidencia && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                <h3 style={{ margin: 0 }}>Ficha de Incidencia</h3>
              </div>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Tracking Asociado</span>
                  <span className="data-table__code" style={{ fontSize: 13, display: 'inline-block', marginTop: 4 }}>{selectedIncidencia.trackingNumber}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Tipo Reclamo</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', display: 'block', marginTop: 4 }}>
                    {TIPO_LABELS[selectedIncidencia.tipo] || selectedIncidencia.tipo}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Fecha Reporte</span>
                  <span style={{ fontSize: 13, display: 'block', marginTop: 4 }}>{formatDate(selectedIncidencia.creadoEn)}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Reportado Por</span>
                  <span style={{ fontSize: 13, display: 'block', marginTop: 4 }}>{selectedIncidencia.creadoPor}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Estado Actual</span>
                <span className={ESTADO_CLASSES[selectedIncidencia.estado] || 'badge'}>
                  {selectedIncidencia.estado}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Descripción Detallada</span>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.4 }}>{selectedIncidencia.descripcion}</p>
              </div>

              {/* Status transition controls */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--navy)', display: 'block', marginBottom: 8 }}>Actualizar Estado</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn--secondary btn--sm"
                    style={{ flex: 1, padding: '6px 0', fontSize: 12, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}
                    onClick={() => handleUpdateStatus(selectedIncidencia.id, 'ABIERTA')}
                    disabled={selectedIncidencia.estado === 'ABIERTA'}
                  >
                    <AlertOctagon size={13} /> Abierta
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    style={{ flex: 1, padding: '6px 0', fontSize: 12, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}
                    onClick={() => handleUpdateStatus(selectedIncidencia.id, 'PROCESO')}
                    disabled={selectedIncidencia.estado === 'PROCESO'}
                  >
                    <Clock size={13} /> En Proceso
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    style={{ flex: 1, padding: '6px 0', fontSize: 12, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}
                    onClick={() => handleUpdateStatus(selectedIncidencia.id, 'RESOLUTA')}
                    disabled={selectedIncidencia.estado === 'RESOLUTA'}
                  >
                    <CheckSquare size={13} /> Resolver
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn--danger-outline btn--sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => handleDelete(selectedIncidencia.id)}
                >
                  <Trash2 size={13} /> Eliminar Ficha
                </button>
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setShowDetailModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
