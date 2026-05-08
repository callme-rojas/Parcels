import { useAuthStore } from '../../stores/authStore';
import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/encomiendas': 'Encomiendas',
  '/taquilla': 'Taquilla',
  '/bodega': 'Bodega',
  '/seguimiento': 'Seguimiento',
  '/usuarios': 'Usuarios',
  '/reportes': 'Reportes',
};

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] || 'Travell Encomiendas';

  return (
    <header className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__title">{pageTitle}</h1>
      </div>
      <div className="topbar__right">
        <div className="topbar__search">
          <Search size={16} className="topbar__search-icon" />
          <input
            type="text"
            placeholder="Buscar encomienda..."
            className="topbar__search-input"
          />
        </div>
        <button className="topbar__notification" aria-label="Notificaciones">
          <Bell size={20} />
          <span className="topbar__notification-badge">3</span>
        </button>
        <div className="topbar__user-quick">
          <span className="topbar__user-greeting">
            Hola, <strong>{user?.nombre.split(' ')[0]}</strong>
          </span>
        </div>
      </div>
    </header>
  );
}
