import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="error-page">
      <ShieldOff size={72} strokeWidth={1.2} />
      <h1>Acceso Denegado</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
      <Link to="/" className="btn btn--primary">Volver al inicio</Link>
    </div>
  );
}
