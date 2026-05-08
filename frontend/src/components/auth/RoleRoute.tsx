import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { Rol } from '../../types';

interface Props {
  allowedRoles: Rol[];
}

export default function RoleRoute({ allowedRoles }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
}
