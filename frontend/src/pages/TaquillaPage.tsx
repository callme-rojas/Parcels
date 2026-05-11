import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, ScanLine, UserCheck, ClipboardCheck,
  ArrowRight, CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Hash, User, Phone, CreditCard, Eye
} from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────
type TabKey = 'recepcion' | 'retiro' | 'cola';

interface EncomPendiente {
  id: string;
  codigo: string;
  remitente: string;
  destinatario: string;
  ruta: string;
  peso: number;
  contenido: string;
  hora: string;
}

const MOCK_PENDIENTES: EncomPendiente[] = [
  { id: '1', codigo: 'EX-2026-SCZ-0048229', remitente: 'Laura Peña', destinatario: 'Andrés Paniagua', ruta: 'SCZ → PQA', peso: 2.3, contenido: 'Libros y papelería', hora: '16:30' },
  { id: '2', codigo: 'EX-2026-SCZ-0048230', remitente: 'Gabriel Torrez', destinatario: 'Daniela Vega', ruta: 'SCZ → ROB', peso: 6.1, contenido: 'Repuestos industriales', hora: '16:15' },
  { id: '3', codigo: 'EX-2026-PQA-0012344', remitente: 'Alejandro Rivas', destinatario: 'Pamela Durán', ruta: 'PQA → SCZ', peso: 9.3, contenido: 'Materiales de construcción', hora: '15:50' },
  { id: '4', codigo: 'EX-2026-SCZ-0048231', remitente: 'Cecilia Flores', destinatario: 'Martín Peredo', ruta: 'SCZ → SJC', peso: 3.0, contenido: 'Regalos personales', hora: '15:30' },
];

const MOCK_RETIRO: Array<{ id: string; codigo: string; destinatario: string; ci: string; ruta: string; estado: string; oficina: string }> = [
  { id: '5', codigo: 'EX-2026-PQA-0012340', destinatario: 'Luisa Fernández', ci: '7 345 678 SC', ruta: 'PQA → SCZ', estado: 'DISPONIBLE', oficina: 'Terminal Bimodal SCZ' },
  { id: '6', codigo: 'EX-2026-SCZ-0048226', destinatario: 'Martín Peredo', ci: '6 123 456 SC', ruta: 'SCZ → SJC', estado: 'DISPONIBLE', oficina: 'Terminal San José' },
];

export default function TaquillaPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('recepcion');
  const [searchCode, setSearchCode] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [retiroCI, setRetiroCI] = useState('');
  const [retiroResult, setRetiroResult] = useState<'success' | 'error' | null>(null);
  const [selectedRetiro, setSelectedRetiro] = useState<string | null>(null);

  // Simular escaneo
  const handleScan = () => {
    if (!scannedCode.trim()) return;
    // Simular que encontró la encomienda
    const found = MOCK_PENDIENTES.find(e => e.codigo.toLowerCase().includes(scannedCode.toLowerCase()));
    setScanResult(found ? 'success' : 'error');
  };

  const handleRecepcionar = (codigo: string) => {
    // Mock: show success feedback
    alert(`✅ Encomienda ${codigo} recepcionada exitosamente.\nEstado actualizado: RECEPCIONADO`);
  };

  const handleConfirmRetiro = () => {
    if (!retiroCI.trim() || !selectedRetiro) return;
    const enc = MOCK_RETIRO.find(e => e.id === selectedRetiro);
    if (enc && retiroCI.replace(/\s/g, '').includes(enc.ci.replace(/\s/g, '').slice(0, 5))) {
      setRetiroResult('success');
    } else {
      setRetiroResult('error');
    }
  };

  return (
    <div className="panel-page">
      {/* ─── Header KPIs ───────────────────────── */}
      <section className="dashboard__kpis">
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header"><span className="kpi-card__icon"><Package size={22} /></span></div>
          <div className="kpi-card__value">{MOCK_PENDIENTES.length}</div>
          <div className="kpi-card__label">Pendientes recepción</div>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header"><span className="kpi-card__icon"><UserCheck size={22} /></span></div>
          <div className="kpi-card__value">{MOCK_RETIRO.length}</div>
          <div className="kpi-card__label">Disponibles para retiro</div>
        </div>
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header"><span className="kpi-card__icon"><ClipboardCheck size={22} /></span></div>
          <div className="kpi-card__value">18</div>
          <div className="kpi-card__label">Recepcionadas hoy</div>
        </div>
        <div className="kpi-card kpi-card--purple">
          <div className="kpi-card__header"><span className="kpi-card__icon"><CheckCircle2 size={22} /></span></div>
          <div className="kpi-card__value">7</div>
          <div className="kpi-card__label">Entregadas hoy</div>
        </div>
      </section>

      {/* ─── Tab Navigation ────────────────────── */}
      <div className="taq-tabs">
        <button className={`taq-tab ${activeTab === 'recepcion' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('recepcion')}>
          <ScanLine size={16} /> Recepcionar
        </button>
        <button className={`taq-tab ${activeTab === 'retiro' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('retiro')}>
          <UserCheck size={16} /> Confirmar Retiro
        </button>
        <button className={`taq-tab ${activeTab === 'cola' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('cola')}>
          <Package size={16} /> Cola de espera
        </button>
      </div>

      {/* ═══ Tab: Recepción ═════════════════════ */}
      {activeTab === 'recepcion' && (
        <div className="taq-content">
          {/* Scanner */}
          <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title"><ScanLine size={16} /> Escanear o ingresar código</span>
            </div>
            <div className="dashboard-panel__body">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Escanee el código PDF417 de la encomienda o ingrese el código manualmente.
              </p>
              <div className="taq-scanner">
                <div className="enc-search">
                  <Hash size={16} />
                  <input
                    type="text"
                    placeholder="EX-2026-SCZ-XXXXXXX"
                    value={scannedCode}
                    onChange={(e) => { setScannedCode(e.target.value); setScanResult(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  />
                  <button className="btn btn--primary btn--sm" onClick={handleScan}>
                    <Search size={14} /> Buscar
                  </button>
                </div>

                {scanResult === 'success' && (
                  <div className="taq-scan-result taq-scan-result--success">
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>Encomienda encontrada</strong>
                      <span>{MOCK_PENDIENTES[0].codigo} — {MOCK_PENDIENTES[0].remitente} → {MOCK_PENDIENTES[0].destinatario}</span>
                    </div>
                    <button className="btn btn--primary btn--sm" onClick={() => handleRecepcionar(MOCK_PENDIENTES[0].codigo)}>
                      Recepcionar
                    </button>
                  </div>
                )}
                {scanResult === 'error' && (
                  <div className="taq-scan-result taq-scan-result--error">
                    <XCircle size={18} />
                    <div>
                      <strong>No encontrada</strong>
                      <span>No se encontró una encomienda con ese código. Verifique e intente de nuevo.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending list */}
          <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title">
                <Package size={16} /> Encomiendas pendientes de recepción
                <span className="badge badge--amber" style={{ marginLeft: 8 }}>{MOCK_PENDIENTES.length}</span>
              </span>
            </div>
            <div className="dashboard-panel__body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Remitente</th>
                    <th>Destinatario</th>
                    <th>Ruta</th>
                    <th>Peso</th>
                    <th>Hora registro</th>
                    <th style={{ width: 160 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PENDIENTES.map((enc) => (
                    <tr key={enc.id}>
                      <td><span className="data-table__code">{enc.codigo}</span></td>
                      <td>{enc.remitente}</td>
                      <td>{enc.destinatario}</td>
                      <td><span className="data-table__route">{enc.ruta}</span></td>
                      <td>{enc.peso} kg</td>
                      <td className="data-table__time">{enc.hora}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn--primary btn--sm" onClick={() => handleRecepcionar(enc.codigo)}>
                            <CheckCircle2 size={13} /> Recepcionar
                          </button>
                          <button className="enc-action-btn" title="Ver detalle" onClick={() => navigate(`/encomiendas/${enc.id}`)}>
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Confirmar Retiro ══════════════ */}
      {activeTab === 'retiro' && (
        <div className="taq-content">
          <div className="taq-retiro-layout">
            {/* Left: list of available */}
            <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
              <div className="dashboard-panel__header">
                <span className="dashboard-panel__title">
                  <Package size={16} /> Encomiendas disponibles para retiro
                </span>
              </div>
              <div className="dashboard-panel__body" style={{ padding: 0 }}>
                {MOCK_RETIRO.map((enc) => (
                  <div
                    key={enc.id}
                    className={`taq-retiro-item ${selectedRetiro === enc.id ? 'taq-retiro-item--selected' : ''}`}
                    onClick={() => { setSelectedRetiro(enc.id); setRetiroResult(null); setRetiroCI(''); }}
                  >
                    <div className="taq-retiro-item__info">
                      <span className="data-table__code">{enc.codigo}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Para: <strong>{enc.destinatario}</strong>
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {enc.ruta} · {enc.oficina}
                      </span>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: verification panel */}
            <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
              <div className="dashboard-panel__header">
                <span className="dashboard-panel__title">
                  <CreditCard size={16} /> Verificación de identidad
                </span>
              </div>
              <div className="dashboard-panel__body">
                {!selectedRetiro ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <UserCheck size={40} strokeWidth={1.2} style={{ margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontSize: 14 }}>Seleccione una encomienda de la lista para verificar la identidad del destinatario.</p>
                  </div>
                ) : (() => {
                  const enc = MOCK_RETIRO.find(e => e.id === selectedRetiro)!;
                  return (
                    <div className="taq-verificacion">
                      <div className="taq-verificacion__datos">
                        <h4>Datos registrados del destinatario</h4>
                        <div className="detalle-card__fields">
                          <div><span><User size={11} /> Nombre</span><strong>{enc.destinatario}</strong></div>
                          <div><span><CreditCard size={11} /> CI registrado</span><strong>{enc.ci}</strong></div>
                        </div>
                      </div>

                      <div className="taq-verificacion__input">
                        <label className="form-label">Ingrese CI del destinatario presente</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej: 7 345 678 SC"
                          value={retiroCI}
                          onChange={(e) => { setRetiroCI(e.target.value); setRetiroResult(null); }}
                        />
                      </div>

                      {retiroResult === 'success' && (
                        <div className="taq-scan-result taq-scan-result--success">
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>Identidad verificada ✓</strong>
                            <span>Encomienda {enc.codigo} entregada exitosamente a {enc.destinatario}.</span>
                          </div>
                        </div>
                      )}
                      {retiroResult === 'error' && (
                        <div className="taq-scan-result taq-scan-result--error">
                          <AlertTriangle size={18} />
                          <div>
                            <strong>CI no coincide</strong>
                            <span>El CI ingresado no corresponde al destinatario registrado. Verifique el documento.</span>
                          </div>
                        </div>
                      )}

                      <button
                        className="btn btn--gold btn--full"
                        onClick={handleConfirmRetiro}
                        disabled={!retiroCI.trim() || retiroResult === 'success'}
                      >
                        <UserCheck size={16} /> Confirmar retiro
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Cola de Espera ═══════════════ */}
      {activeTab === 'cola' && (
        <div className="taq-content">
          <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title"><Package size={16} /> Encomiendas en proceso hoy</span>
            </div>
            <div className="dashboard-panel__body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Remitente → Destinatario</th>
                    <th>Ruta</th>
                    <th>Estado</th>
                    <th>Hora</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cod: 'EX-2026-SCZ-0048218', flow: 'Carlos Gutiérrez → María López P.', ruta: 'SCZ → PQA', est: 'RECEPCIONADO', hora: '12:15' },
                    { cod: 'EX-2026-SCZ-0048217', flow: 'Rosa Méndez S. → Juan C. Rojas V.', ruta: 'SCZ → PQA', est: 'EN_TRANSITO', hora: '11:42' },
                    { cod: 'EX-2026-PQA-0012340', flow: 'Jorge Mamani → Luisa Fernández', ruta: 'PQA → SCZ', est: 'DISPONIBLE', hora: '08:30' },
                    { cod: 'EX-2026-SCZ-0048220', flow: 'Patricia Rojas → Miguel Ángel T.', ruta: 'SCZ → ROB', est: 'ENTREGADO', hora: '09:20' },
                  ].map((item, i) => {
                    const STATUS: Record<string, { label: string; className: string }> = {
                      RECEPCIONADO: { label: 'Recepcionado', className: 'badge badge--blue' },
                      EN_TRANSITO: { label: 'En tránsito', className: 'badge badge--amber' },
                      DISPONIBLE: { label: 'Disponible', className: 'badge badge--emerald' },
                      ENTREGADO: { label: 'Entregado', className: 'badge badge--green' },
                    };
                    const badge = STATUS[item.est];
                    return (
                      <tr key={i}>
                        <td><span className="data-table__code">{item.cod}</span></td>
                        <td>{item.flow}</td>
                        <td><span className="data-table__route">{item.ruta}</span></td>
                        <td><span className={badge.className}><span className="badge__dot" /> {badge.label}</span></td>
                        <td className="data-table__time">{item.hora}</td>
                        <td>
                          <button className="enc-action-btn" title="Ver detalle">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
