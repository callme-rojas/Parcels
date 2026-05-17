import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Warehouse, Truck, PackageCheck, PackageX, Package,
  CheckCircle2, Loader2, MapPin
} from 'lucide-react';
import { EstadoEncomienda } from '../types';
import type { Parcel, Bus } from '../types';
import { GET_PARCELS, GET_BUSES } from '../graphql/queries';
import {
  CLASIFICAR_ENCOMIENDA,
  ASIGNAR_BUS,
  REGISTRAR_CARGA,
  REGISTRAR_DESCARGA,
  MARCAR_DISPONIBLE
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

  // ─── Data Processing ───────────────────────────────────────
  const recepcionados: Parcel[] = qRecepcionado?.parcels || [];
  const enTransito: Parcel[] = qTransito?.parcels || [];
  const enDestino: Parcel[] = qDestino?.parcels || [];
  const buses: Bus[] = qBuses?.buses || [];

  const unassigned = recepcionados.filter(p => !p.assignedBusId);
  const assigned = recepcionados.filter(p => p.assignedBusId);

  // ─── Handlers ──────────────────────────────────────────────
  const notify = (msg: string, isError = false) => {
    setActionMsg(`${isError ? '❌' : '✅'} ${msg}`);
    setTimeout(() => setActionMsg(''), 5000);
  };

  const handleClasificar = async (id: string) => {
    try {
      await clasificar({ variables: { id } });
      notify('Encomienda clasificada');
      rRec();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleAsignarBus = async (parcelId: string) => {
    if (!selectedBus) return;
    try {
      await asignarBus({ variables: { input: { parcelId, busId: selectedBus, note: 'Asignado a bus' } } });
      notify('Bus asignado exitosamente');
      setAsignandoId(null);
      setSelectedBus('');
      rRec();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleCarga = async (id: string) => {
    try {
      await registrarCarga({ variables: { id } });
      notify('Carga registrada, encomienda EN TRANSITO');
      rRec();
      rTra();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleDescarga = async (id: string) => {
    try {
      await registrarDescarga({ variables: { id } });
      notify('Descarga registrada, encomienda EN DESTINO');
      rTra();
      rDes();
    } catch (e: any) { notify(e.message, true); }
  };

  const handleDisponible = async (id: string) => {
    try {
      await marcarDisponible({ variables: { id } });
      notify('Encomienda lista para retiro (DISPONIBLE)');
      rDes();
    } catch (e: any) { notify(e.message, true); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          Operaciones de Bodega
        </h1>
        <p className="text-slate-400 mt-1">
          Asigna encomiendas a buses, registra cargas y recibe paquetes en destino.
        </p>
      </div>

      {actionMsg && (
        <div className={`p-4 rounded-xl font-medium border flex items-center gap-3 animate-fade-in ${actionMsg.includes('❌') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
          {actionMsg}
        </div>
      )}

      {/* ─── KPIs ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Warehouse size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">Por Asignar</p>
            <p className="text-2xl font-bold text-slate-100">{lRec ? <Loader2 className="animate-spin w-5 h-5"/> : unassigned.length}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Truck size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">Por Cargar al Bus</p>
            <p className="text-2xl font-bold text-slate-100">{lRec ? <Loader2 className="animate-spin w-5 h-5"/> : assigned.length}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><PackageCheck size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">En Tránsito</p>
            <p className="text-2xl font-bold text-slate-100">{lTra ? <Loader2 className="animate-spin w-5 h-5"/> : enTransito.length}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Package size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">En Bodega (Destino)</p>
            <p className="text-2xl font-bold text-slate-100">{lDes ? <Loader2 className="animate-spin w-5 h-5"/> : enDestino.length}</p>
          </div>
        </div>
      </div>

      {/* ─── TABS ────────────────────────────── */}
      <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('despacho')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'despacho' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <Warehouse size={18} /> Origen: Despacho y Carga
        </button>
        <button
          onClick={() => setActiveTab('transito')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'transito' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <Truck size={18} /> En Tránsito: Descargar
        </button>
        <button
          onClick={() => setActiveTab('llegada')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'llegada' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <Package size={18} /> Destino: Disponer en Ventanilla
        </button>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
        
        {/* TAB 1: DESPACHO Y CARGA */}
        {activeTab === 'despacho' && (
          <div className="p-0">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700/50">
                <tr>
                  <th className="py-4 px-6">Encomienda</th>
                  <th className="py-4 px-6">Ruta</th>
                  <th className="py-4 px-6">Peso / Contenido</th>
                  <th className="py-4 px-6">Estado / Bus</th>
                  <th className="py-4 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {recepcionados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">No hay encomiendas recepcionadas esperando despacho.</td>
                  </tr>
                )}
                {recepcionados.map(enc => (
                  <tr key={enc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-200">{enc.trackingNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{enc.senderName}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/50 border border-slate-700 font-medium text-amber-400">
                        <MapPin size={14} /> {enc.routeCode}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-200">{enc.weight} kg</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]" title={enc.content}>{enc.content}</p>
                    </td>
                    <td className="py-4 px-6">
                      {enc.assignedBusId ? (
                        <div className="flex items-center gap-2 text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-lg w-fit border border-indigo-400/20">
                          <Truck size={14} />
                          <span className="font-medium text-xs">{enc.assignedBusPlaca}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-amber-500/70 border border-amber-500/20 bg-amber-500/10 px-2 py-1 rounded-md">Sin asignar</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {enc.assignedBusId ? (
                        <button
                          onClick={() => handleCarga(enc.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                        >
                          <PackageCheck size={16} /> Cargar a Bus
                        </button>
                      ) : asignandoId === enc.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={selectedBus}
                            onChange={(e) => setSelectedBus(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-amber-500"
                          >
                            <option value="">Selecciona bus...</option>
                            {buses.filter(b => b.routeCode === enc.routeCode).map(b => (
                              <option key={b.id} value={b.id}>{b.flota} ({b.placa}) - Disp: {b.capacidad - b.cargados}</option>
                            ))}
                          </select>
                          <button onClick={() => handleAsignarBus(enc.id)} disabled={!selectedBus} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-sm font-medium">OK</button>
                          <button onClick={() => setAsignandoId(null)} className="text-slate-400 hover:text-white px-2 py-1.5">✕</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleClasificar(enc.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
                            title="Dejar marca de clasificación en historial"
                          >
                            <Warehouse size={16} />
                          </button>
                          <button
                            onClick={() => { setAsignandoId(enc.id); setSelectedBus(''); }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-amber-500/20"
                          >
                            <Truck size={16} /> Asignar Bus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: TRANSITO Y DESCARGA */}
        {activeTab === 'transito' && (
          <div className="p-0">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700/50">
                <tr>
                  <th className="py-4 px-6">Encomienda</th>
                  <th className="py-4 px-6">Ruta</th>
                  <th className="py-4 px-6">Bus asignado</th>
                  <th className="py-4 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {enTransito.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">No hay encomiendas en tránsito esperando descarga.</td>
                  </tr>
                )}
                {enTransito.map(enc => (
                  <tr key={enc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-200">{enc.trackingNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{enc.weight} kg · {enc.content}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/50 border border-slate-700 font-medium text-purple-400">
                        <MapPin size={14} /> {enc.routeCode}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                       <p className="text-slate-200 font-medium">{enc.assignedBusFlota}</p>
                       <p className="text-xs text-slate-500 mt-0.5">{enc.assignedBusPlaca}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDescarga(enc.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20"
                      >
                        <PackageX size={16} /> Registrar Descarga
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: DESTINO Y DISPONER */}
        {activeTab === 'llegada' && (
          <div className="p-0">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700/50">
                <tr>
                  <th className="py-4 px-6">Encomienda</th>
                  <th className="py-4 px-6">Destinatario</th>
                  <th className="py-4 px-6">Descargado de</th>
                  <th className="py-4 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {enDestino.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">No hay encomiendas en bodega esperando ser puestas a disposición.</td>
                  </tr>
                )}
                {enDestino.map(enc => (
                  <tr key={enc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-200">{enc.trackingNumber}</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded bg-slate-900/50 border border-slate-700 font-medium text-[10px] text-emerald-400">
                        <MapPin size={10} /> {enc.routeCode}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-200 font-medium">{enc.recipientName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">CI: {enc.recipientCi}</p>
                    </td>
                    <td className="py-4 px-6">
                       <p className="text-slate-200 text-sm">{enc.assignedBusFlota}</p>
                       <p className="text-xs text-slate-500 mt-0.5">{enc.assignedBusPlaca}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDisponible(enc.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle2 size={16} /> Marcar Disponible
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
