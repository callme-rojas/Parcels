import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Truck, MapPin, Plus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { GET_BUSES } from '../graphql/queries';
import { CREATE_BUS_MUTATION } from '../graphql/mutations';
import { BusEstado, RUTAS_DISPONIBLES } from '../types';
import type { Bus, CrearBusInput } from '../types';
import { useAuthStore } from '../stores/authStore';

const ESTADO_BUS_BADGE: Record<BusEstado, string> = {
  [BusEstado.CARGANDO]: 'badge badge--amber',
  [BusEstado.LISTO]: 'badge badge--emerald',
  [BusEstado.EN_RUTA]: 'badge badge--blue',
  [BusEstado.EN_MANTENIMIENTO]: 'badge badge--red',
};

const ESTADO_BUS_LABEL: Record<BusEstado, string> = {
  [BusEstado.CARGANDO]: 'Cargando',
  [BusEstado.LISTO]: 'Listo',
  [BusEstado.EN_RUTA]: 'En Ruta',
  [BusEstado.EN_MANTENIMIENTO]: 'Mantenimiento',
};

export default function BusesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
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
      setFormData({ placa: '', flota: '', routeCode: RUTAS_DISPONIBLES[0].value, capacidad: 40, salidaProgramada: '' });
      refetch();
    },
    onError: (err) => setFormError(err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await crearBus({ variables: { input: formData } });
    } catch {
      // error handled by onError
    }
  };

  const buses = data?.buses || [];
  const enRuta = buses.filter(b => b.estado === BusEstado.EN_RUTA).length;
  const cargando = buses.filter(b => b.estado === BusEstado.CARGANDO).length;

  return (
    <div className="panel-page">
      {/* ─── Header ──────────────────────────── */}
      <div className="enc-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={22} /> Flota y Rutas
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Gestiona los buses activos y su disponibilidad por ruta.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn--primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Registrar Bus
          </button>
        )}
      </div>

      {/* ─── KPIs ────────────────────────────── */}
      <section className="dashboard__kpis">
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header"><span className="kpi-card__icon"><Truck size={22} /></span></div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : buses.length}</div>
          <div className="kpi-card__label">Total en flota</div>
        </div>
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header"><span className="kpi-card__icon"><AlertCircle size={22} /></span></div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : cargando}</div>
          <div className="kpi-card__label">Cargando</div>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header"><span className="kpi-card__icon"><CheckCircle2 size={22} /></span></div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : enRuta}</div>
          <div className="kpi-card__label">En ruta activa</div>
        </div>
      </section>

      {/* ─── Error ───────────────────────────── */}
      {error && (
        <div className="taq-scan-result taq-scan-result--error" style={{ marginBottom: 12 }}>
          <AlertCircle size={18} />
          <div>
            <strong>Error al cargar buses</strong>
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* ─── Tabla de buses ──────────────────── */}
      <div className="dashboard-panel">
        <div className="dashboard-panel__header">
          <span className="dashboard-panel__title">
            <Truck size={16} /> Buses registrados en el sistema
          </span>
        </div>
        <div className="dashboard-panel__body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Flota / Empresa</th>
                <th>Ruta asignada</th>
                <th>Carga</th>
                <th>Estado</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  <Loader2 className="spin" size={18} style={{ display: 'inline-block' }} /> Cargando flota...
                </td></tr>
              )}
              {!loading && buses.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No hay buses registrados. {isAdmin && 'Usa el botón "Registrar Bus" para agregar uno.'}
                </td></tr>
              )}
              {buses.map(bus => (
                <tr key={bus.id}>
                  <td>
                    <span className="data-table__code">{bus.placa}</span>
                  </td>
                  <td>{bus.flota || '—'}</td>
                  <td>
                    <span className="data-table__route">
                      <MapPin size={12} />
                      {RUTAS_DISPONIBLES.find(r => r.value === bus.routeCode)?.label || bus.routeCode}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{bus.cargados}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> / {bus.capacidad}</span>
                    <div style={{ marginTop: 4, height: 4, background: 'var(--border)', borderRadius: 2, width: 80 }}>
                      <div style={{
                        height: '100%',
                        background: 'var(--navy)',
                        borderRadius: 2,
                        width: `${Math.min(100, Math.round((bus.cargados / bus.capacidad) * 100))}%`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </td>
                  <td>
                    <span className={ESTADO_BUS_BADGE[bus.estado] || 'badge'}>
                      <span className="badge__dot" />
                      {ESTADO_BUS_LABEL[bus.estado] || bus.estado}
                    </span>
                  </td>
                  <td>
                    {bus.activo
                      ? <span className="badge badge--green"><span className="badge__dot" /> Sí</span>
                      : <span className="badge badge--red"><span className="badge__dot" /> No</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Crear Bus ──────────────────── */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Nuevo Bus</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="taq-scan-result taq-scan-result--error" style={{ marginBottom: 14 }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Placa <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: 2845-KCN"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Flota / Empresa</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Flota 18"
                    value={formData.flota}
                    onChange={(e) => setFormData({ ...formData, flota: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ruta asignada <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="form-input"
                    value={formData.routeCode}
                    onChange={(e) => setFormData({ ...formData, routeCode: e.target.value })}
                  >
                    {RUTAS_DISPONIBLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Capacidad (enc.) <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="form-input"
                      value={formData.capacidad}
                      onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Salida programada</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.salidaProgramada}
                      onChange={(e) => setFormData({ ...formData, salidaProgramada: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn--primary" disabled={creating}>
                    {creating ? <><Loader2 size={14} className="spin" /> Guardando...</> : 'Guardar Bus'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
