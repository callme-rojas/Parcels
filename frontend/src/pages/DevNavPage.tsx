import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Rol } from '../types';
import type { Usuario } from '../types';
import {
  LayoutDashboard, Package, ScanLine, Warehouse, MapPin, Users,
  BarChart3, FileBarChart, Truck, Globe, UserPlus, LogIn, Send,
  Eye, Settings, ArrowRight, Zap
} from 'lucide-react';

// Dev users for quick-login
const DEV_USERS: Record<string, Usuario> = {
  admin: { id: 'dev-admin', nombre: 'Admin Dev', email: 'admin@travell.com', rol: Rol.ADMINISTRADOR, activo: true },
  taquilla: { id: 'dev-taquilla', nombre: 'Carla Gutiérrez', email: 'taquilla@travell.com', rol: Rol.TAQUILLA, activo: true },
  bodega: { id: 'dev-bodega', nombre: 'Jorge Mamani', email: 'bodega@travell.com', rol: Rol.BODEGA, activo: true },
  cliente: { id: 'dev-cliente', nombre: 'Rosa Méndez', email: 'rosa@email.com', rol: Rol.CLIENTE, activo: true, telefono: '+591 7654-3210' },
};

interface RouteItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiresRole?: Rol[];
  isPublic?: boolean;
  description: string;
  cu?: string; // Caso de uso
}

const ALL_ROUTES: { section: string; color: string; routes: RouteItem[] }[] = [
  {
    section: 'Públicas (sin login)',
    color: '#16A34A',
    routes: [
      { path: '/rastreo', label: 'Rastreo Público', icon: <Globe size={18} />, isPublic: true, description: 'Rastrear envío por código', cu: 'CU-03, CU-04' },
      { path: '/enviar', label: 'Enviar Paquete (Guest)', icon: <Send size={18} />, isPublic: true, description: 'Crear envío sin cuenta', cu: 'CU-01, CU-02' },
      { path: '/login', label: 'Login', icon: <LogIn size={18} />, isPublic: true, description: 'Iniciar sesión' },
      { path: '/registro', label: 'Registro', icon: <UserPlus size={18} />, isPublic: true, description: 'Crear cuenta de usuario' },
    ],
  },
  {
    section: 'Admin — Gestión & Análisis',
    color: '#1B3A6B',
    routes: [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, requiresRole: [Rol.ADMINISTRADOR], description: 'KPIs y resumen operativo', cu: 'CU-14, CU-16' },
      { path: '/encomiendas', label: 'Encomiendas', icon: <Package size={18} />, requiresRole: [Rol.ADMINISTRADOR], description: 'Tabla completa con filtros', cu: 'CU-08' },
      { path: '/usuarios', label: 'Usuarios', icon: <Users size={18} />, requiresRole: [Rol.ADMINISTRADOR], description: 'CRUD de usuarios del sistema' },
      { path: '/reportes', label: 'Reportes', icon: <BarChart3 size={18} />, requiresRole: [Rol.ADMINISTRADOR], description: 'Reportes por ruta/fecha/estado', cu: 'CU-15' },
      { path: '/seguimiento', label: 'Seguimiento GPS', icon: <MapPin size={18} />, requiresRole: [Rol.ADMINISTRADOR], description: 'Mapa en tiempo real', cu: 'CU-17, CU-18' },
    ],
  },
  {
    section: 'Taquilla — Recepción & Entrega',
    color: '#E5A100',
    routes: [
      { path: '/taquilla', label: 'Panel Taquilla', icon: <ScanLine size={18} />, requiresRole: [Rol.TAQUILLA], description: 'Recepcionar, escanear, actualizar estado', cu: 'CU-05, CU-06, CU-07, CU-08' },
      { path: '/entrega', label: 'Entrega al Cliente', icon: <FileBarChart size={18} />, requiresRole: [Rol.TAQUILLA], description: 'Confirmar retiro con CI', cu: 'CU-09' },
    ],
  },
  {
    section: 'Bodega — Operación & Carga',
    color: '#7C3AED',
    routes: [
      { path: '/bodega', label: 'Panel Bodega', icon: <Warehouse size={18} />, requiresRole: [Rol.BODEGA], description: 'Clasificar, asignar a bus, carga/descarga', cu: 'CU-10, CU-11, CU-12, CU-13' },
    ],
  },
  {
    section: 'Cliente — Mis Envíos',
    color: '#3B82F6',
    routes: [
      { path: '/mis-envios', label: 'Mis Envíos', icon: <Package size={18} />, requiresRole: [Rol.CLIENTE], description: 'Historial de envíos del usuario', cu: 'CU-01' },
      { path: '/crear-envio', label: 'Crear Envío', icon: <Send size={18} />, requiresRole: [Rol.CLIENTE], description: 'Nuevo envío (usuario logueado)', cu: 'CU-01, CU-02' },
    ],
  },
];

export default function DevNavPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const quickLogin = (role: string) => {
    const devUser = DEV_USERS[role];
    // Directly set state in Zustand — bypasses GraphQL for dev purposes
    useAuthStore.setState({
      user: devUser,
      token: `dev-token-${role}-${Date.now()}`,
      isAuthenticated: true,
    });
  };

  const goTo = (path: string, requiredRole?: Rol[]) => {
    if (requiredRole && requiredRole.length > 0) {
      const currentRole = useAuthStore.getState().user?.rol;
      if (!currentRole || !requiredRole.includes(currentRole)) {
        // Auto-login as the first required role
        const roleKey = requiredRole[0].toLowerCase() === 'administrador' ? 'admin' : requiredRole[0].toLowerCase();
        quickLogin(roleKey);
      }
    }
    navigate(path);
  };

  return (
    <div className="dev-nav-page">
      <div className="dev-nav-header">
        <div className="dev-nav-header__left">
          <Zap size={28} style={{ color: '#E5A100' }} />
          <div>
            <h1>Dev Navigation</h1>
            <p>Acceso rápido a todas las páginas — solo visible en desarrollo</p>
          </div>
        </div>
        <div className="dev-nav-header__session">
          {user ? (
            <div className="dev-nav-session">
              <span className="dev-nav-session__badge">{user.rol}</span>
              <span>{user.nombre}</span>
              <button className="btn btn--sm btn--danger-outline" onClick={logout}>Cerrar sesión</button>
            </div>
          ) : (
            <span style={{ color: '#9CA3AF', fontSize: 13 }}>Sin sesión activa</span>
          )}
        </div>
      </div>

      {/* Quick login buttons */}
      <div className="dev-nav-logins">
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>
          Quick Login:
        </span>
        {Object.entries(DEV_USERS).map(([key, u]) => (
          <button
            key={key}
            className={`dev-nav-login-btn ${user?.rol === u.rol ? 'dev-nav-login-btn--active' : ''}`}
            onClick={() => quickLogin(key)}
          >
            {u.rol}
          </button>
        ))}
        {user && (
          <button className="dev-nav-login-btn dev-nav-login-btn--logout" onClick={logout}>
            Logout
          </button>
        )}
      </div>

      {/* Route sections */}
      <div className="dev-nav-sections">
        {ALL_ROUTES.map((section) => (
          <div key={section.section} className="dev-nav-section">
            <h2 className="dev-nav-section__title" style={{ borderLeftColor: section.color }}>
              {section.section}
            </h2>
            <div className="dev-nav-grid">
              {section.routes.map((route) => (
                <button
                  key={route.path}
                  className="dev-nav-card"
                  onClick={() => goTo(route.path, route.requiresRole)}
                >
                  <div className="dev-nav-card__icon" style={{ color: section.color }}>
                    {route.icon}
                  </div>
                  <div className="dev-nav-card__content">
                    <div className="dev-nav-card__top">
                      <strong>{route.label}</strong>
                      {route.isPublic && <span className="dev-nav-card__public">Pública</span>}
                    </div>
                    <span className="dev-nav-card__desc">{route.description}</span>
                    <span className="dev-nav-card__path">{route.path}</span>
                    {route.cu && <span className="dev-nav-card__cu">{route.cu}</span>}
                  </div>
                  <ArrowRight size={16} className="dev-nav-card__arrow" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
