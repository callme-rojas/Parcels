import { useState } from 'react';
import { Package, Search, MapPin, Clock, ArrowRight, Truck, ScanBarcode } from 'lucide-react';
import type { EstadoEncomienda } from '../types';

// Mock result for demonstration
const MOCK_RESULT = {
  codigo: 'EX-2026-SCZ-0048217',
  estado: 'EN_TRANSITO' as EstadoEncomienda,
  remitente: { nombre: 'Rosa Méndez S.', ciudad: 'Santa Cruz' },
  destinatario: { nombre: 'Juan C. Rojas V.', ciudad: 'Puerto Quijarro' },
  ruta: 'Santa Cruz → Puerto Quijarro',
  bus: 'Flota 18 · Placa 2845-KCN',
  pesoReal: '3.3 kg',
  eta: '14:50 · hoy',
  eventos: [
    { estado: 'Registrada en línea', detalle: 'Por Rosa Méndez · canal web', fecha: '12 mar · 11:42', completed: true },
    { estado: 'Recibida en taquilla SCZ', detalle: 'Carla Gutiérrez · Vent. 6 · Recibo 45821', fecha: '12 mar · 11:58', completed: true },
    { estado: 'Cargada al Bus #18', detalle: 'Manifiesto MNF-0312 · Andén 3', fecha: '12 mar · 13:05', completed: true },
    { estado: 'Despacho oficial', detalle: 'SCZ → PQA · Conductor J. Suárez', fecha: '12 mar · 13:30', completed: true },
    { estado: 'En tránsito · Pailón', detalle: 'Punto GPS recibido · 87 km/h', fecha: '12 mar · 16:52', completed: false, current: true },
    { estado: 'Arribo a terminal Pto. Quijarro', detalle: 'Estimado 14:50 del 13 mar', fecha: '—', completed: false },
    { estado: 'Disponible en ventanilla', detalle: 'Notificación SMS al destinatario', fecha: '—', completed: false },
    { estado: 'Entregada', detalle: 'Confirmación con CI del destinatario', fecha: '—', completed: false },
  ],
  paradas: ['Santa Cruz', 'Cotoca', 'Pailón', 'San José', 'Roboré', 'Pto. Quijarro'],
  busPosition: 3, // index of current stop
  stats: { distancia: '312 km / 651 km', tiempo: '3h 22m', proximaParada: 'San José Chiquitos', sync: 'Activa · 12 s' },
};

const estadoBadge: Record<string, { label: string; className: string }> = {
  REGISTRADO: { label: 'Pre-registrada', className: 'badge badge--gray' },
  RECEPCIONADO: { label: 'Recibida en taquilla', className: 'badge badge--blue' },
  EN_TRANSITO: { label: 'En tránsito', className: 'badge badge--amber' },
  EN_DESTINO: { label: 'En destino', className: 'badge badge--blue' },
  DISPONIBLE: { label: 'Disponible para retiro', className: 'badge badge--emerald' },
  ENTREGADO: { label: 'Entregada', className: 'badge badge--green' },
};

export default function RastreoPublicoPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<typeof MOCK_RESULT | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    // TODO: Replace with real GraphQL query
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setResult(MOCK_RESULT);
    setLoading(false);
  };

  const badge = result ? estadoBadge[result.estado] : null;

  return (
    <div className="rastreo-page">
      {/* ─── Public Navbar ─────────────────────────── */}
      <nav className="rastreo-nav">
        <div className="rastreo-nav__left">
          <div className="rastreo-nav__logo">
            <Package size={20} strokeWidth={2.5} />
          </div>
          <span className="rastreo-nav__brand">Travell <span>Encomiendas</span></span>
        </div>
        <div className="rastreo-nav__links">
          <a href="/rastreo" className="rastreo-nav__link rastreo-nav__link--active">Rastrear</a>
          <a href="/enviar" className="rastreo-nav__link">Enviar paquete</a>
          <a href="/login" className="btn btn--primary btn--sm">Iniciar sesión</a>
        </div>
      </nav>

      {/* ─── Hero Section ──────────────────────────── */}
      <section className="rastreo-hero">
        <div className="rastreo-hero__content">
          <h1 className="rastreo-hero__title">
            Rastrea tu encomienda en la ruta{' '}
            <span className="rastreo-hero__highlight">Santa Cruz · Puerto Quijarro</span>
          </h1>
          <p className="rastreo-hero__desc">
            Ingresa tu número de rastreo o escanea el código PDF417 de la etiqueta.
            Sigue el bus en el mapa en tiempo real, sin llamadas ni colas.
          </p>

          <form className="rastreo-search" onSubmit={handleSearch}>
            <input
              type="text"
              className="rastreo-search__input"
              placeholder="EX-2026-SCZ-0048217"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn--primary">
              Rastrear envío
            </button>
            <button type="button" className="btn btn--secondary" title="Escanear código PDF417">
              <ScanBarcode size={18} /> Escanear
            </button>
          </form>

          <div className="rastreo-hero__stats">
            <span><span className="rastreo-hero__dot rastreo-hero__dot--green" /> 14 buses activos</span>
            <span><span className="rastreo-hero__dot rastreo-hero__dot--amber" /> 328 encomiendas en tránsito</span>
            <span><span className="rastreo-hero__dot rastreo-hero__dot--blue" /> Última sync · 12:04</span>
          </div>
        </div>

        {/* ─── Result Card (if searched) ──────────── */}
        {loading && (
          <div className="rastreo-result rastreo-result--loading">
            <div className="spin" style={{ margin: 'auto' }}><Search size={32} /></div>
            <p style={{ textAlign: 'center', color: '#6B7280', marginTop: 12 }}>Buscando encomienda...</p>
          </div>
        )}

        {result && !loading && badge && (
          <div className="rastreo-result">
            <div className="rastreo-result__header">
              <div>
                <span style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Resultado</span>
                <div className="rastreo-result__code">{result.codigo}</div>
              </div>
              <span className={badge.className}>
                <span className="badge__dot" /> {badge.label}
              </span>
            </div>

            <div className="rastreo-result__grid">
              <div>
                <span className="rastreo-result__label">Origen</span>
                <span className="rastreo-result__value">{result.remitente.ciudad}</span>
              </div>
              <div>
                <span className="rastreo-result__label">Destino</span>
                <span className="rastreo-result__value">{result.destinatario.ciudad}</span>
              </div>
              <div>
                <span className="rastreo-result__label">Bus</span>
                <span className="rastreo-result__value">{result.bus}</span>
              </div>
              <div>
                <span className="rastreo-result__label">ETA</span>
                <span className="rastreo-result__value">{result.eta}</span>
              </div>
            </div>

            {/* Route progress */}
            <div className="rastreo-route">
              {result.paradas.map((parada, i) => (
                <div key={parada} className={`rastreo-route__stop ${i <= result.busPosition ? 'rastreo-route__stop--passed' : ''} ${i === result.busPosition ? 'rastreo-route__stop--current' : ''}`}>
                  <div className="rastreo-route__dot" />
                  {i < result.paradas.length - 1 && <div className="rastreo-route__line" />}
                  <span className="rastreo-route__name">{parada}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {searched && !loading && !result && (
          <div className="rastreo-result" style={{ textAlign: 'center', padding: 40 }}>
            <Package size={40} style={{ color: '#9CA3AF' }} />
            <p style={{ color: '#6B7280', marginTop: 8 }}>No se encontró ninguna encomienda con ese código.</p>
          </div>
        )}
      </section>

      {/* ─── Timeline (if result) ──────────────────── */}
      {result && !loading && (
        <section className="rastreo-timeline-section">
          <div className="rastreo-info-panel">
            <h3>Resumen del envío</h3>
            <div className="rastreo-info-grid">
              <div><span className="rastreo-result__label">De</span><strong>{result.remitente.nombre}</strong><br /><span style={{ fontSize: 12, color: '#6B7280' }}>{result.remitente.ciudad}</span></div>
              <div><span className="rastreo-result__label">Para</span><strong>{result.destinatario.nombre}</strong><br /><span style={{ fontSize: 12, color: '#6B7280' }}>{result.destinatario.ciudad}</span></div>
              <div><span className="rastreo-result__label">Peso real</span><strong>{result.pesoReal}</strong></div>
            </div>
          </div>

          <div className="rastreo-timeline-panel">
            <h3>Historial de eventos</h3>
            <div className="rastreo-timeline">
              {result.eventos.map((ev, i) => (
                <div key={i} className={`rastreo-timeline__item ${ev.completed ? 'rastreo-timeline__item--done' : ''} ${ev.current ? 'rastreo-timeline__item--current' : ''}`}>
                  <div className="rastreo-timeline__dot" />
                  <div className="rastreo-timeline__content">
                    <strong>{ev.estado}</strong>
                    <span className="rastreo-timeline__detail">{ev.detalle}</span>
                  </div>
                  <span className="rastreo-timeline__date">{ev.fecha}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Steps (when no result) ────────────────── */}
      {!result && !loading && (
        <section className="rastreo-steps">
          <div className="rastreo-step">
            <h3>1. Registra en línea</h3>
            <p>Completa los datos del remitente, destinatario y contenido. Obtienes una etiqueta PDF417 lista para imprimir.</p>
          </div>
          <div className="rastreo-step">
            <h3>2. Entrega en oficina</h3>
            <p>El personal de taquilla escanea la etiqueta, verifica el paquete y confirma la recepción en el sistema.</p>
          </div>
          <div className="rastreo-step">
            <h3>3. Sigue al bus</h3>
            <p>Visualiza la ubicación del bus en el mapa y recibe alertas cuando tu paquete esté disponible para retiro.</p>
          </div>
        </section>
      )}

      {/* ─── Stats bar (if result) ────────────────── */}
      {result && !loading && (
        <section className="rastreo-stats-bar">
          <div className="rastreo-stat">
            <span className="rastreo-stat__label">Distancia recorrida</span>
            <span className="rastreo-stat__value">{result.stats.distancia}</span>
          </div>
          <div className="rastreo-stat">
            <span className="rastreo-stat__label">Tiempo en ruta</span>
            <span className="rastreo-stat__value">{result.stats.tiempo}</span>
          </div>
          <div className="rastreo-stat">
            <span className="rastreo-stat__label">Próxima parada</span>
            <span className="rastreo-stat__value">{result.stats.proximaParada}</span>
          </div>
          <div className="rastreo-stat">
            <span className="rastreo-stat__label">Sincronización</span>
            <span className="rastreo-stat__value" style={{ color: '#16A34A' }}>● {result.stats.sync}</span>
          </div>
        </section>
      )}
    </div>
  );
}
