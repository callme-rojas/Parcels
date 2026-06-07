import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Warehouse, Truck, PackageCheck, PackageX, Package,
  CheckCircle2, AlertCircle, Loader2, MapPin, ScanBarcode, X
} from 'lucide-react';
import { EstadoEncomienda } from '../types';
import type { Parcel, Bus } from '../types';
import { GET_PARCELS, GET_BUSES } from '../graphql/queries';
import {
  CLASIFICAR_ENCOMIENDA,
  ASIGNAR_BUS,
  REGISTRAR_CARGA,
  REGISTRAR_DESCARGA,
  MARCAR_DISPONIBLE,
} from '../graphql/mutations';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

type BodegaTab = 'despacho' | 'transito' | 'llegada';

export default function BodegaPage() {
  const [activeTab, setActiveTab] = useState<BodegaTab>('despacho');
  const [actionMsg, setActionMsg] = useState('');
  const [asignandoId, setAsignandoId] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedParcel, setScannedParcel] = useState<Parcel | null>(null);
  const [showScanActionModal, setShowScanActionModal] = useState(false);

  // ─── Queries ──────────────────────────────────────────────
  const { data: qRecepcionado, loading: lRec, refetch: rRec } = useQuery<{ parcels: Parcel[] }>(GET_PARCELS, {
    variables: { filter: { status: EstadoEncomienda.RECEPCIONADO } },
    fetchPolicy: 'cache-and-network',
  });

  const { data: qTransito, loading: lTra, refetch: rTra } = useQuery<{ parcels: Parcel[] }>(GET_PARCELS, {
    variables: { filter: { status: EstadoEncomienda.EN_TRANSITO } },
    fetchPolicy: 'cache-and-network',
  });

  const { data: qDestino, loading: lDes, refetch: rDes } = useQuery<{ parcels: Parcel[] }>(GET_PARCELS, {
    variables: { filter: { status: EstadoEncomienda.EN_DESTINO } },
    fetchPolicy: 'cache-and-network',
  });

  const { data: qBuses } = useQuery<{ buses: Bus[] }>(GET_BUSES, { fetchPolicy: 'cache-and-network' });

  // ─── Mutations ─────────────────────────────────────────────
  const [clasificar] = useMutation(CLASIFICAR_ENCOMIENDA);
  const [asignarBus] = useMutation(ASIGNAR_BUS);
  const [registrarCarga] = useMutation(REGISTRAR_CARGA);
  const [registrarDescarga] = useMutation(REGISTRAR_DESCARGA);
  const [marcarDisponible] = useMutation(MARCAR_DISPONIBLE);

  // ─── Data ──────────────────────────────────────────────────
  const recepcionados: Parcel[] = qRecepcionado?.parcels || [];
  const enTransito: Parcel[] = qTransito?.parcels || [];
  const enDestino: Parcel[] = qDestino?.parcels || [];
  const buses: Bus[] = qBuses?.buses || [];

  // ─── Handlers ──────────────────────────────────────────────
  const notify = (msg: string, isError = false) => {
    setActionMsg(`${isError ? '❌' : '✅'} ${msg}`);
    setTimeout(() => setActionMsg(''), 5000);
  };

  const handleScanSuccess = (text: string) => {
    setShowScanner(false);
    let tracking = text.trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.t) {
        tracking = parsed.t;
      }
    } catch (e) {
      // not a JSON, use raw text
    }

    const found = [...recepcionados, ...enTransito, ...enDestino].find(
      p => p.trackingNumber.toLowerCase() === tracking.toLowerCase()
    );

    if (found) {
      setScannedParcel(found);
      setShowScanActionModal(true);
      if (found.status === EstadoEncomienda.RECEPCIONADO) {
        setActiveTab('despacho');
      } else if (found.status === EstadoEncomienda.EN_TRANSITO) {
        setActiveTab('transito');
      } else if (found.status === EstadoEncomienda.EN_DESTINO) {
        setActiveTab('llegada');
      }
    } else {
      notify(`No se encontró la encomienda "${tracking}" en las listas de bodega.`, true);
    }
  };

  const handleClasificar = async (id: string) => {
    try {
      await clasificar({ variables: { input: { parcelId: id } } });
      notify('Evento de clasificación registrado');
      rRec();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleAsignarBus = async (parcelId: string) => {
    if (!selectedBus) return;
    try {
      await asignarBus({ variables: { input: { parcelId, busId: selectedBus, note: 'Asignado a bus desde bodega' } } });
      notify('Bus asignado exitosamente');
      setAsignandoId(null);
      setSelectedBus('');
      rRec();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleCarga = async (id: string) => {
    try {
      await registrarCarga({ variables: { input: { parcelId: id } } });
      notify('Carga registrada → EN TRÁNSITO');
      rRec();
      rTra();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleDescarga = async (id: string) => {
    try {
      await registrarDescarga({ variables: { input: { parcelId: id } } });
      notify('Descarga registrada → EN DESTINO');
      rTra();
      rDes();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleDisponible = async (id: string) => {
    try {
      await marcarDisponible({ variables: { input: { parcelId: id } } });
      notify('Encomienda marcada como DISPONIBLE para retiro');
      rDes();
    } catch (e: any) { notify(e.message, true); }
  };

  return (
    <div className="panel-page">
      {/* ─── KPIs ────────────────────────────── */}
      <section className="dashboard__kpis">
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header"><span className="kpi-card__icon"><Warehouse size={22} /></span></div>
          <div className="kpi-card__value">{lRec ? <Loader2 size={18} className="spin" /> : recepcionados.filter(p => !p.assignedBusId).length}</div>
          <div className="kpi-card__label">Por asignar bus</div>
        </div>
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header"><span className="kpi-card__icon"><Truck size={22} /></span></div>
          <div className="kpi-card__value">{lRec ? <Loader2 size={18} className="spin" /> : recepcionados.filter(p => p.assignedBusId).length}</div>
          <div className="kpi-card__label">Por cargar al bus</div>
        </div>
        <div className="kpi-card kpi-card--purple">
          <div className="kpi-card__header"><span className="kpi-card__icon"><PackageCheck size={22} /></span></div>
          <div className="kpi-card__value">{lTra ? <Loader2 size={18} className="spin" /> : enTransito.length}</div>
          <div className="kpi-card__label">En tránsito</div>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header"><span className="kpi-card__icon"><Package size={22} /></span></div>
          <div className="kpi-card__value">{lDes ? <Loader2 size={18} className="spin" /> : enDestino.length}</div>
          <div className="kpi-card__label">En bodega destino</div>
        </div>
      </section>

      {/* ─── Notificaciones ──────────────────── */}
      {actionMsg && (
        <div className={`taq-scan-result ${actionMsg.includes('❌') ? 'taq-scan-result--error' : 'taq-scan-result--success'}`}
          style={{ marginBottom: 12 }}>
          {actionMsg}
        </div>
      )}

      {/* ─── Tabs ────────────────────────────── */}
      <div className="taq-tabs">
        <button className={`taq-tab ${activeTab === 'despacho' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('despacho')}>
          <Warehouse size={16} /> Origen: Despacho y Carga
          <span className="enc-tab__count">{recepcionados.length}</span>
        </button>
        <button className={`taq-tab ${activeTab === 'transito' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('transito')}>
          <Truck size={16} /> En Tránsito: Descargar
          <span className="enc-tab__count">{enTransito.length}</span>
        </button>
        <button className={`taq-tab ${activeTab === 'llegada' ? 'taq-tab--active' : ''}`} onClick={() => setActiveTab('llegada')}>
          <Package size={16} /> Destino: Disponible Retiro
          <span className="enc-tab__count">{enDestino.length}</span>
        </button>
        <button
          className="btn btn--gold btn--sm"
          style={{ marginLeft: 'auto', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setShowScanner(true)}
        >
          <ScanBarcode size={14} /> Escanear Etiqueta
        </button>
      </div>

      {/* ═══ TAB 1: DESPACHO ════════════════════ */}
      {activeTab === 'despacho' && (
        <div className="taq-content">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title">
                <Warehouse size={16} /> Encomiendas recepcionadas — asignar bus y cargar
              </span>
            </div>
            <div className="dashboard-panel__body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Ruta</th>
                    <th>Peso / Contenido</th>
                    <th>Bus asignado</th>
                    <th style={{ width: 260 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {recepcionados.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No hay encomiendas recepcionadas esperando despacho.
                    </td></tr>
                  )}
                  {recepcionados.map(enc => (
                    <tr key={enc.id}>
                      <td>
                        <span className="data-table__code">{enc.trackingNumber}</span>
                        <br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{enc.senderName}</span>
                      </td>
                      <td><span className="data-table__route"><MapPin size={12} /> {enc.routeCode}</span></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{enc.weight} kg</span>
                        <br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{enc.content}</span>
                      </td>
                      <td>
                        {enc.assignedBusId ? (
                          <span className="badge badge--cyan">
                            <span className="badge__dot" /> {enc.assignedBusPlaca}
                          </span>
                        ) : (
                          <span className="badge badge--amber">
                            <span className="badge__dot" /> Sin asignar
                          </span>
                        )}
                      </td>
                      <td>
                        {enc.assignedBusId ? (
                          <button className="btn btn--primary btn--sm" onClick={() => handleCarga(enc.id)}>
                            <PackageCheck size={13} /> Registrar Carga
                          </button>
                        ) : asignandoId === enc.id ? (
                          <div className="bodega-bus-select">
                            <select
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                              value={selectedBus}
                              onChange={(e) => setSelectedBus(e.target.value)}
                            >
                              <option value="">Seleccionar bus...</option>
                              {buses.filter(b => b.routeCode === enc.routeCode && b.activo).map(b => {
                                const isFull = b.cargados >= b.capacidad;
                                return (
                                  <option key={b.id} value={b.id} disabled={isFull}>
                                    {b.flota} · {b.placa} ({isFull ? '0' : b.capacidad - b.cargados} disp. / max {b.capacidad}){isFull ? ' [LLENO]' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            <button className="btn btn--primary btn--sm" disabled={!selectedBus} onClick={() => handleAsignarBus(enc.id)}>OK</button>
                            <button className="btn btn--secondary btn--sm" onClick={() => setAsignandoId(null)}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn--secondary btn--sm" title="Registrar clasificación" onClick={() => handleClasificar(enc.id)}>
                              <Warehouse size={13} />
                            </button>
                            <button className="btn btn--primary btn--sm" onClick={() => { setAsignandoId(enc.id); setSelectedBus(''); }}>
                              <Truck size={13} /> Asignar Bus
                            </button>
                          </div>
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

      {/* ═══ TAB 2: TRÁNSITO Y DESCARGA ════════ */}
      {activeTab === 'transito' && (
        <div className="taq-content">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title">
                <Truck size={16} /> Encomiendas en tránsito — registrar descarga en destino
                {enTransito.length > 0 && (
                  <span className="badge badge--amber" style={{ marginLeft: 8 }}>
                    <AlertCircle size={11} /> {enTransito.length} en ruta
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
                  {enTransito.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No hay encomiendas en tránsito.
                    </td></tr>
                  )}
                  {enTransito.map(enc => (
                    <tr key={enc.id}>
                      <td><span className="data-table__code">{enc.trackingNumber}</span></td>
                      <td><span className="data-table__route">{enc.routeCode}</span></td>
                      <td>{enc.weight} kg</td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {enc.assignedBusFlota} · {enc.assignedBusPlaca}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn--primary btn--sm" onClick={() => handleDescarga(enc.id)}>
                          <PackageX size={13} /> Registrar Descarga
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

      {/* ═══ TAB 3: DESTINO → DISPONIBLE ════════ */}
      {activeTab === 'llegada' && (
        <div className="taq-content">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <span className="dashboard-panel__title">
                <Package size={16} /> Encomiendas en bodega destino — marcar disponible para retiro
              </span>
            </div>
            <div className="dashboard-panel__body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Destinatario</th>
                    <th>Ruta</th>
                    <th>Bus descargado de</th>
                    <th style={{ width: 180 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {enDestino.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No hay encomiendas esperando ser puestas a disposición.
                    </td></tr>
                  )}
                  {enDestino.map(enc => (
                    <tr key={enc.id}>
                      <td><span className="data-table__code">{enc.trackingNumber}</span></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{enc.recipientName}</span>
                        <br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CI: {enc.recipientCi}</span>
                      </td>
                      <td><span className="data-table__route">{enc.routeCode}</span></td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {enc.assignedBusFlota} · {enc.assignedBusPlaca}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn--primary btn--sm" onClick={() => handleDisponible(enc.id)}>
                          <CheckCircle2 size={13} /> Marcar Disponible
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

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Scan Action Modal */}
      {showScanActionModal && scannedParcel && (
        <div className="modal-overlay" onClick={() => setShowScanActionModal(false)} style={{ zIndex: 999 }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal__header">
              <h3>Paquete Escaneado</h3>
              <button className="modal__close" onClick={() => setShowScanActionModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal__body" style={{ padding: 20 }}>
              <div className="detail-card__header" style={{ marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Código de Encomienda</span>
                  <div className="data-table__code" style={{ fontSize: 18, marginTop: 4 }}>{scannedParcel.trackingNumber}</div>
                </div>
                <span className={`badge ${
                  scannedParcel.status === 'RECEPCIONADO' ? 'badge--cyan' :
                  scannedParcel.status === 'EN_TRANSITO' ? 'badge--amber' :
                  scannedParcel.status === 'EN_DESTINO' ? 'badge--purple' :
                  scannedParcel.status === 'DISPONIBLE' ? 'badge--emerald' :
                  scannedParcel.status === 'ENTREGADO' ? 'badge--green' :
                  'badge--gray'
                }`}>
                  {scannedParcel.status}
                </span>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Contenido</span>
                    <strong>{scannedParcel.content}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Peso</span>
                    <strong>{scannedParcel.weight} kg</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Remitente</span>
                    <strong>{scannedParcel.senderName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Destinatario</span>
                    <strong>{scannedParcel.recipientName}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>Ruta</span>
                    <strong>{scannedParcel.routeCode} ({scannedParcel.originAddress.split(',')[0]} → {scannedParcel.destinationAddress.split(',')[0]})</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scannedParcel.status === 'RECEPCIONADO' && (
                  <>
                    <button
                      className="btn btn--secondary btn--full"
                      onClick={() => {
                        handleClasificar(scannedParcel.id);
                        setShowScanActionModal(false);
                      }}
                    >
                      <Warehouse size={16} /> Clasificar en Bodega
                    </button>

                    {scannedParcel.assignedBusId ? (
                      <button
                        className="btn btn--primary btn--full"
                        onClick={() => {
                          handleCarga(scannedParcel.id);
                          setShowScanActionModal(false);
                        }}
                      >
                        <PackageCheck size={16} /> Cargar en Bus ({scannedParcel.assignedBusPlaca})
                      </button>
                    ) : (
                      <div className="form-group" style={{ margin: 0, padding: '10px 0' }}>
                        <label className="form-label" style={{ fontSize: 12 }}>Asignar Bus para Despacho</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select
                            className="form-input"
                            style={{ flex: 1 }}
                            value={selectedBus}
                            onChange={(e) => setSelectedBus(e.target.value)}
                          >
                            <option value="">Seleccionar bus...</option>
                            {buses.filter(b => b.routeCode === scannedParcel.routeCode && b.activo).map(b => (
                              <option key={b.id} value={b.id}>
                                {b.flota} · {b.placa} ({b.capacidad - b.cargados} disp.)
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn--primary"
                            disabled={!selectedBus}
                            onClick={() => {
                              handleAsignarBus(scannedParcel.id);
                              setShowScanActionModal(false);
                            }}
                          >
                            Asignar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {scannedParcel.status === 'EN_TRANSITO' && (
                  <button
                    className="btn btn--primary btn--full"
                    onClick={() => {
                      handleDescarga(scannedParcel.id);
                      setShowScanActionModal(false);
                    }}
                  >
                    <PackageX size={16} /> Registrar Descarga (Llegada a Bodega)
                  </button>
                )}

                {scannedParcel.status === 'EN_DESTINO' && (
                  <button
                    className="btn btn--gold btn--full"
                    onClick={() => {
                      handleDisponible(scannedParcel.id);
                      setShowScanActionModal(false);
                    }}
                  >
                    <CheckCircle2 size={16} /> Marcar Disponible para Retiro
                  </button>
                )}

                {(scannedParcel.status === 'REGISTRADO' ||
                  scannedParcel.status === 'DISPONIBLE' ||
                  scannedParcel.status === 'ENTREGADO' ||
                  scannedParcel.status === 'CANCELADO') && (
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(229, 161, 0, 0.1)', border: '1px solid var(--gold)', borderRadius: 6, color: 'var(--gold)', fontSize: 13 }}>
                    <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {scannedParcel.status === 'REGISTRADO' && 'Este paquete aún no ha sido recepcionado en la taquilla de origen.'}
                    {scannedParcel.status === 'DISPONIBLE' && 'Este paquete ya está disponible para retiro del cliente en taquilla.'}
                    {scannedParcel.status === 'ENTREGADO' && 'Este paquete ya fue entregado al destinatario final.'}
                    {scannedParcel.status === 'CANCELADO' && 'Esta encomienda ha sido cancelada.'}
                  </div>
                )}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary btn--full" onClick={() => setShowScanActionModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
