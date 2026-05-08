import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Rol } from '../../types';
import {
  LayoutDashboard,
  Package,
  ScanBarcode,
  ClipboardList,
  DollarSign,
  PackageCheck,
  Truck,
  Radio,
  MapPin,
  Users,
  BarChart3,
  AlertTriangle,
  Building2,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface NavSection {
  label: string;
  items: NavEntry[];
}

interface NavEntry {
  label: string;
  path: string;
  icon: ReactNode;
}

// Navigation structure per role (matching mockups)
const NAV_BY_ROLE: Record<Rol, NavSection[]> = {
  [Rol.ADMINISTRADOR]: [
    {
      label: 'Gestión',
      items: [
        { label: 'Tablero general', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Encomiendas', path: '/encomiendas', icon: <Package size={18} /> },
        { label: 'Buses & rutas', path: '/buses', icon: <Truck size={18} /> },
        { label: 'Sucursales', path: '/sucursales', icon: <Building2 size={18} /> },
        { label: 'Usuarios & roles', path: '/usuarios', icon: <Users size={18} /> },
      ],
    },
    {
      label: 'Análisis',
      items: [
        { label: 'Reportes', path: '/reportes', icon: <BarChart3 size={18} /> },
        { label: 'Incidencias', path: '/incidencias', icon: <AlertTriangle size={18} /> },
      ],
    },
  ],
  [Rol.TAQUILLA]: [
    {
      label: 'Taquilla',
      items: [
        { label: 'Recepción / escaneo', path: '/taquilla', icon: <ScanBarcode size={18} /> },
        { label: 'Encomiendas del turno', path: '/encomiendas', icon: <ClipboardList size={18} /> },
        { label: 'Cobros del día', path: '/cobros', icon: <DollarSign size={18} /> },
        { label: 'Entrega al cliente', path: '/entrega', icon: <PackageCheck size={18} /> },
      ],
    },
    {
      label: 'Soporte',
      items: [
        { label: 'Ayuda', path: '/ayuda', icon: <HelpCircle size={18} /> },
      ],
    },
  ],
  [Rol.BODEGA]: [
    {
      label: 'Bodega',
      items: [
        { label: 'Encomiendas pendientes', path: '/bodega', icon: <Package size={18} /> },
        { label: 'Manifiestos & carga', path: '/manifiestos', icon: <ClipboardList size={18} /> },
        { label: 'Buses & flota', path: '/buses', icon: <Truck size={18} /> },
        { label: 'Dispositivos IoT', path: '/iot', icon: <Radio size={18} /> },
      ],
    },
    {
      label: 'Operación',
      items: [
        { label: 'Tránsito en vivo', path: '/seguimiento', icon: <MapPin size={18} /> },
      ],
    },
  ],
  [Rol.USUARIO]: [
    {
      label: 'Mis envíos',
      items: [
        { label: 'Mis encomiendas', path: '/mis-envios', icon: <Package size={18} /> },
        { label: 'Nuevo envío', path: '/crear-envio', icon: <Plus size={18} /> },
        { label: 'Rastrear envío', path: '/rastreo', icon: <Search size={18} /> },
      ],
    },
    {
      label: 'Soporte',
      items: [
        { label: 'Ayuda', path: '/ayuda', icon: <HelpCircle size={18} /> },
      ],
    },
  ],
};

const rolLabels: Record<Rol, string> = {
  [Rol.ADMINISTRADOR]: 'Administrador',
  [Rol.TAQUILLA]: 'Taquilla',
  [Rol.BODEGA]: 'Bodega',
  [Rol.USUARIO]: 'Usuario',
};

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [collapsed, setCollapsed] = useState(false);

  const sections = user ? NAV_BY_ROLE[user.rol] || [] : [];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Package size={20} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">Travell</span>
            <span className="sidebar__brand-sub">Encomiendas</span>
          </div>
        )}
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="sidebar__section-label">{section.label}</div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                {!collapsed && (
                  <span className="sidebar__link-label">{item.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="sidebar__footer">
        {user && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user.nombre}</span>
                <span className="sidebar__user-role">{rolLabels[user.rol]}</span>
              </div>
            )}
          </div>
        )}
        <button className="sidebar__logout" onClick={logout} title="Cerrar sesión">
          <LogOut size={18} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
