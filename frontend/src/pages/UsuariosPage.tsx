import { Users } from 'lucide-react';

export default function UsuariosPage() {
  return (
    <div className="panel-page">
      <div className="empty-state">
        <Users size={56} strokeWidth={1.5} />
        <h2>Gestión de Usuarios</h2>
        <p>Crear, editar y desactivar usuarios del sistema.</p>
        <span className="empty-state__tag">FASE 14 — FE-ADM-04</span>
      </div>
    </div>
  );
}
