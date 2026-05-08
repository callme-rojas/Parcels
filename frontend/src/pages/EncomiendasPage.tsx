import { Package } from 'lucide-react';

export default function EncomiendasPage() {
  return (
    <div className="panel-page">
      <div className="empty-state">
        <Package size={56} strokeWidth={1.5} />
        <h2>Gestión de Encomiendas</h2>
        <p>Este módulo se conectará con el backend para listar, filtrar y gestionar todas las encomiendas del sistema.</p>
        <span className="empty-state__tag">FASE 9 — FE-ENC-03</span>
      </div>
    </div>
  );
}
