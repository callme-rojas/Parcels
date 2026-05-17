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
  const { parcels: pendientes, loading: loadingPendientes, refetch: rPend } = useParcels({ status: EstadoEncomienda.REGISTRADO });
  const { parcels: disponibles, loading: loadingDisponibles, refetch: rDisp } = useParcels({ status: EstadoEncomienda.DISPONIBLE });
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
    const found = pendientes.find(p => p.trackingNumber.toLowerCase().includes(searchCode.toLowerCase()));
    if (found) { setScannedParcel(found); setScanResult('success'); }
    else { setScannedParcel(null); setScanResult('error'); }
  };

  const handleRecepcionar = async (parcelId: string, trackingNumber: string) => {
    try {
      await updateStatus({ id: parcelId, status: EstadoEncomienda.RECEPCIONADO, note: 'Recepcionado físicamente en Taquilla' });
      notify(`Encomienda ${trackingNumber} RECEPCIONADA exitosamente.`);
      rPend();
      if (scannedParcel?.id === parcelId) { setScanResult(null); setScannedParcel(null); setSearchCode(''); }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Operaciones de Taquilla
        </h1>
        <p className="text-slate-400 mt-1">
          Recepciona paquetes entrantes y confirma retiros en ventanilla.
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
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Package size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">Por Recepcionar</p>
            <p className="text-2xl font-bold text-slate-100">{loadingPendientes ? <Loader2 className="animate-spin w-5 h-5"/> : pendientes.length}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><UserCheck size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">Disponibles (Retiro)</p>
            <p className="text-2xl font-bold text-slate-100">{loadingDisponibles ? <Loader2 className="animate-spin w-5 h-5"/> : disponibles.length}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><ClipboardCheck size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">En Sistema</p>
            <p className="text-2xl font-bold text-slate-100">{loadingTodas ? <Loader2 className="animate-spin w-5 h-5"/> : todas.length}</p>
          </div>
        </div>
      </div>

      {/* ─── TABS ────────────────────────────── */}
      <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('recepcion')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'recepcion' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <ScanLine size={18} /> Recepción
        </button>
        <button
          onClick={() => setActiveTab('retiro')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'retiro' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <UserCheck size={18} /> Retiros
        </button>
        <button
          onClick={() => setActiveTab('cola')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'cola' ? 'bg-slate-600 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <Package size={18} /> Historial General
        </button>
      </div>

      {/* ═══ TAB: RECEPCION ═════════════════════ */}
      {activeTab === 'recepcion' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100 mb-4">
                <ScanLine className="text-cyan-400" /> Escanear Código
              </h3>
              <p className="text-sm text-slate-400 mb-4">Ingrese el número de tracking de la encomienda a recepcionar.</p>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => { setSearchCode(e.target.value); setScanResult(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="EX-2026-..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-cyan-500"
                  />
                </div>
                <button onClick={handleScan} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl transition-colors">
                  <Search size={18} />
                </button>
              </div>

              {scanResult === 'success' && scannedParcel && (
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-4 animate-fade-in">
                  <div className="flex items-center gap-3 text-cyan-400">
                    <CheckCircle2 size={24} />
                    <div>
                      <p className="font-bold">Encomienda Encontrada</p>
                      <p className="text-xs text-slate-300 mt-0.5">{scannedParcel.trackingNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRecepcionar(scannedParcel.id, scannedParcel.trackingNumber)}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    Confirmar Recepción
                  </button>
                </div>
              )}
              {scanResult === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-fade-in">
                  <XCircle size={24} />
                  <p className="text-sm">No se encontró una encomienda PENDIENTE con ese código.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Package className="text-slate-400" size={18} />
                  Pendientes de Recepción
                </h3>
                <span className="bg-amber-500/20 text-amber-500 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
                  {pendientes.length}
                </span>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
                    <tr>
                      <th className="py-3 px-5">Código / Detalles</th>
                      <th className="py-3 px-5">Ruta</th>
                      <th className="py-3 px-5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {pendientes.length === 0 && (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-500">No hay encomiendas registradas pendientes de recepción.</td></tr>
                    )}
                    {pendientes.map(enc => (
                      <tr key={enc.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-5">
                          <p className="font-bold text-slate-200">{enc.trackingNumber}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{enc.senderName} → {enc.recipientName}</p>
                        </td>
                        <td className="py-3 px-5">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 text-xs text-slate-300 border border-slate-700">
                            <MapPin size={12} /> {enc.routeCode}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleRecepcionar(enc.id, enc.trackingNumber)}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-cyan-500/20"
                          >
                            Recepcionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: RETIRO ════════════════════════ */}
      {activeTab === 'retiro' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <UserCheck className="text-slate-400" size={18} />
                  Disponibles en Ventanilla
                </h3>
              </div>
              <div className="p-0 max-h-[600px] overflow-y-auto">
                {disponibles.length === 0 && (
                  <div className="py-12 text-center text-slate-500">No hay encomiendas esperando retiro.</div>
                )}
                {disponibles.map(enc => (
                  <div
                    key={enc.id}
                    onClick={() => { setSelectedRetiro(enc.id); setRetiroResult(null); setRetiroCI(''); }}
                    className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors flex items-center justify-between ${
                      selectedRetiro === enc.id ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-200">{enc.trackingNumber}</p>
                      <p className="text-sm text-slate-400 mt-1">Para: <span className="text-slate-200">{enc.recipientName}</span></p>
                    </div>
                    <ChevronRight className={selectedRetiro === enc.id ? 'text-emerald-400' : 'text-slate-600'} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sticky top-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100 mb-6">
                <CreditCard className="text-emerald-400" /> Verificación de Identidad
              </h3>
              
              {!selectedRetiro ? (
                <div className="text-center py-12 text-slate-500">
                  <UserCheck size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Seleccione una encomienda de la lista para verificar la identidad del destinatario.</p>
                </div>
              ) : (() => {
                const enc = disponibles.find(e => e.id === selectedRetiro)!;
                return (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Datos Registrados</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5"><User size={14}/> Destinatario</span>
                          <span className="font-medium text-slate-200">{enc.recipientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5"><CreditCard size={14}/> Carnet (CI)</span>
                          <span className="font-medium text-slate-200">{enc.recipientCi}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Ingrese CI físico presentado</label>
                      <input
                        type="text"
                        value={retiroCI}
                        onChange={(e) => { setRetiroCI(e.target.value); setRetiroResult(null); }}
                        placeholder="Ej: 7123456"
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {retiroResult === 'success' && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 animate-fade-in">
                        <CheckCircle2 className="shrink-0" />
                        <div>
                          <p className="font-bold">Identidad Verificada</p>
                          <p className="text-sm mt-0.5">Encomienda entregada exitosamente a su destinatario.</p>
                        </div>
                      </div>
                    )}
                    {retiroResult === 'ci_error' && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 animate-fade-in">
                        <AlertTriangle className="shrink-0" />
                        <div>
                          <p className="font-bold">CI Incorrecto</p>
                          <p className="text-sm mt-0.5">El carnet ingresado no coincide con el destinatario registrado. Verifique el documento físico.</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleConfirmRetiro}
                      disabled={!retiroCI.trim() || confirmando || retiroResult === 'success'}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {confirmando ? <Loader2 className="animate-spin" /> : <UserCheck size={18} />}
                      {confirmando ? 'Verificando...' : 'Confirmar Retiro'}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: COLA ══════════════════════════ */}
      {activeTab === 'cola' && (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Package className="text-slate-400" size={18} />
              Historial General de Encomiendas
            </h3>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
                <tr>
                  <th className="py-3 px-5">Código</th>
                  <th className="py-3 px-5">Ruta</th>
                  <th className="py-3 px-5">Estado</th>
                  <th className="py-3 px-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {todas.slice(0, 50).map(enc => (
                  <tr key={enc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-5 font-medium text-slate-200">{enc.trackingNumber}</td>
                    <td className="py-3 px-5">{enc.routeCode}</td>
                    <td className="py-3 px-5">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-slate-900 border-slate-700 text-slate-300">
                        {enc.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => navigate(`/encomiendas/${enc.id}`)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
