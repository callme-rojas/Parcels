import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  Search,
  Edit2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Filter,
  CheckSquare,
  XSquare
} from 'lucide-react';
import { GET_SUCURSALES } from '../graphql/queries';
import {
  CREAR_SUCURSAL_MUTATION,
  ACTUALIZAR_SUCURSAL_MUTATION,
  TOGGLE_SUCURSAL_ACTIVA_MUTATION
} from '../graphql/mutations';
import type { Sucursal } from '../types';

export default function SucursalesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [ciudadFilter, setCiudadFilter] = useState<string>('TODOS');
  const [activaFilter, setActivaFilter] = useState<string>('TODOS');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);

  // Form feedback states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [togglingSucursalId, setTogglingSucursalId] = useState<string | null>(null);

  // Form data
  const [createFormData, setCreateFormData] = useState({
    nombre: '',
    ciudad: '',
    direccion: '',
    telefono: '',
  });

  const [editFormData, setEditFormData] = useState({
    nombre: '',
    ciudad: '',
    direccion: '',
    telefono: '',
  });

  // Query sucursales
  const { data, loading, error, refetch } = useQuery<{ sucursales: Sucursal[] }>(GET_SUCURSALES, {
    fetchPolicy: 'cache-and-network',
  });

  // Mutation: Create
  const [crearSucursal, { loading: creating }] = useMutation(CREAR_SUCURSAL_MUTATION, {
    onCompleted: () => {
      showNotification('Sucursal creada con éxito');
      setShowCreateModal(false);
      resetCreateForm();
      refetch();
    },
    onError: (err) => setFormError(err.message),
  });

  // Mutation: Update
  const [actualizarSucursal, { loading: updating }] = useMutation(ACTUALIZAR_SUCURSAL_MUTATION, {
    onCompleted: () => {
      showNotification('Sucursal actualizada con éxito');
      setShowEditModal(false);
      setSelectedSucursal(null);
      refetch();
    },
    onError: (err) => setFormError(err.message),
  });

  // Mutation: Toggle Active
  const [toggleSucursalActiva] = useMutation<any, any>(TOGGLE_SUCURSAL_ACTIVA_MUTATION, {
    onCompleted: (data) => {
      setTogglingSucursalId(null);
      if (data && data.toggleSucursalActiva) {
        const s = data.toggleSucursalActiva;
        showNotification(`Sucursal ${s.nombre} ha sido ${s.activa ? 'activada' : 'desactivada'}`);
      }
      refetch();
    },
    onError: (err) => {
      setTogglingSucursalId(null);
      showNotification(`Error: ${err.message}`, true);
    },
  });

  // Notification helper
  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setFormError(msg);
      setTimeout(() => setFormError(''), 5000);
    } else {
      setFormSuccess(msg);
      setTimeout(() => setFormSuccess(''), 4000);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      nombre: '',
      ciudad: '',
      direccion: '',
      telefono: '',
    });
    setFormError('');
  };

  const handleOpenEdit = (sucursal: Sucursal) => {
    setSelectedSucursal(sucursal);
    setEditFormData({
      nombre: sucursal.nombre,
      ciudad: sucursal.ciudad,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono || '',
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      await crearSucursal({
        variables: {
          input: {
            nombre: createFormData.nombre,
            ciudad: createFormData.ciudad,
            direccion: createFormData.direccion,
            telefono: createFormData.telefono || undefined,
          },
        },
      });
    } catch {
      // Handled by onError
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedSucursal) return;

    try {
      await actualizarSucursal({
        variables: {
          input: {
            id: selectedSucursal.id,
            nombre: editFormData.nombre,
            ciudad: editFormData.ciudad,
            direccion: editFormData.direccion,
            telefono: editFormData.telefono || null,
          },
        },
      });
    } catch {
      // Handled by onError
    }
  };

  const handleToggleActive = async (sucursal: Sucursal) => {
    setTogglingSucursalId(sucursal.id);
    try {
      await toggleSucursalActiva({
        variables: {
          id: sucursal.id,
          activa: !sucursal.activa,
        },
      });
    } catch {
      setTogglingSucursalId(null);
    }
  };

  // Data processing
  const sucursales = data?.sucursales || [];

  const filteredSucursales = useMemo(() => {
    return sucursales.filter((s) => {
      const matchesSearch =
        s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ciudad.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.direccion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.telefono && s.telefono.includes(searchQuery));

      const matchesCiudad = ciudadFilter === 'TODOS' || s.ciudad === ciudadFilter;

      const matchesActiva =
        activaFilter === 'TODOS' ||
        (activaFilter === 'ACTIVAS' && s.activa) ||
        (activaFilter === 'INACTIVAS' && !s.activa);

      return matchesSearch && matchesCiudad && matchesActiva;
    });
  }, [sucursales, searchQuery, ciudadFilter, activaFilter]);

  // Extract cities for filters
  const cities = useMemo(() => {
    const list = sucursales.map((s) => s.ciudad);
    return Array.from(new Set(list));
  }, [sucursales]);

  // Metrics calculations
  const metrics = useMemo(() => {
    return {
      total: sucursales.length,
      active: sucursales.filter((s) => s.activa).length,
      inactive: sucursales.filter((s) => !s.activa).length,
    };
  }, [sucursales]);

  return (
    <div className="panel-page">
      <style>{`
        /* Premium Custom CSS for Switch in SucursalesPage */
        .status-switch {
          position: relative;
          display: inline-block;
          width: 42px;
          height: 22px;
          vertical-align: middle;
        }
        .status-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .status-slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #e4e4e7;
          transition: .3s;
          border-radius: 22px;
          border: 1px solid #d4d4d8;
        }
        .status-slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        input:checked + .status-slider {
          background-color: #10B981;
          border-color: #059669;
        }
        input:checked + .status-slider:before {
          transform: translateX(20px);
        }
        input:disabled + .status-slider {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .branch-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .branch-info__name {
          font-weight: 600;
          color: var(--navy);
          font-size: 14px;
        }
        .branch-info__phone {
          color: var(--text-muted);
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>

      {/* ─── Header Bar ──────────────────────── */}
      <div className="enc-header" style={{ marginBottom: 20 }}>
        <div className="enc-header__left">
          <h2 className="enc-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} style={{ color: 'var(--navy)' }} /> Gestión de Sucursales
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Administra las sucursales, oficinas de despacho, ubicaciones y datos de contacto del sistema.
          </p>
        </div>
        <div className="enc-header__actions">
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Crear Sucursal
          </button>
        </div>
      </div>

      {/* ─── Notifications ───────────────────── */}
      {formSuccess && (
        <div className="taq-scan-result taq-scan-result--success animate-fade-in" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          <div>
            <strong>Operación exitosa</strong>
            <span>{formSuccess}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="taq-scan-result taq-scan-result--error animate-fade-in" style={{ marginBottom: 16 }}>
          <AlertCircle size={18} />
          <div>
            <strong>Error al obtener sucursales</strong>
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* ─── KPI Metrics Dashboard ───────────── */}
      <section className="dashboard__kpis" style={{ marginBottom: 24 }}>
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Building2 size={22} /></span>
          </div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : metrics.total}</div>
          <div className="kpi-card__label">Total Sucursales</div>
        </div>
        
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><CheckCircle2 size={22} /></span>
          </div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : metrics.active}</div>
          <div className="kpi-card__label">Sucursales Activas</div>
        </div>

        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><AlertCircle size={22} /></span>
          </div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : metrics.inactive}</div>
          <div className="kpi-card__label">Sucursales Inactivas</div>
        </div>
      </section>

      {/* ─── Search & Filters Bar ────────────── */}
      <div className="enc-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="enc-search" style={{ flex: '1 1 300px' }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre de sucursal, ciudad o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: '0 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-input"
              style={{ width: 160, padding: '6px 12px', fontSize: 13 }}
              value={ciudadFilter}
              onChange={(e) => setCiudadFilter(e.target.value)}
            >
              <option value="TODOS">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <select
            className="form-input"
            style={{ width: 150, padding: '6px 12px', fontSize: 13 }}
            value={activaFilter}
            onChange={(e) => setActivaFilter(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVAS">Solo Activas</option>
            <option value="INACTIVAS">Solo Inactivas</option>
          </select>
        </div>
      </div>

      {/* ─── Data Table ──────────────────────── */}
      <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
        <div className="dashboard-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="dashboard-panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={16} /> Oficinas registradas en el sistema
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Mostrando {filteredSucursales.length} de {sucursales.length} oficinas
          </span>
        </div>
        <div className="dashboard-panel__body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Ciudad</th>
                <th>Dirección</th>
                <th style={{ width: 120, textAlign: 'center' }}>¿Activa?</th>
                <th style={{ width: 100, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <Loader2 className="spin" size={20} style={{ display: 'inline-block', marginRight: 8 }} />
                    Cargando sucursales...
                  </td>
                </tr>
              )}

              {!loading && filteredSucursales.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <AlertCircle size={24} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--text-muted)' }} />
                    No se encontraron sucursales registradas.
                  </td>
                </tr>
              )}

              {!loading && filteredSucursales.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="branch-info">
                      <span className="branch-info__name">{s.nombre}</span>
                      <span className="branch-info__phone">
                        <Phone size={12} /> {s.telefono || 'Sin teléfono'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="data-table__route" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {s.ciudad}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text)' }}>
                    {s.direccion}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="status-switch">
                      <input
                        type="checkbox"
                        checked={s.activa}
                        onChange={() => handleToggleActive(s)}
                        disabled={togglingSucursalId === s.id}
                      />
                      <span className="status-slider" />
                    </label>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn--secondary btn--sm"
                      style={{ padding: '4px 8px', minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => handleOpenEdit(s)}
                    >
                      <Edit2 size={13} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Crear Sucursal ────────────── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Nueva Sucursal</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="taq-scan-result taq-scan-result--error animate-fade-in" style={{ marginBottom: 14 }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Nombre de Sucursal <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Terminal Bimodal Santa Cruz"
                    value={createFormData.nombre}
                    onChange={(e) => setCreateFormData({ ...createFormData, nombre: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Ciudad <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej: Santa Cruz"
                      value={createFormData.ciudad}
                      onChange={(e) => setCreateFormData({ ...createFormData, ciudad: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono de Oficina</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ej: +591 3 3345678"
                      value={createFormData.telefono}
                      onChange={(e) => setCreateFormData({ ...createFormData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Av. Interbimodal, Sector Encomiendas"
                    value={createFormData.direccion}
                    onChange={(e) => setCreateFormData({ ...createFormData, direccion: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn--primary" disabled={creating}>
                    {creating ? <><Loader2 size={14} className="spin" /> Guardando...</> : 'Crear Sucursal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Editar Sucursal ────────────── */}
      {showEditModal && selectedSucursal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Sucursal</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="taq-scan-result taq-scan-result--error animate-fade-in" style={{ marginBottom: 14 }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Nombre de Sucursal <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Terminal Bimodal Santa Cruz"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Ciudad <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej: Santa Cruz"
                      value={editFormData.ciudad}
                      onChange={(e) => setEditFormData({ ...editFormData, ciudad: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono de Oficina</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ej: +591 3 3345678"
                      value={editFormData.telefono}
                      onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Av. Interbimodal, Sector Encomiendas"
                    value={editFormData.direccion}
                    onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn--primary" disabled={updating}>
                    {updating ? <><Loader2 size={14} className="spin" /> Guardando...</> : 'Guardar Cambios'}
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
