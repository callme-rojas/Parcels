import { useAuthStore } from '../../stores/authStore';
import { Bell, Search, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tablero · Resumen operativo',
  '/encomiendas': 'Encomiendas',
  '/taquilla': 'Taquilla · Recepción de encomiendas',
  '/bodega': 'Bodega · Encomiendas pendientes',
  '/manifiestos': 'Manifiestos & carga',
  '/seguimiento': 'Seguimiento en vivo',
  '/usuarios': 'Usuarios & roles',
  '/reportes': 'Reportes',
  '/buses': 'Buses & rutas',
  '/sucursales': 'Sucursales',
  '/entrega': 'Entrega al cliente',
  '/cobros': 'Cobros del día',
  '/mis-envios': 'Mis Envíos',
  '/crear-envio': 'Nuevo Envío',
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname]
    || (location.pathname.startsWith('/encomiendas/') ? 'Detalle de Encomienda' : 'Encomiendas');

  return (
    <header className="topbar">
      <div className="topbar__left" style={{ display: 'flex', alignItems: 'center' }}>
        {onMenuClick && (
          <button
            className="topbar__menu-toggle"
            onClick={onMenuClick}
            aria-label="Abrir menú"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'none', // Mostrar por CSS en pantallas móviles
              padding: '6px',
              marginRight: '8px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={22} />
          </button>
        )}
        <h1 className="topbar__title" style={{ fontSize: '18px', fontWeight: 700 }}>{pageTitle}</h1>
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
