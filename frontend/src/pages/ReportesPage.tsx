import { BarChart3 } from 'lucide-react';

export default function ReportesPage() {
  return (
    <div className="panel-page">
      <div className="empty-state">
        <BarChart3 size={56} strokeWidth={1.5} />
        <h2>Reportes e Indicadores</h2>
        <p>Reportes filtrados por ruta, estado, y fecha con exportación a CSV.</p>
        <span className="empty-state__tag">FASE 14 — FE-ADM-02</span>
      </div>
    </div>
  );
}
