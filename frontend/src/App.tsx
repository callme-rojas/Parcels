import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import client from './graphql/client';
import { useAuthStore } from './stores/authStore';
import { Rol } from './types';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

// Public pages (no auth needed)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RastreoPublicoPage from './pages/RastreoPublicoPage';
import CrearEnvioPage from './pages/CrearEnvioPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Internal pages
import DashboardPage from './pages/DashboardPage';
import TaquillaPage from './pages/TaquillaPage';
import BodegaPage from './pages/BodegaPage';
import EncomiendasPage from './pages/EncomiendasPage';
import SeguimientoPage from './pages/SeguimientoPage';
import UsuariosPage from './pages/UsuariosPage';
import ReportesPage from './pages/ReportesPage';
import MisEnviosPage from './pages/MisEnviosPage';

function AppRoutes() {
  const user = useAuthStore((s) => s.user);

  const getDefaultRoute = () => {
    if (!user) return '/rastreo';
    switch (user.rol) {
      case Rol.ADMINISTRADOR: return '/dashboard';
      case Rol.TAQUILLA: return '/taquilla';
      case Rol.BODEGA: return '/bodega';
      case Rol.USUARIO: return '/mis-envios';
      default: return '/rastreo';
    }
  };

  return (
    <Routes>
      {/* ── Public routes (no auth) ──────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/rastreo" element={<RastreoPublicoPage />} />
      <Route path="/enviar" element={<CrearEnvioPage />} />
      <Route path="/no-autorizado" element={<UnauthorizedPage />} />

      {/* ── Protected routes (auth required) ─────── */}
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
            <Route path="/entrega" element={<EncomiendasPage />} />
          </Route>

          {/* Bodega routes */}
          <Route element={<RoleRoute allowedRoles={[Rol.ADMINISTRADOR, Rol.BODEGA]} />}>
            <Route path="/bodega" element={<BodegaPage />} />
          </Route>

          {/* Shared internal routes (all authenticated roles) */}
          <Route element={<RoleRoute allowedRoles={[Rol.ADMINISTRADOR, Rol.TAQUILLA, Rol.BODEGA, Rol.USUARIO]} />}>
            <Route path="/encomiendas" element={<EncomiendasPage />} />
            <Route path="/seguimiento" element={<SeguimientoPage />} />
          </Route>

          {/* USUARIO routes */}
          <Route element={<RoleRoute allowedRoles={[Rol.USUARIO]} />}>
            <Route path="/mis-envios" element={<MisEnviosPage />} />
            <Route path="/crear-envio" element={<CrearEnvioPage />} />
          </Route>

        </Route>
      </Route>

      {/* ── Redirects ────────────────────────────── */}
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
