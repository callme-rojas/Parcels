import { MapPin } from 'lucide-react';

export default function SeguimientoPage() {
  return (
    <div className="panel-page">
      <div className="empty-state">
        <MapPin size={56} strokeWidth={1.5} />
        <h2>Seguimiento en Tiempo Real</h2>
        <p>Aquí se integrará el mapa Mapbox con rastreo GPS de buses.</p>
        <span className="empty-state__tag">FASE 13 — FE-SEG-01</span>
      </div>
    </div>
  );
}
