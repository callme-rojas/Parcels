import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Edit2,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  Shield,
  Filter
} from 'lucide-react';
import { GET_USERS } from '../graphql/queries';
import {
  CREAR_USUARIO_MUTATION,
  ACTUALIZAR_USUARIO_MUTATION,
  TOGGLE_USUARIO_ACTIVO_MUTATION
} from '../graphql/mutations';
import { Rol } from '../types';
import type { Usuario } from '../types';

const ROL_BADGES: Record<Rol, string> = {
  [Rol.ADMINISTRADOR]: 'badge badge--red',
  [Rol.TAQUILLA]: 'badge badge--blue',
  [Rol.BODEGA]: 'badge badge--amber',
  [Rol.CLIENTE]: 'badge badge--gray',
};

const ROL_LABELS: Record<Rol, string> = {
  [Rol.ADMINISTRADOR]: 'Administrador',
  [Rol.TAQUILLA]: 'Taquilla / Boletería',
  [Rol.BODEGA]: 'Bodega / Operador',
  [Rol.CLIENTE]: 'Cliente',
};

export default function UsuariosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [rolFilter, setRolFilter] = useState<string>('TODOS');
  const [activoFilter, setActivoFilter] = useState<string>('TODOS');
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  // Form states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [createFormData, setCreateFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    rol: Rol.TAQUILLA as Rol,
  });

  const [editFormData, setEditFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    rol: Rol.TAQUILLA as Rol,
  });

  // Query users
  const { data, loading, error, refetch } = useQuery<{ users: Usuario[] }>(GET_USERS, {
    fetchPolicy: 'cache-and-network',
  });

  // Mutation: Create
  const [crearUsuario, { loading: creating }] = useMutation(CREAR_USUARIO_MUTATION, {
    onCompleted: () => {
      showNotification('Usuario creado con éxito');
      setShowCreateModal(false);
      resetCreateForm();
      refetch();
    },
    onError: (err) => setFormError(err.message),
  });

  // Mutation: Update
  const [actualizarUsuario, { loading: updating }] = useMutation(ACTUALIZAR_USUARIO_MUTATION, {
    onCompleted: () => {
      showNotification('Usuario actualizado con éxito');
      setShowEditModal(false);
      setSelectedUser(null);
      refetch();
    },
    onError: (err) => setFormError(err.message),
  });

  // Mutation: Toggle Active Status
  const [toggleUsuarioActivo] = useMutation<any, any>(TOGGLE_USUARIO_ACTIVO_MUTATION, {
    onCompleted: (data) => {
      setTogglingUserId(null);
      if (data && data.toggleUsuarioActivo) {
        const u = data.toggleUsuarioActivo;
        showNotification(`Usuario ${u.nombre} ha sido ${u.activo ? 'activado' : 'suspendido'}`);
      }
      refetch();
    },
    onError: (err) => {
      setTogglingUserId(null);
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
      email: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      rol: Rol.TAQUILLA,
    });
    setFormError('');
  };

  const handleOpenEdit = (user: Usuario) => {
    setSelectedUser(user);
    setEditFormData({
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono || '',
      password: '',
      confirmPassword: '',
      rol: user.rol,
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (createFormData.password !== createFormData.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const input = {
        nombre: createFormData.nombre,
        email: createFormData.email,
        telefono: createFormData.telefono || undefined,
        password: createFormData.password,
        rol: createFormData.rol,
      };
      await crearUsuario({ variables: { input } });
    } catch {
      // Handled by onError
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedUser) return;

    if (editFormData.password || editFormData.confirmPassword) {
      if (editFormData.password !== editFormData.confirmPassword) {
        setFormError('Las contraseñas no coinciden.');
        return;
      }
    }

    try {
      const input: any = {
        id: selectedUser.id,
        nombre: editFormData.nombre,
        email: editFormData.email,
        telefono: editFormData.telefono || null,
        rol: editFormData.rol,
      };

      if (editFormData.password) {
        input.password = editFormData.password;
      }

      await actualizarUsuario({ variables: { input } });
    } catch {
      // Handled by onError
    }
  };

  const handleToggleActive = async (user: Usuario) => {
    setTogglingUserId(user.id);
    try {
      await toggleUsuarioActivo({
        variables: {
          id: user.id,
          activo: !user.activo,
        },
      });
    } catch {
      setTogglingUserId(null);
    }
  };

  // Data processing
  const users = data?.users || [];

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.telefono && u.telefono.includes(searchQuery));

      const matchesRol = rolFilter === 'TODOS' || u.rol === rolFilter;

      const matchesActivo =
        activoFilter === 'TODOS' ||
        (activoFilter === 'ACTIVOS' && u.activo) ||
        (activoFilter === 'SUSPENDIDOS' && !u.activo);

      return matchesSearch && matchesRol && matchesActivo;
    });
  }, [users, searchQuery, rolFilter, activoFilter]);

  // Metrics calculations
  const metrics = useMemo(() => {
    return {
      total: users.length,
      staff: users.filter((u) => u.rol === Rol.TAQUILLA || u.rol === Rol.BODEGA).length,
      clients: users.filter((u) => u.rol === Rol.CLIENTE).length,
      inactive: users.filter((u) => !u.activo).length,
    };
  }, [users]);

  return (
    <div className="panel-page">
      <style>{`
        /* Premium Custom CSS for Switch in UsuariosPage */
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
        
        .user-meta-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .user-meta-info__name {
          font-weight: 600;
          color: var(--navy);
          font-size: 14px;
        }
        .user-meta-info__email {
          color: var(--text-muted);
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .user-phone-cell {
          font-size: 13px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      {/* ─── Header Bar ──────────────────────── */}
      <div className="enc-header" style={{ marginBottom: 20 }}>
        <div className="enc-header__left">
          <h2 className="enc-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} style={{ color: 'var(--navy)' }} /> Gestión de Usuarios
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Administra credenciales, roles y accesos del personal administrativo, operativo y clientes.
          </p>
        </div>
        <div className="enc-header__actions">
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Crear Usuario
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
            <strong>Error al obtener usuarios</strong>
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* ─── KPI Metrics Dashboard ───────────── */}
      <section className="dashboard__kpis" style={{ marginBottom: 24 }}>
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Users size={22} /></span>
          </div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : metrics.total}</div>
          <div className="kpi-card__label">Usuarios Registrados</div>
        </div>
        
        <div className="kpi-card kpi-card--purple">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Shield size={22} /></span>
          </div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : metrics.staff}</div>
          <div className="kpi-card__label">Personal de Operaciones</div>
        </div>

        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><UserCheck size={22} /></span>
          </div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : metrics.clients}</div>
          <div className="kpi-card__label">Clientes con Cuenta</div>
        </div>

        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><UserX size={22} /></span>
          </div>
          <div className="kpi-card__value">{loading ? <Loader2 size={18} className="spin" /> : metrics.inactive}</div>
          <div className="kpi-card__label">Cuentas Suspendidas</div>
        </div>
      </section>

      {/* ─── Search & Filters Bar ────────────── */}
      <div className="enc-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="enc-search" style={{ flex: '1 1 300px' }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo electrónico o teléfono..."
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
              value={rolFilter}
              onChange={(e) => setRolFilter(e.target.value)}
            >
              <option value="TODOS">Todos los roles</option>
              <option value={Rol.ADMINISTRADOR}>Administradores</option>
              <option value={Rol.TAQUILLA}>Taquilla / Ventas</option>
              <option value={Rol.BODEGA}>Bodega / Depósito</option>
              <option value={Rol.CLIENTE}>Clientes</option>
            </select>
          </div>

          <select
            className="form-input"
            style={{ width: 150, padding: '6px 12px', fontSize: 13 }}
            value={activoFilter}
            onChange={(e) => setActivoFilter(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVOS">Solo Activos</option>
            <option value="SUSPENDIDOS">Solo Suspendidos</option>
          </select>
        </div>
      </div>

      {/* ─── Data Table ──────────────────────── */}
      <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
        <div className="dashboard-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="dashboard-panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={16} /> Usuarios registrados en la plataforma
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </span>
        </div>
        <div className="dashboard-panel__body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Teléfono</th>
                <th>Rol asignado</th>
                <th style={{ width: 120, textAlign: 'center' }}>¿Activo?</th>
                <th style={{ width: 100, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <Loader2 className="spin" size={20} style={{ display: 'inline-block', marginRight: 8 }} />
                    Cargando usuarios...
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <AlertCircle size={24} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--text-muted)' }} />
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-meta-info">
                      <span className="user-meta-info__name">{u.nombre}</span>
                      <span className="user-meta-info__email">
                        <Mail size={12} /> {u.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    {u.telefono ? (
                      <span className="user-phone-cell">
                        <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                        {u.telefono}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={ROL_BADGES[u.rol] || 'badge'}>
                      <span className="badge__dot" />
                      {ROL_LABELS[u.rol] || u.rol}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="status-switch">
                      <input
                        type="checkbox"
                        checked={u.activo}
                        onChange={() => handleToggleActive(u)}
                        disabled={togglingUserId === u.id}
                      />
                      <span className="status-slider" />
                    </label>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn--secondary btn--sm"
                      style={{ padding: '4px 8px', minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => handleOpenEdit(u)}
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

      {/* ─── Modal: Crear Usuario ────────────── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Nuevo Usuario</h3>
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
                  <label className="form-label">Nombre Completo <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Juan Pérez"
                    value={createFormData.nombre}
                    onChange={(e) => setCreateFormData({ ...createFormData, nombre: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="ejemplo@encomiendas.com"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono de Contacto</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ej: +591 76543210"
                      value={createFormData.telefono}
                      onChange={(e) => setCreateFormData({ ...createFormData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Rol del Sistema <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="form-input"
                    value={createFormData.rol}
                    onChange={(e) => setCreateFormData({ ...createFormData, rol: e.target.value as Rol })}
                  >
                    <option value={Rol.TAQUILLA}>{ROL_LABELS[Rol.TAQUILLA]}</option>
                    <option value={Rol.BODEGA}>{ROL_LABELS[Rol.BODEGA]}</option>
                    <option value={Rol.ADMINISTRADOR}>{ROL_LABELS[Rol.ADMINISTRADOR]}</option>
                    <option value={Rol.CLIENTE}>{ROL_LABELS[Rol.CLIENTE]}</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Contraseña <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirmar Contraseña <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Repetir contraseña"
                      value={createFormData.confirmPassword}
                      onChange={(e) => setCreateFormData({ ...createFormData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn--primary" disabled={creating}>
                    {creating ? <><Loader2 size={14} className="spin" /> Guardando...</> : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Editar Usuario ────────────── */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Perfil de Usuario</h3>
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
                  <label className="form-label">Nombre Completo <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Juan Pérez"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="ejemplo@encomiendas.com"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono de Contacto</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ej: +591 76543210"
                      value={editFormData.telefono}
                      onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Rol del Sistema <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="form-input"
                    value={editFormData.rol}
                    onChange={(e) => setEditFormData({ ...editFormData, rol: e.target.value as Rol })}
                  >
                    <option value={Rol.TAQUILLA}>{ROL_LABELS[Rol.TAQUILLA]}</option>
                    <option value={Rol.BODEGA}>{ROL_LABELS[Rol.BODEGA]}</option>
                    <option value={Rol.ADMINISTRADOR}>{ROL_LABELS[Rol.ADMINISTRADOR]}</option>
                    <option value={Rol.CLIENTE}>{ROL_LABELS[Rol.CLIENTE]}</option>
                  </select>
                </div>

                {/* Password reset section */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Lock size={14} /> Cambiar Contraseña (Dejar vacío para no modificar)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Nueva Contraseña</label>
                      <input
                        type="password"
                        minLength={6}
                        className="form-input"
                        placeholder="Nueva contraseña"
                        value={editFormData.password}
                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirmar Contraseña</label>
                      <input
                        type="password"
                        minLength={6}
                        className="form-input"
                        placeholder="Repetir contraseña"
                        value={editFormData.confirmPassword}
                        onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
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
