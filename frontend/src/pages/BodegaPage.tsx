import { useState } from 'react';
import {
  Warehouse, Truck, PackageCheck, PackageX, Package,
  ArrowRight, CheckCircle2, ChevronDown, Eye,
  ArrowUpDown, AlertCircle
} from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────
type BodegaTab = 'clasificar' | 'carga' | 'descarga';

interface EncBodega {
  id: string;
  codigo: string;
  remitente: string;
  ruta: string;
  peso: number;
  contenido: string;
  horaRecepcion: string;
  prioridad?: 'alta' | 'media' | 'normal';
}

interface BusInfo {
  id: string;
  placa: string;
  flota: string;
  ruta: string;
  capacidad: number;
  cargados: number;
  salida: string;
  estado: 'cargando' | 'listo' | 'en_ruta';
}

const MOCK_CLASIFICAR: EncBodega[] = [
  { id: '1', codigo: 'EX-2026-SCZ-0048229', remitente: 'Laura Peña', ruta: 'SCZ → PQA', peso: 2.3, contenido: 'Libros y papelería', horaRecepcion: '16:30', prioridad: 'normal' },
  { id: '2', codigo: 'EX-2026-SCZ-0048230', remitente: 'Gabriel Torrez', ruta: 'SCZ → ROB', peso: 6.1, contenido: 'Repuestos industriales · Frágil', horaRecepcion: '16:15', prioridad: 'alta' },
  { id: '3', codigo: 'EX-2026-PQA-0012344', remitente: 'Alejandro Rivas', ruta: 'PQA → SCZ', peso: 9.3, contenido: 'Materiales de construcción', horaRecepcion: '15:50', prioridad: 'media' },
  { id: '4', codigo: 'EX-2026-SCZ-0048231', remitente: 'Cecilia Flores', ruta: 'SCZ → SJC', peso: 3.0, contenido: 'Regalos personales', horaRecepcion: '15:30', prioridad: 'normal' },
  { id: '5', codigo: 'EX-2026-SCZ-0048232', remitente: 'Fernando Díaz', ruta: 'SCZ → PQA', peso: 4.0, contenido: 'Medicamentos', horaRecepcion: '14:45', prioridad: 'alta' },
];

const MOCK_BUSES: BusInfo[] = [
  { id: 'b1', placa: '2845-KCN', flota: 'Flota 18', ruta: 'SCZ → PQA', capacidad: 30, cargados: 12, salida: '18:00', estado: 'cargando' },
  { id: 'b2', placa: '3190-BTZ', flota: 'Flota 22', ruta: 'SCZ → ROB', capacidad: 25, cargados: 8, salida: '19:30', estado: 'cargando' },
  { id: 'b3', placa: '1876-MNP', flota: 'Flota 05', ruta: 'SCZ → SJC', capacidad: 20, cargados: 20, salida: '15:00', estado: 'en_ruta' },
];

const MOCK_CARGA: Array<{ id: string; codigo: string; ruta: string; peso: number; bus: string; estado: 'pendiente' | 'cargado' }> = [
  { id: 'c1', codigo: 'EX-2026-SCZ-0048217', ruta: 'SCZ → PQA', peso: 3.3, bus: 'Flota 18 · 2845-KCN', estado: 'cargado' },
  { id: 'c2', codigo: 'EX-2026-SCZ-0048221', ruta: 'SCZ → PQA', peso: 4.0, bus: 'Flota 18 · 2845-KCN', estado: 'cargado' },
  { id: 'c3', codigo: 'EX-2026-SCZ-0048224', ruta: 'SCZ → ROB', peso: 6.1, bus: 'Flota 22 · 3190-BTZ', estado: 'pendiente' },
  { id: 'c4', codigo: 'EX-2026-PQA-0012343', ruta: 'PQA → SCZ', peso: 9.3, bus: 'Flota 05 · 1876-MNP', estado: 'cargado' },
];

const MOCK_DESCARGA: Array<{ id: string; codigo: string; ruta: string; peso: number; bus: string; }> = [
  { id: 'd1', codigo: 'EX-2026-PQA-0012340', ruta: 'PQA → SCZ', peso: 2.1, bus: 'Flota 12 · 4521-ABZ' },
  { id: 'd2', codigo: 'EX-2026-PQA-0012342', ruta: 'PQA → SCZ', peso: 4.7, bus: 'Flota 12 · 4521-ABZ' },
];

const PRIORIDAD_CONFIG: Record<string, { label: string; className: string }> = {
  alta: { label: 'Alta', className: 'badge badge--red' },
  media: { label: 'Media', className: 'badge badge--amber' },
  normal: { label: 'Normal', className: 'badge badge--gray' },
};

const BUS_ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  cargando: { label: 'Cargando', className: 'badge badge--amber' },
  listo: { label: 'Listo', className: 'badge badge--emerald' },
  en_ruta: { label: 'En ruta', className: 'badge badge--blue' },
};

export default function BodegaPage() {
  const [activeTab, setActiveTab] = useState<BodegaTab>('clasificar');
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<string | null>(null);

  const handleClasificar = (codigo: string) => {
    alert(`✅ Encomienda ${codigo} clasificada.\nLista para asignación a bus.`);
  };

  const handleAsignarBus = (encId: string, busId: string) => {
    alert(`✅ Encomienda asignada a ${MOCK_BUSES.find(b => b.id === busId)?.flota} (${MOCK_BUSES.find(b => b.id === busId)?.placa})`);
    setAsignando(null);
  };

  const handleCarga = (codigo: string) => {
    alert(`✅ Encomienda ${codigo} registrada como cargada.\nEstado actualizado: EN_TRANSITO`);
  };

  const handleDescarga = (codigo: string) => {
    alert(`✅ Encomienda ${codigo} descargada.\nEstado actualizado: EN_DESTINO`);
  };

  return (
    <div className="panel-page">
      {/* ─── KPIs ────────────────────────────── */}
      <section className="dashboard__kpis">
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header"><span className="kpi-card__icon"><Warehouse size={22} /></span></div>
          <div className="kpi-card__value">{MOCK_CLASIFICAR.length}</div>
          <div className="kpi-card__label">Por clasificar</div>
        </div>
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header"><span className="kpi-card__icon"><Truck size={22} /></span></div>
          <div className="kpi-card__value">{MOCK_BUSES.filter(b => b.estado === 'cargando').length}</div>
          <div className="kpi-card__label">Buses cargando</div>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header"><span className="kpi-card__icon"><PackageCheck size={22} /></span></div>
          <div className="kpi-card__value">20</div>
          <div className="kpi-card__label">Cargadas hoy</div>
        </div>
        <div className="kpi-card kpi-card--purple">
          <div className="kpi-card__header"><span className="kpi-card__icon"><PackageX size={22} /></span></div>
          <div className="kpi-card__value">{MOCK_DESCARGA.length}</div>
          <div className="kpi-card__label">Pendientes descarga</div>
        </div>
      </section>

      {/* ─── Tab Navigation ────────────────────── */}
      <div className="taq-tabs">
        <button className={`taq-tab ${activeTab === 'clasificar' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('clasificar')}>
          <Warehouse size={16} /> Clasificar
          <span className="enc-tab__count">{MOCK_CLASIFICAR.length}</span>
        </button>
        <button className={`taq-tab ${activeTab === 'carga' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('carga')}>
          <PackageCheck size={16} /> Carga
          <span className="enc-tab__count">{MOCK_CARGA.filter(c => c.estado === 'pendiente').length}</span>
        </button>
        <button className={`taq-tab ${activeTab === 'descarga' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('descarga')}>
          <PackageX size={16} /> Descarga
          <span className="enc-tab__count">{MOCK_DESCARGA.length}</span>
        </button>
      </div>

      {/* ═══ Tab: Clasificar ═══════════════════ */}
      {activeTab === 'clasificar' && (
        <div className="taq-content">
          <div className="bodega-dual-layout">
            {/* Left: Pending items */}
            <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
              <div className="dashboard-panel__header">
                <span className="dashboard-panel__title">
                  <Package size={16} /> Encomiendas recepcionadas
                </span>
              </div>
              <div className="dashboard-panel__body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Ruta</th>
                      <th>Peso</th>
                      <th>Prioridad</th>
                      <th style={{ width: 200 }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_CLASIFICAR.map((enc) => {
                      const prio = PRIORIDAD_CONFIG[enc.prioridad || 'normal'];
                      return (
                        <tr key={enc.id}>
                          <td>
                            <span className="data-table__code">{enc.codigo}</span>
                            <br />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{enc.contenido}</span>
                          </td>
                          <td><span className="data-table__route">{enc.ruta}</span></td>
                          <td>{enc.peso} kg</td>
                          <td>
                            <span className={prio.className}><span className="badge__dot" /> {prio.label}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {asignando === enc.id ? (
                                <div className="bodega-bus-select">
                                  <select
                                    className="form-input"
                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                    value={selectedBus || ''}
                                    onChange={(e) => setSelectedBus(e.target.value)}
                                  >
                                    <option value="">Seleccionar bus...</option>
                                    {MOCK_BUSES.filter(b => b.estado === 'cargando').map((bus) => (
                                      <option key={bus.id} value={bus.id}>
                                        {bus.flota} · {bus.placa} ({bus.ruta})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    className="btn btn--primary btn--sm"
                                    disabled={!selectedBus}
                                    onClick={() => selectedBus && handleAsignarBus(enc.id, selectedBus)}
                                  >
                                    Confirmar
                                  </button>
                                  <button className="btn btn--secondary btn--sm" onClick={() => setAsignando(null)}>✕</button>
                                </div>
                              ) : (
                                <>
                                  <button className="btn btn--primary btn--sm" onClick={() => setAsignando(enc.id)}>
                                    <Truck size={13} /> Asignar a bus
                                  </button>
                                  <button className="enc-action-btn" title="Clasificar" onClick={() => handleClasificar(enc.codigo)}>
                                    <CheckCircle2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Buses info */}
            <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
              <div className="dashboard-panel__header">
                <span className="dashboard-panel__title"><Truck size={16} /> Buses disponibles</span>
              </div>
              <div className="dashboard-panel__body" style={{ padding: 0 }}>
                {MOCK_BUSES.map((bus) => {
                  const estadoBadge = BUS_ESTADO_CONFIG[bus.estado];
                  const pct = Math.round((bus.cargados / bus.capacidad) * 100);
                  return (
                    <div key={bus.id} className="bodega-bus-card">
                      <div className="bodega-bus-card__header">
                        <div>
                          <strong>{bus.flota}</strong>
                          <span className="bodega-bus-card__placa">{bus.placa}</span>
                        </div>
                        <span className={estadoBadge.className}>
                          <span className="badge__dot" /> {estadoBadge.label}
                        </span>
                      </div>
                      <div className="bodega-bus-card__details">
                        <span>{bus.ruta}</span>
                        <span>Salida: {bus.salida}</span>
                      </div>
                      <div className="bodega-bus-card__capacity">
                        <div className="bodega-bus-card__bar">
                          <div className="bodega-bus-card__bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="bodega-bus-card__cap-text">{bus.cargados}/{bus.capacidad} enc. ({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Carga ════════════════════════ */}
      {activeTab === 'carga' && (
        <div className="taq-content">
          <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title">
                <PackageCheck size={16} /> Registro de carga
              </span>
            </div>
            <div className="dashboard-panel__body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Ruta</th>
                    <th>Peso</th>
                    <th>Bus asignado</th>
                    <th>Estado</th>
                    <th style={{ width: 160 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CARGA.map((enc) => (
                    <tr key={enc.id}>
                      <td><span className="data-table__code">{enc.codigo}</span></td>
                      <td><span className="data-table__route">{enc.ruta}</span></td>
                      <td>{enc.peso} kg</td>
                      <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{enc.bus}</span></td>
                      <td>
                        {enc.estado === 'cargado' ? (
                          <span className="badge badge--green"><span className="badge__dot" /> Cargado</span>
                        ) : (
                          <span className="badge badge--amber"><span className="badge__dot" /> Pendiente</span>
                        )}
                      </td>
                      <td>
                        {enc.estado === 'pendiente' ? (
                          <button className="btn btn--primary btn--sm" onClick={() => handleCarga(enc.codigo)}>
                            <PackageCheck size={13} /> Registrar carga
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={14} /> Completado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Descarga ═════════════════════ */}
      {activeTab === 'descarga' && (
        <div className="taq-content">
          <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title">
                <PackageX size={16} /> Encomiendas para descargar
                {MOCK_DESCARGA.length > 0 && (
                  <span className="badge badge--amber" style={{ marginLeft: 8 }}>
                    <AlertCircle size={11} /> {MOCK_DESCARGA.length} pendientes
                  </span>
                )}
              </span>
            </div>
            <div className="dashboard-panel__body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Ruta</th>
                    <th>Peso</th>
                    <th>Bus</th>
                    <th style={{ width: 180 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_DESCARGA.map((enc) => (
                    <tr key={enc.id}>
                      <td><span className="data-table__code">{enc.codigo}</span></td>
                      <td><span className="data-table__route">{enc.ruta}</span></td>
                      <td>{enc.peso} kg</td>
                      <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{enc.bus}</span></td>
                      <td>
                        <button className="btn btn--primary btn--sm" onClick={() => handleDescarga(enc.codigo)}>
                          <PackageX size={13} /> Registrar descarga
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
