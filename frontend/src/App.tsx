import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import client from './graphql/client';
import { useAuthStore } from './stores/authStore';
import { Rol } from './types';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TaquillaPage from './pages/TaquillaPage';
import BodegaPage from './pages/BodegaPage';
import EncomiendasPage from './pages/EncomiendasPage';
import SeguimientoPage from './pages/SeguimientoPage';
import UsuariosPage from './pages/UsuariosPage';
import ReportesPage from './pages/ReportesPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

function AppRoutes() {
  const user = useAuthStore((s) => s.user);

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.rol) {
      case Rol.ADMINISTRADOR: return '/dashboard';
      case Rol.TAQUILLA: return '/taquilla';
      case Rol.BODEGA: return '/bodega';
      default: return '/seguimiento';
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/no-autorizado" element={<UnauthorizedPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>

          {/* Admin routes */}
          <Route element={<RoleRoute allowedRoles={[Rol.ADMINISTRADOR]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>

          {/* Taquilla routes */}
          <Route element={<RoleRoute allowedRoles={[Rol.ADMINISTRADOR, Rol.TAQUILLA]} />}>
            <Route path="/taquilla" element={<TaquillaPage />} />
            <Route path="/encomiendas" element={<EncomiendasPage />} />
          </Route>

          {/* Bodega routes */}
          <Route element={<RoleRoute allowedRoles={[Rol.BODEGA]} />}>
            <Route path="/bodega" element={<BodegaPage />} />
          </Route>

          {/* Shared routes */}
          <Route element={<RoleRoute allowedRoles={[Rol.ADMINISTRADOR, Rol.TAQUILLA, Rol.BODEGA]} />}>
            <Route path="/seguimiento" element={<SeguimientoPage />} />
          </Route>
        </Route>
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ApolloProvider>
  );
}
