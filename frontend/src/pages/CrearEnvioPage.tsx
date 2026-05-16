import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Package, FileBarChart, Download, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCreateParcel } from '../hooks/useParcel';
import type { Parcel } from '../types';

// Steps in the flow
type Step = 'remitente' | 'destinatario' | 'paquete' | 'confirmacion';

export default function CrearEnvioPage() {
  const user = useAuthStore((s) => s.user);
  const isGuest = !user;
  const { createParcel } = useCreateParcel();

  // If logged in, pre-fill remitente data
  const [step, setStep] = useState<Step>(isGuest ? 'remitente' : 'destinatario');

  // Remitente (sender) data — only needed for guests
  const [remNombre, setRemNombre] = useState(user?.nombre || '');
  const [remCi, setRemCi] = useState('');
  const [remEmail, setRemEmail] = useState(user?.email || '');
  const [remTelefono, setRemTelefono] = useState(user?.telefono || '');

  // Destinatario (receiver) data — always needed
  const [destNombre, setDestNombre] = useState('');
  const [destCi, setDestCi] = useState('');
  const [destTelefono, setDestTelefono] = useState('');
  const [destEmail, setDestEmail] = useState('');

  // Package data
  const [descripcion, setDescripcion] = useState('');
  const [contenido, setContenido] = useState('');
  const [pesoDeclarado, setPesoDeclarado] = useState('');
  const [ruta, setRuta] = useState('SCZ-PQA');
  const [observaciones, setObservaciones] = useState('');

  // Result
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [parcelCreado, setParcelCreado] = useState<Parcel | null>(null);

  const RUTAS = [
    { value: 'SCZ-PQA', label: 'Santa Cruz → Puerto Quijarro' },
    { value: 'SCZ-SJC', label: 'Santa Cruz → San José de Chiquitos' },
    { value: 'SCZ-ROB', label: 'Santa Cruz → Roboré' },
    { value: 'PQA-SCZ', label: 'Puerto Quijarro → Santa Cruz' },
  ];

  const goNext = () => {
    const steps: Step[] = isGuest
      ? ['remitente', 'destinatario', 'paquete', 'confirmacion']
      : ['destinatario', 'paquete', 'confirmacion'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const goBack = () => {
    const steps: Step[] = isGuest
      ? ['remitente', 'destinatario', 'paquete', 'confirmacion']
      : ['destinatario', 'paquete', 'confirmacion'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setServerError('');
    try {
      const result = await createParcel({
        senderName: remNombre,
        senderCi: remCi,
        senderPhone: remTelefono,
        senderEmail: remEmail,
        recipientName: destNombre,
        recipientCi: destCi,
        recipientPhone: destTelefono,
        recipientEmail: destEmail || undefined,
        content: contenido,
        weight: parseFloat(pesoDeclarado),
        observations: observaciones || undefined,
        routeCode: ruta,
      });
      setParcelCreado(result);
      setStep('confirmacion');
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Error al crear la encomienda';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const allSteps: { key: Step; label: string }[] = isGuest
    ? [
        { key: 'remitente', label: 'Tus datos' },
        { key: 'destinatario', label: 'Destinatario' },
        { key: 'paquete', label: 'Paquete' },
        { key: 'confirmacion', label: 'Etiqueta' },
      ]
    : [
        { key: 'destinatario', label: 'Destinatario' },
        { key: 'paquete', label: 'Paquete' },
        { key: 'confirmacion', label: 'Etiqueta' },
      ];

  const currentIdx = allSteps.findIndex((s) => s.key === step);

  return (
    <div className={user ? 'panel-page' : 'rastreo-page'}>
      {/* Public navbar for guests */}
      {!user && (
        <nav className="rastreo-nav">
          <div className="rastreo-nav__left">
            <div className="rastreo-nav__logo"><Package size={20} strokeWidth={2.5} /></div>
            <span className="rastreo-nav__brand">Travell <span>Encomiendas</span></span>
          </div>
          <div className="rastreo-nav__links">
            <a href="/rastreo" className="rastreo-nav__link">Rastrear</a>
            <a href="/enviar" className="rastreo-nav__link rastreo-nav__link--active">Enviar paquete</a>
            <a href="/login" className="btn btn--primary btn--sm">Iniciar sesión</a>
          </div>
        </nav>
      )}

      <div className="envio-container">
        {/* Progress stepper */}
        {step !== 'confirmacion' || !codigoGenerado ? (
          <div className="envio-stepper">
            {allSteps.map((s, i) => (
              <div key={s.key} className={`envio-stepper__step ${i <= currentIdx ? 'envio-stepper__step--active' : ''} ${i < currentIdx ? 'envio-stepper__step--done' : ''}`}>
                <div className="envio-stepper__dot">{i < currentIdx ? '✓' : i + 1}</div>
                <span className="envio-stepper__label">{s.label}</span>
                {i < allSteps.length - 1 && <div className="envio-stepper__line" />}
              </div>
            ))}
          </div>
        ) : null}

        <div className="envio-card">
          {/* ── Step: Remitente (guests only) ───── */}
          {step === 'remitente' && (
            <>
              <h2 className="envio-card__title">Tus datos de remitente</h2>
              <p className="envio-card__desc">
                Necesitamos tus datos para generar la etiqueta. No necesitas crear una cuenta.
              </p>
              <div className="envio-form">
                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Nombre completo *</label>
                    <input className="form-input" placeholder="Ej: Rosa Méndez Suárez"
                      value={remNombre} onChange={(e) => setRemNombre(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cédula de identidad (CI) *</label>
                    <input className="form-input" placeholder="Ej: 9 102 778 SC"
                      value={remCi} onChange={(e) => setRemCi(e.target.value)} required />
                  </div>
                </div>
                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Correo electrónico *</label>
                    <input className="form-input" type="email" placeholder="tu@email.com"
                      value={remEmail} onChange={(e) => setRemEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input className="form-input" type="tel" placeholder="+591 7XXX-XXXX"
                      value={remTelefono} onChange={(e) => setRemTelefono(e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className="envio-card__actions">
                <span />
                <button className="btn btn--primary" onClick={goNext}
                  disabled={!remNombre || !remCi || !remEmail || !remTelefono}>
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* ── Step: Destinatario ───── */}
          {step === 'destinatario' && (
            <>
              <h2 className="envio-card__title">Datos del destinatario</h2>
              <p className="envio-card__desc">¿A quién le envías el paquete?</p>
              <div className="envio-form">
                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Nombre completo *</label>
                    <input className="form-input" placeholder="Nombre del destinatario"
                      value={destNombre} onChange={(e) => setDestNombre(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CI del destinatario *</label>
                    <input className="form-input" placeholder="Para validar entrega"
                      value={destCi} onChange={(e) => setDestCi(e.target.value)} required />
                  </div>
                </div>
                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input className="form-input" type="tel" placeholder="+591 6XXX-XXXX"
                      value={destTelefono} onChange={(e) => setDestTelefono(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo electrónico (opcional)</label>
                    <input className="form-input" type="email" placeholder="Para notificaciones"
                      value={destEmail} onChange={(e) => setDestEmail(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="envio-card__actions">
                <button className="btn btn--secondary" onClick={goBack}>
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button className="btn btn--primary" onClick={goNext}
                  disabled={!destNombre || !destCi || !destTelefono}>
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* ── Step: Paquete ───── */}
          {step === 'paquete' && (
            <>
              <h2 className="envio-card__title">Detalles del paquete</h2>
              <p className="envio-card__desc">Describe lo que estás enviando.</p>
              <div className="envio-form">
                <div className="form-group">
                  <label className="form-label">Ruta *</label>
                  <select className="form-input" value={ruta} onChange={(e) => setRuta(e.target.value)}>
                    {RUTAS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Descripción / Contenido *</label>
                    <input className="form-input" placeholder="Ej: Repuestos · Frágil"
                      value={contenido} onChange={(e) => setContenido(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Peso declarado (kg) *</label>
                    <input className="form-input" type="number" step="0.1" min="0.1" placeholder="Ej: 3.2"
                      value={pesoDeclarado} onChange={(e) => setPesoDeclarado(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones (opcional)</label>
                  <input className="form-input" placeholder="Instrucciones especiales, fragil, etc."
                    value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>
              </div>
              {serverError && (
                <div className="taq-scan-result taq-scan-result--error" style={{ marginTop: 8 }}>
                  <AlertCircle size={18} />
                  <div><strong>Error al generar etiqueta</strong><span>{serverError}</span></div>
                </div>
              )}
              <div className="envio-card__actions">
                <button className="btn btn--secondary" onClick={goBack}>
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button className="btn btn--gold" onClick={handleSubmit}
                  disabled={loading || !contenido || !pesoDeclarado}>
                  {loading ? (<><Loader2 size={16} className="spin" /> Generando...</>) : (<><FileBarChart size={16} /> Generar etiqueta</>)}
                </button>
              </div>
            </>
          )}

          {/* ── Step: Confirmación + Etiqueta ───── */}
          {step === 'confirmacion' && parcelCreado && (
            <div className="envio-success">
              <CheckCircle2 size={48} style={{ color: '#16A34A' }} />
              <h2 className="envio-card__title">¡Envío registrado con éxito!</h2>
              <p className="envio-card__desc">
                Tu etiqueta ha sido generada. Imprímela y pégala en el paquete antes de llevarlo a la oficina.
              </p>

              <div className="envio-label">
                <div className="envio-label__header">
                  <Package size={20} /> <strong>Travell Encomiendas</strong>
                </div>
                <div className="envio-label__code">{parcelCreado.trackingNumber}</div>
                <div className="envio-label__barcode">
                  <div className="envio-label__bars">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="envio-label__bar" style={{ height: 30 + Math.random() * 20, width: Math.random() > 0.5 ? 2 : 3 }} />
                    ))}
                  </div>
                </div>
                <div className="envio-label__grid">
                  <div><span>Código</span><strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{parcelCreado.trackingNumber}</strong></div>
                  <div><span>Remitente</span><strong>{parcelCreado.senderName}</strong></div>
                  <div><span>Destinatario</span><strong>{parcelCreado.recipientName}</strong></div>
                  <div><span>Ruta</span><strong>{parcelCreado.originAddress.split(',')[0]} → {parcelCreado.destinationAddress.split(',')[0]}</strong></div>
                  <div><span>Peso</span><strong>{parcelCreado.weight} kg</strong></div>
                  <div><span>Contenido</span><strong>{parcelCreado.content}</strong></div>
                </div>
              </div>

              <div className="envio-card__actions" style={{ justifyContent: 'center', gap: 12 }}>
                <button className="btn btn--primary" onClick={() => window.print()}>
                  <Download size={16} /> Imprimir etiqueta
                </button>
                <Link to={`/rastreo?code=${parcelCreado.trackingNumber}`} className="btn btn--secondary">
                  Rastrear este envío
                </Link>
              </div>

              {isGuest && (
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 20, textAlign: 'center' }}>
                  ¿Quieres guardar un historial de tus envíos?{' '}
                  <Link to="/registro" style={{ color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>Crea una cuenta</Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
