import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Rol } from '../../types';
import {
  LayoutDashboard,
  Package,
  Ticket,
  Warehouse,
  MapPin,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface NavEntry {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Rol[];
}

const NAV_ITEMS: NavEntry[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: [Rol.ADMINISTRADOR],
  },
  {
    label: 'Encomiendas',
    path: '/encomiendas',
    icon: <Package size={20} />,
    roles: [Rol.ADMINISTRADOR, Rol.TAQUILLA],
  },
  {
    label: 'Taquilla',
    path: '/taquilla',
    icon: <Ticket size={20} />,
    roles: [Rol.TAQUILLA],
  },
  {
    label: 'Bodega',
    path: '/bodega',
    icon: <Warehouse size={20} />,
    roles: [Rol.BODEGA],
  },
  {
    label: 'Seguimiento',
    path: '/seguimiento',
    icon: <MapPin size={20} />,
    roles: [Rol.ADMINISTRADOR, Rol.TAQUILLA, Rol.BODEGA],
  },
  {
    label: 'Usuarios',
    path: '/usuarios',
    icon: <Users size={20} />,
    roles: [Rol.ADMINISTRADOR],
  },
  {
    label: 'Reportes',
    path: '/reportes',
    icon: <BarChart3 size={20} />,
    roles: [Rol.ADMINISTRADOR],
  },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.rol)
  );

  const rolLabels: Record<Rol, string> = {
    [Rol.ADMINISTRADOR]: 'Administrador',
    [Rol.TAQUILLA]: 'Taquilla',
    [Rol.BODEGA]: 'Bodega',
    [Rol.REMITENTE]: 'Remitente',
    [Rol.DESTINATARIO]: 'Destinatario',
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Package size={28} strokeWidth={2.5} />
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
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {filteredNav.map((item) => (
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
      </nav>

      {/* User info + Logout */}
      <div className="sidebar__footer">
        {user && !collapsed && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.nombre}</span>
              <span className="sidebar__user-role">
                {rolLabels[user.rol]}
              </span>
            </div>
          </div>
        )}
        {user && collapsed && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <button
          className="sidebar__logout"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
}
