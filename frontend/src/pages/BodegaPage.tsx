import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Warehouse, Truck, PackageCheck, PackageX, Package,
  CheckCircle2, AlertCircle, Loader2, MapPin
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

type BodegaTab = 'despacho' | 'transito' | 'llegada';

export default function BodegaPage() {
  const [activeTab, setActiveTab] = useState<BodegaTab>('despacho');
  const [actionMsg, setActionMsg] = useState('');
  const [asignandoId, setAsignandoId] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<string>('');

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

  const handleClasificar = async (id: string) => {
    try {
      await clasificar({ variables: { id } });
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
      await registrarCarga({ variables: { id } });
      notify('Carga registrada → EN TRÁNSITO');
      rRec();
      rTra();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleDescarga = async (id: string) => {
    try {
      await registrarDescarga({ variables: { id } });
      notify('Descarga registrada → EN DESTINO');
      rTra();
      rDes();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleDisponible = async (id: string) => {
    try {
      await marcarDisponible({ variables: { id } });
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
                              {buses.filter(b => b.routeCode === enc.routeCode && b.activo).map(b => (
                                <option key={b.id} value={b.id}>
                                  {b.flota} · {b.placa} ({b.capacidad - b.cargados} disp.)
                                </option>
                              ))}
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
    </div>
  );
}
