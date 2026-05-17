import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Truck, MapPin, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { GET_BUSES } from '../graphql/queries';
import { CREATE_BUS_MUTATION } from '../graphql/mutations';
import { BusEstado, RUTAS_DISPONIBLES } from '../types';
import type { Bus, CrearBusInput } from '../types';
import { useAuthStore } from '../stores/authStore';

const ESTADO_BUS_COLORS: Record<BusEstado, string> = {
  [BusEstado.CARGANDO]: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  [BusEstado.LISTO]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  [BusEstado.EN_RUTA]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  [BusEstado.EN_MANTENIMIENTO]: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function BusesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CrearBusInput>({
    placa: '',
    flota: '',
    routeCode: RUTAS_DISPONIBLES[0].value,
    capacidad: 40,
    salidaProgramada: '',
  });

  const { data, loading, error, refetch } = useQuery<{ buses: Bus[] }>(GET_BUSES, {
    fetchPolicy: 'cache-and-network',
  });

  const [crearBus, { loading: creating }] = useMutation(CREATE_BUS_MUTATION, {
    onCompleted: () => {
      setShowModal(false);
      refetch();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearBus({ variables: { input: formData } });
    } catch (err) {
      console.error('Error al crear bus', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl flex items-center gap-3">
        <AlertCircle />
        <p>Error al cargar buses: {error.message}</p>
      </div>
    );
  }

  const buses = data?.buses || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Flota y Rutas
          </h1>
          <p className="text-slate-400 mt-1">
            Gestiona los buses activos y asigna su disponibilidad
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Registrar Bus
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {buses.map((bus) => (
          <div
            key={bus.id}
            className="group relative overflow-hidden bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 transition-all duration-300 hover:bg-slate-800/60 hover:border-slate-600/50 hover:shadow-xl hover:shadow-black/20"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{bus.placa}</h3>
                  <p className="text-sm text-slate-400">{bus.flota}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${ESTADO_BUS_COLORS[bus.estado] || 'bg-slate-500/10 text-slate-400'}`}
              >
                {bus.estado.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <MapPin size={18} className="text-cyan-400" />
                <span className="text-sm font-medium">
                  {RUTAS_DISPONIBLES.find((r) => r.value === bus.routeCode)?.label ||
                    bus.routeCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Carga Actual</p>
                  <p className="text-lg font-semibold text-slate-200">
                    {bus.cargados} <span className="text-sm text-slate-500">/ {bus.capacidad}</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Estado en Flota</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${bus.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <p className="text-sm font-medium text-slate-200">
                      {bus.activo ? 'Operativo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {buses.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
            <Truck className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No hay buses registrados</h3>
            <p className="text-slate-500 mt-1">Comienza agregando un bus a la flota.</p>
          </div>
        )}
      </div>

      {/* Modal Crear Bus */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-slate-100">Registrar Nuevo Bus</h2>
              <p className="text-sm text-slate-400 mt-1">Ingresa los datos de la unidad</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Placa</label>
                <input
                  type="text"
                  required
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  placeholder="Ej: 2845-KCN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Flota / Empresa</label>
                <input
                  type="text"
                  value={formData.flota}
                  onChange={(e) => setFormData({ ...formData, flota: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  placeholder="Ej: Flota 18"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Ruta Asignada</label>
                <select
                  value={formData.routeCode}
                  onChange={(e) => setFormData({ ...formData, routeCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                >
                  {RUTAS_DISPONIBLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Capacidad Encomiendas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Salida Prog.</label>
                  <input
                    type="time"
                    value={formData.salidaProgramada}
                    onChange={(e) => setFormData({ ...formData, salidaProgramada: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Guardando...' : 'Guardar Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
