import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, ScanLine, UserCheck, ClipboardCheck,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Hash, User, CreditCard, Eye, Loader2, MapPin
} from 'lucide-react';
import { useParcels, useUpdateParcelStatus, useConfirmarRetiro } from '../hooks/useParcel';
import { EstadoEncomienda } from '../types';
import type { Parcel } from '../types';

type TabKey = 'recepcion' | 'retiro' | 'cola';

const STATUS_BADGE: Record<string, string> = {
  REGISTRADO: 'badge badge--blue',
  RECEPCIONADO: 'badge badge--cyan',
  EN_TRANSITO: 'badge badge--amber',
  EN_DESTINO: 'badge badge--purple',
  DISPONIBLE: 'badge badge--emerald',
  ENTREGADO: 'badge badge--green',
  CANCELADO: 'badge badge--red',
};

const STATUS_LABEL: Record<string, string> = {
  REGISTRADO: 'Registrado',
  RECEPCIONADO: 'Recepcionado',
  EN_TRANSITO: 'En Tránsito',
  EN_DESTINO: 'En Destino',
  DISPONIBLE: 'Disponible',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export default function TaquillaPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('recepcion');

  // States for Scanner
  const [searchCode, setSearchCode] = useState('');
  const [scannedParcel, setScannedParcel] = useState<Parcel | null>(null);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);

  // States for Retiro
  const [retiroCI, setRetiroCI] = useState('');
  const [retiroResult, setRetiroResult] = useState<'success' | 'error' | 'ci_error' | null>(null);
  const [selectedRetiro, setSelectedRetiro] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  // ─── Queries ──────────────────────────────────────────────
  const { parcels: pendientes, loading: loadingPendientes, refetch: rPend } =
    useParcels({ status: EstadoEncomienda.REGISTRADO });
  const { parcels: disponibles, loading: loadingDisponibles, refetch: rDisp } =
    useParcels({ status: EstadoEncomienda.DISPONIBLE });
  const { parcels: todas, loading: loadingTodas } = useParcels();

  // ─── Mutations ────────────────────────────────────────────
  const { updateStatus } = useUpdateParcelStatus();
  const { confirmarRetiro, loading: confirmando } = useConfirmarRetiro();

  // ─── Handlers ──────────────────────────────────────────────
  const notify = (msg: string, isError = false) => {
    setActionMsg(`${isError ? '❌' : '✅'} ${msg}`);
    setTimeout(() => setActionMsg(''), 5000);
  };

  const handleScan = () => {
    if (!searchCode.trim()) return;
    const found = pendientes.find(p =>
      p.trackingNumber.toLowerCase().includes(searchCode.toLowerCase())
    );
    if (found) { setScannedParcel(found); setScanResult('success'); }
    else { setScannedParcel(null); setScanResult('error'); }
  };

  const handleRecepcionar = async (parcelId: string, trackingNumber: string) => {
    try {
      await updateStatus({ id: parcelId, status: EstadoEncomienda.RECEPCIONADO, note: 'Recepcionado físicamente en Taquilla' });
      notify(`${trackingNumber} recepcionada correctamente.`);
      rPend();
      if (scannedParcel?.id === parcelId) {
        setScanResult(null); setScannedParcel(null); setSearchCode('');
      }
    } catch (e: any) { notify(e.message, true); }
  };

  const handleConfirmRetiro = async () => {
    if (!retiroCI.trim() || !selectedRetiro) return;
    setRetiroResult(null);
    try {
      await confirmarRetiro({ parcelId: selectedRetiro, recipientCi: retiroCI });
      setRetiroResult('success');
      rDisp();
    } catch (e: any) {
      const msg: string = e?.message || '';
      setRetiroResult(msg.toLowerCase().includes('ci') ? 'ci_error' : 'error');
    }
  };

  return (
    <div className="panel-page">

      {/* ─── KPIs ────────────────────────────── */}
      <section className="dashboard__kpis">
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header"><span className="kpi-card__icon"><Package size={22} /></span></div>
          <div className="kpi-card__value">{loadingPendientes ? <Loader2 size={18} className="spin" /> : pendientes.length}</div>
          <div className="kpi-card__label">Por Recepcionar</div>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header"><span className="kpi-card__icon"><UserCheck size={22} /></span></div>
          <div className="kpi-card__value">{loadingDisponibles ? <Loader2 size={18} className="spin" /> : disponibles.length}</div>
          <div className="kpi-card__label">Disponibles (Retiro)</div>
        </div>
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header"><span className="kpi-card__icon"><ClipboardCheck size={22} /></span></div>
          <div className="kpi-card__value">{loadingTodas ? <Loader2 size={18} className="spin" /> : todas.length}</div>
          <div className="kpi-card__label">Total en Sistema</div>
        </div>
      </section>

      {/* ─── Notificaciones ────────────────────── */}
      {actionMsg && (
        <div className={`taq-scan-result ${actionMsg.includes('❌') ? 'taq-scan-result--error' : 'taq-scan-result--success'}`}
          style={{ marginBottom: 12 }}>
          {actionMsg}
        </div>
      )}

      {/* ─── Tabs ────────────────────────────── */}
      <div className="taq-tabs">
        <button className={`taq-tab ${activeTab === 'recepcion' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('recepcion')}>
          <ScanLine size={16} /> Recepción
          <span className="enc-tab__count">{pendientes.length}</span>
        </button>
        <button className={`taq-tab ${activeTab === 'retiro' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('retiro')}>
          <UserCheck size={16} /> Confirmar Retiro
          <span className="enc-tab__count">{disponibles.length}</span>
        </button>
        <button className={`taq-tab ${activeTab === 'cola' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('cola')}>
          <Package size={16} /> Historial General
        </button>
      </div>

      {/* ═══ TAB: RECEPCION ═════════════════════ */}
      {activeTab === 'recepcion' && (
        <div className="taq-content">

          {/* Scanner */}
          <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title"><ScanLine size={16} /> Escanear o ingresar código</span>
            </div>
            <div className="dashboard-panel__body">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Ingrese el número de tracking para recepcionar la encomienda.
              </p>
              <div className="taq-scanner">
                <div className="enc-search">
                  <Hash size={16} />
                  <input
                    type="text"
                    placeholder="EX-2026-SCZ-XXXXXXX"
                    value={searchCode}
                    onChange={(e) => { setSearchCode(e.target.value); setScanResult(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  />
                  <button className="btn btn--primary btn--sm" onClick={handleScan}>
                    <Search size={14} /> Buscar
                  </button>
                </div>

                {scanResult === 'success' && scannedParcel && (
                  <div className="taq-scan-result taq-scan-result--success">
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>Encomienda encontrada</strong>
                      <span>{scannedParcel.trackingNumber} — {scannedParcel.senderName} → {scannedParcel.recipientName}</span>
                    </div>
                    <button className="btn btn--primary btn--sm" onClick={() => handleRecepcionar(scannedParcel.id, scannedParcel.trackingNumber)}>
                      Recepcionar
                    </button>
                  </div>
                )}
                {scanResult === 'error' && (
                  <div className="taq-scan-result taq-scan-result--error">
                    <XCircle size={18} />
                    <div>
                      <strong>No encontrada</strong>
                      <span>No se encontró encomienda REGISTRADA con ese código.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lista pendientes */}
          <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title">
                <Package size={16} /> Encomiendas pendientes de recepción
                <span className="badge badge--amber" style={{ marginLeft: 8 }}>{pendientes.length}</span>
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
                    <th style={{ width: 160 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No hay encomiendas registradas pendientes.</td></tr>
                  )}
                  {pendientes.map(enc => (
                    <tr key={enc.id}>
                      <td><span className="data-table__code">{enc.trackingNumber}</span></td>
                      <td>{enc.senderName}</td>
                      <td>{enc.recipientName}</td>
                      <td><span className="data-table__route"><MapPin size={12} /> {enc.routeCode}</span></td>
                      <td>{enc.weight} kg</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn--primary btn--sm" onClick={() => handleRecepcionar(enc.id, enc.trackingNumber)}>
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

      {/* ═══ TAB: RETIRO ════════════════════════ */}
      {activeTab === 'retiro' && (
        <div className="taq-content">
          <div className="taq-retiro-layout">
            {/* Lista disponibles */}
            <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
              <div className="dashboard-panel__header">
                <span className="dashboard-panel__title">
                  <Package size={16} /> Encomiendas disponibles para retiro
                </span>
              </div>
              <div className="dashboard-panel__body" style={{ padding: 0 }}>
                {disponibles.length === 0 && (
                  <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay encomiendas esperando retiro.
                  </p>
                )}
                {disponibles.map(enc => (
                  <div
                    key={enc.id}
                    className={`taq-retiro-item ${selectedRetiro === enc.id ? 'taq-retiro-item--selected' : ''}`}
                    onClick={() => { setSelectedRetiro(enc.id); setRetiroResult(null); setRetiroCI(''); }}
                  >
                    <div className="taq-retiro-item__info">
                      <span className="data-table__code">{enc.trackingNumber}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Para: <strong>{enc.recipientName}</strong>
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{enc.routeCode}</span>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Panel verificación */}
            <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
              <div className="dashboard-panel__header">
                <span className="dashboard-panel__title"><CreditCard size={16} /> Verificación de identidad</span>
              </div>
              <div className="dashboard-panel__body">
                {!selectedRetiro ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <UserCheck size={40} strokeWidth={1.2} style={{ margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontSize: 14 }}>Seleccione una encomienda para verificar la identidad.</p>
                  </div>
                ) : (() => {
                  const enc = disponibles.find(e => e.id === selectedRetiro)!;
                  return (
                    <div className="taq-verificacion">
                      <div className="taq-verificacion__datos">
                        <h4>Datos registrados del destinatario</h4>
                        <div className="detalle-card__fields">
                          <div><span><User size={11} /> Nombre</span><strong>{enc.recipientName}</strong></div>
                          <div><span><CreditCard size={11} /> CI registrado</span><strong>{enc.recipientCi}</strong></div>
                        </div>
                      </div>

                      <div className="taq-verificacion__input">
                        <label className="form-label">Ingrese CI del destinatario presente</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej: 7345678"
                          value={retiroCI}
                          onChange={(e) => { setRetiroCI(e.target.value); setRetiroResult(null); }}
                        />
                      </div>

                      {retiroResult === 'success' && (
                        <div className="taq-scan-result taq-scan-result--success">
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>Identidad verificada ✓</strong>
                            <span>Encomienda {enc.trackingNumber} entregada a {enc.recipientName}.</span>
                          </div>
                        </div>
                      )}
                      {(retiroResult === 'error' || retiroResult === 'ci_error') && (
                        <div className="taq-scan-result taq-scan-result--error">
                          <AlertTriangle size={18} />
                          <div>
                            <strong>CI no coincide</strong>
                            <span>El CI ingresado no corresponde al destinatario registrado.</span>
                          </div>
                        </div>
                      )}

                      <button
                        className="btn btn--gold btn--full"
                        onClick={handleConfirmRetiro}
                        disabled={!retiroCI.trim() || confirmando || retiroResult === 'success'}
                      >
                        {confirmando ? <Loader2 size={16} className="spin" /> : <UserCheck size={16} />}
                        {confirmando ? 'Verificando...' : 'Confirmar retiro'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: HISTORIAL ═════════════════════ */}
      {activeTab === 'cola' && (
        <div className="taq-content">
          <div className="dashboard-panel" style={{ animationDelay: '0s' }}>
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title"><Package size={16} /> Historial general de encomiendas</span>
            </div>
            <div className="dashboard-panel__body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Ruta</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {todas.slice(0, 50).map(enc => (
                    <tr key={enc.id}>
                      <td><span className="data-table__code">{enc.trackingNumber}</span></td>
                      <td><span className="data-table__route">{enc.routeCode}</span></td>
                      <td>
                        <span className={STATUS_BADGE[enc.status] || 'badge'}>
                          <span className="badge__dot" />
                          {STATUS_LABEL[enc.status] || enc.status}
                        </span>
                      </td>
                      <td>
                        <button className="enc-action-btn" title="Ver detalle" onClick={() => navigate(`/encomiendas/${enc.id}`)}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {todas.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No hay encomiendas en el sistema.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
