import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useAuthStore } from '../stores/authStore';
import {
  Package,
  Download,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  Info,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCreateParcel } from '../hooks/useParcel';
import { GENERAR_ETIQUETA } from '../graphql/queries';
import type { Parcel } from '../types';

type Step = 'remitente' | 'destinatario' | 'categoria' | 'dimensiones' | 'confirmacion';

const CATEGORIAS_CONTENIDO = [
  { id: 'DOCUMENTOS', label: 'Documentos', icon: '📝', desc: 'Contratos, facturas, cartas' },
  { id: 'ROPA', label: 'Ropa', icon: '👕', desc: 'Prendas, calzado, textiles' },
  { id: 'ELECTRONICO', label: 'Electrónicos', icon: '💻', desc: 'Celulares, repuestos, laptops' },
  { id: 'ALIMENTOS', label: 'Alimentos', icon: '🍎', desc: 'Secos, envasados, no perecederos' },
  { id: 'HERRAMIENTAS', label: 'Herramientas', icon: '🔧', desc: 'Accesorios, herramientas' },
  { id: 'MEDICAMENTOS', label: 'Medicamentos', icon: '💊', desc: 'Insumos médicos, pastillas' },
  { id: 'OTRO', label: 'Otro', icon: '📦', desc: 'Cualquier otro artículo' },
] as const;

export default function CrearEnvioPage() {
  const user = useAuthStore((s) => s.user);
  const isGuest = !user;
  const { createParcel } = useCreateParcel();

  // Navigation steps
  const [step, setStep] = useState<Step>(isGuest ? 'remitente' : 'destinatario');

  // Step 1: Remitente (only for guests)
  const [remNombre, setRemNombre] = useState(user?.nombre || '');
  const [remCi, setRemCi] = useState('');
  const [remEmail, setRemEmail] = useState(user?.email || '');
  const [remTelefono, setRemTelefono] = useState(user?.telefono || '');

  // Step 2: Destinatario
  const [destNombre, setDestNombre] = useState('');
  const [destCi, setDestCi] = useState('');
  const [destTelefono, setDestTelefono] = useState('');
  const [destEmail, setDestEmail] = useState('');

  // Step 3: Categoría + fragilidad
  const [categoria, setCategoria] = useState<string>('OTRO');
  const [esFragil, setEsFragil] = useState(false);
  const [contenido, setContenido] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Step 4: Dimensiones, peso y ruta
  const [largoCm, setLargoCm] = useState('');
  const [anchoCm, setAnchoCm] = useState('');
  const [altoCm, setAltoCm] = useState('');
  const [pesoDeclarado, setPesoDeclarado] = useState('');
  const [ruta, setRuta] = useState('SCZ-PQA');

  // Submit states
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [parcelCreado, setParcelCreado] = useState<Parcel | null>(null);

  // Generar código PDF417 real
  const { data: etiquetaData, loading: loadingEtiqueta } = useQuery<{ generarEtiqueta: string }>(GENERAR_ETIQUETA, {
    variables: { parcelId: parcelCreado?.id },
    skip: !parcelCreado?.id,
  });

  const RUTAS = [
    { value: 'SCZ-PQA', label: 'Santa Cruz → Puerto Quijarro' },
    { value: 'SCZ-SJC', label: 'Santa Cruz → San José de Chiquitos' },
    { value: 'SCZ-ROB', label: 'Santa Cruz → Roboré' },
    { value: 'PQA-SCZ', label: 'Puerto Quijarro → Santa Cruz' },
  ];

  // Helper local cost calculation matching backend logic
  const calculateLocalCost = () => {
    let basePrice = 30;
    let ratePerKg = 3;

    if (ruta === 'SCZ-PQA' || ruta === 'PQA-SCZ') {
      basePrice = 50;
      ratePerKg = 4;
    } else if (ruta === 'SCZ-SJC') {
      basePrice = 30;
      ratePerKg = 3;
    } else if (ruta === 'SCZ-ROB') {
      basePrice = 40;
      ratePerKg = 3.5;
    }

    const l = parseFloat(largoCm) || 0;
    const w = parseFloat(anchoCm) || 0;
    const h = parseFloat(altoCm) || 0;
    const weightVal = parseFloat(pesoDeclarado) || 0;

    const volWeight = (l * w * h) / 5000;
    const chargeableWeight = Math.max(weightVal, volWeight);
    let total = basePrice + chargeableWeight * ratePerKg;

    if (esFragil) {
      total = total * 1.2; // +20% fragile surcharge
    }

    return Math.round(total * 100) / 100;
  };

  const getVolumetricWeight = () => {
    const l = parseFloat(largoCm) || 0;
    const w = parseFloat(anchoCm) || 0;
    const h = parseFloat(altoCm) || 0;
    return Math.round(((l * w * h) / 5000) * 100) / 100;
  };

  const goNext = () => {
    const stepsOrder: Step[] = isGuest
      ? ['remitente', 'destinatario', 'categoria', 'dimensiones', 'confirmacion']
      : ['destinatario', 'categoria', 'dimensiones', 'confirmacion'];
    const idx = stepsOrder.indexOf(step);
    if (idx < stepsOrder.length - 1) setStep(stepsOrder[idx + 1]);
  };

  const goBack = () => {
    const stepsOrder: Step[] = isGuest
      ? ['remitente', 'destinatario', 'categoria', 'dimensiones', 'confirmacion']
      : ['destinatario', 'categoria', 'dimensiones', 'confirmacion'];
    const idx = stepsOrder.indexOf(step);
    if (idx > 0) setStep(stepsOrder[idx - 1]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setServerError('');
    try {
      const selectedCategory = CATEGORIAS_CONTENIDO.find((c) => c.id === categoria);
      const contentDesc = contenido.trim() || selectedCategory?.label || 'Otro';

      const result = await createParcel({
        senderName: remNombre,
        senderCi: remCi,
        senderPhone: remTelefono,
        senderEmail: remEmail,
        recipientName: destNombre,
        recipientCi: destCi,
        recipientPhone: destTelefono,
        recipientEmail: destEmail || undefined,
        content: contentDesc,
        weight: parseFloat(pesoDeclarado),
        observations: observaciones || undefined,
        routeCode: ruta,
        largoCm: largoCm ? parseFloat(largoCm) : undefined,
        anchoCm: anchoCm ? parseFloat(anchoCm) : undefined,
        altoCm: altoCm ? parseFloat(altoCm) : undefined,
        categoria: categoria as any,
        esFragil,
      });

      setParcelCreado(result);
      setStep('confirmacion');
    } catch (err: any) {
      const msg =
        err?.graphQLErrors?.[0]?.message ||
        err?.message ||
        'Error al crear la encomienda';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const allSteps: { key: Step; label: string }[] = isGuest
    ? [
        { key: 'remitente', label: 'Tus datos' },
        { key: 'destinatario', label: 'Destinatario' },
        { key: 'categoria', label: 'Contenido' },
        { key: 'dimensiones', label: 'Medidas y Ruta' },
        { key: 'confirmacion', label: 'Etiqueta' },
      ]
    : [
        { key: 'destinatario', label: 'Destinatario' },
        { key: 'categoria', label: 'Contenido' },
        { key: 'dimensiones', label: 'Medidas y Ruta' },
        { key: 'confirmacion', label: 'Etiqueta' },
      ];

  const currentIdx = allSteps.findIndex((s) => s.key === step);
  const estimatedCost = calculateLocalCost();
  const volWeight = getVolumetricWeight();
  const isVolumetric = volWeight > (parseFloat(pesoDeclarado) || 0);

  return (
    <div className={user ? 'panel-page' : 'rastreo-page'}>
      {/* Public navbar for guests */}
      {!user && (
        <nav className="rastreo-nav">
          <div className="rastreo-nav__left">
            <div className="rastreo-nav__logo">
              <Package size={20} strokeWidth={2.5} />
            </div>
            <span className="rastreo-nav__brand">
              Travell <span>Encomiendas</span>
            </span>
          </div>
          <div className="rastreo-nav__links">
            <a href="/rastreo" className="rastreo-nav__link">
              Rastrear
            </a>
            <a
              href="/enviar"
              className="rastreo-nav__link rastreo-nav__link--active"
            >
              Enviar paquete
            </a>
            <a href="/login" className="btn btn--primary btn--sm">
              Iniciar sesión
            </a>
          </div>
        </nav>
      )}

      <div className="envio-container">
        {/* Progress stepper */}
        {step !== 'confirmacion' || !parcelCreado ? (
          <div className="envio-stepper">
            {allSteps.map((s, i) => (
              <div
                key={s.key}
                className={`envio-stepper__step ${
                  i <= currentIdx ? 'envio-stepper__step--active' : ''
                } ${i < currentIdx ? 'envio-stepper__step--done' : ''}`}
              >
                <div className="envio-stepper__dot">
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                <span className="envio-stepper__label">{s.label}</span>
                {i < allSteps.length - 1 && (
                  <div className="envio-stepper__line" />
                )}
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
                Necesitamos tus datos para generar la etiqueta de tu encomienda.
              </p>
              <div className="envio-form">
                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Nombre completo *</label>
                    <input
                      className="form-input"
                      placeholder="Ej: Rosa Méndez Suárez"
                      value={remNombre}
                      onChange={(e) => setRemNombre(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cédula de identidad (CI) *</label>
                    <input
                      className="form-input"
                      placeholder="Ej: 9102778 SC"
                      value={remCi}
                      onChange={(e) => setRemCi(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Correo electrónico *</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="tu@email.com"
                      value={remEmail}
                      onChange={(e) => setRemEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input
                      className="form-input"
                      type="tel"
                      placeholder="Ej: 77012345"
                      value={remTelefono}
                      onChange={(e) => setRemTelefono(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="envio-card__actions">
                <span />
                <button
                  className="btn btn--primary"
                  onClick={goNext}
                  disabled={!remNombre || !remCi || !remEmail || !remTelefono}
                >
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
                    <input
                      className="form-input"
                      placeholder="Nombre de quien recibe"
                      value={destNombre}
                      onChange={(e) => setDestNombre(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CI del destinatario *</label>
                    <input
                      className="form-input"
                      placeholder="CI para validar entrega"
                      value={destCi}
                      onChange={(e) => setDestCi(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input
                      className="form-input"
                      type="tel"
                      placeholder="Ej: 68912345"
                      value={destTelefono}
                      onChange={(e) => setDestTelefono(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo electrónico (opcional)</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="Para avisarle al llegar"
                      value={destEmail}
                      onChange={(e) => setDestEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="envio-card__actions">
                <button className="btn btn--secondary" onClick={goBack}>
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button
                  className="btn btn--primary"
                  onClick={goNext}
                  disabled={!destNombre || !destCi || !destTelefono}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* ── Step: Categoría ───── */}
          {step === 'categoria' && (
            <>
              <h2 className="envio-card__title font-bold text-lg mb-2">Categoría del paquete</h2>
              <p className="envio-card__desc">Selecciona la categoría que mejor representa el contenido.</p>
              
              <div className="category-grid">
                {CATEGORIAS_CONTENIDO.map((cat) => (
                  <div
                    key={cat.id}
                    className={`category-card ${categoria === cat.id ? 'category-card--active' : ''}`}
                    onClick={() => setCategoria(cat.id)}
                  >
                    <span className="category-card__icon">{cat.icon}</span>
                    <span className="category-card__label">{cat.label}</span>
                  </div>
                ))}
              </div>

              <div className="envio-form" style={{ marginTop: 24 }}>
                <div className="form-group">
                  <label className="form-label">Descripción específica del contenido</label>
                  <input
                    className="form-input"
                    placeholder="Ej: Un pantalón jeans azul, dos camisas, un par de tenis"
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>
                    Opcional. Ayuda a especificar el contenido exacto para seguridad del envío.
                  </small>
                </div>

                <div className={`fragile-box ${esFragil ? 'fragile-box--active' : ''}`}>
                  <div className="fragile-box__left">
                    <span style={{ fontSize: 24 }}>⚠️</span>
                    <div>
                      <div className="fragile-box__title">Marcar como contenido frágil</div>
                      <div className="fragile-box__desc">Añade +20% al costo por manejo especial y etiquetas adicionales.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    style={{ width: 20, height: 20, cursor: 'pointer' }}
                    checked={esFragil}
                    onChange={(e) => setEsFragil(e.target.checked)}
                  />
                </div>

                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Observaciones generales (opcional)</label>
                  <input
                    className="form-input"
                    placeholder="Ej: Entregar por la tarde, caja sellada con cinta roja, etc."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </div>

              <div className="envio-card__actions">
                <button className="btn btn--secondary" onClick={goBack}>
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button className="btn btn--primary" onClick={goNext}>
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* ── Step: Dimensiones + Ruta + Costo ───── */}
          {step === 'dimensiones' && (
            <>
              <h2 className="envio-card__title">Medidas y Ruta de Envío</h2>
              <p className="envio-card__desc">Calculamos el costo de envío en base al peso y volumen.</p>

              <div className="envio-form">
                <div className="form-group">
                  <label className="form-label">Ruta de Envío *</label>
                  <select className="form-input" value={ruta} onChange={(e) => setRuta(e.target.value)}>
                    {RUTAS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Peso Real (kg) *</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Ej: 5.5"
                      value={pesoDeclarado}
                      onChange={(e) => setPesoDeclarado(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Largo (cm)</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Largo"
                      value={largoCm}
                      onChange={(e) => setLargoCm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="envio-form__row">
                  <div className="form-group">
                    <label className="form-label">Ancho (cm)</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Ancho"
                      value={anchoCm}
                      onChange={(e) => setAnchoCm(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alto (cm)</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Alto"
                      value={altoCm}
                      onChange={(e) => setAltoCm(e.target.value)}
                    />
                  </div>
                </div>

                {isVolumetric && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      background: 'rgba(59, 130, 246, 0.08)',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      color: 'var(--navy-light)',
                    }}
                  >
                    <Info size={16} />
                    <span>
                      El peso volumétrico ({volWeight} kg) supera al peso real. Se usará el peso volumétrico para la tarifa.
                    </span>
                  </div>
                )}

                {/* Live Cost Estimation Box */}
                {pesoDeclarado && parseFloat(pesoDeclarado) > 0 && (
                  <div className="cost-estimator">
                    <div className="cost-estimator__title">Costo estimado del envío</div>
                    <div className="cost-estimator__price">{estimatedCost} BOB</div>
                    <div className="cost-estimator__breakdown">
                      <div className="cost-estimator__row">
                        <span>Peso a cobrar:</span>
                        <span>{Math.max(parseFloat(pesoDeclarado) || 0, volWeight)} kg</span>
                      </div>
                      <div className="cost-estimator__row">
                        <span>Ruta base tarifa:</span>
                        <span>{ruta === 'SCZ-PQA' || ruta === 'PQA-SCZ' ? '50 BOB base + 4 BOB/kg' : '30 BOB base + 3 BOB/kg'}</span>
                      </div>
                      {esFragil && (
                        <div className="cost-estimator__row" style={{ color: '#FCD34D' }}>
                          <span>Recargo frágil (+20%):</span>
                          <span>Incluido</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {serverError && (
                <div className="taq-scan-result taq-scan-result--error" style={{ marginTop: 16 }}>
                  <AlertCircle size={18} />
                  <div>
                    <strong>Error al registrar envío</strong>
                    <span>{serverError}</span>
                  </div>
                </div>
              )}

              <div className="envio-card__actions">
                <button className="btn btn--secondary" onClick={goBack}>
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button
                  className="btn btn--gold"
                  onClick={handleSubmit}
                  disabled={loading || !pesoDeclarado || parseFloat(pesoDeclarado) <= 0}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin" /> Registrando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Registrar y generar etiqueta
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── Step: Confirmación + Etiqueta ───── */}
          {step === 'confirmacion' && parcelCreado && (
            <div className="envio-success">
              <CheckCircle2 size={48} style={{ color: '#16A34A', margin: '0 auto' }} />
              <h2 className="envio-card__title" style={{ marginTop: 12 }}>¡Envío registrado con éxito!</h2>
              <p className="envio-card__desc">
                La encomienda se ha registrado. El código de rastreo es{' '}
                <strong style={{ color: 'var(--navy)' }}>{parcelCreado.trackingNumber}</strong>.
              </p>

              <div className="envio-label">
                <div className="envio-label__header">
                  <Package size={20} /> <strong>Travell Encomiendas</strong>
                </div>
                <div className="envio-label__code">{parcelCreado.trackingNumber}</div>
                
                {/* Código PDF417 Real */}
                <div className="envio-label__barcode">
                  {loadingEtiqueta ? (
                    <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 className="spin" size={24} style={{ color: 'var(--navy)' }} />
                    </div>
                  ) : etiquetaData?.generarEtiqueta ? (
                    <img
                      src={etiquetaData.generarEtiqueta}
                      alt="PDF417 Barcode"
                      style={{ maxHeight: 70, maxWidth: '100%', margin: '12px auto', display: 'block' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--danger)', fontSize: 12, padding: 12 }}>
                      Error al generar código de barra PDF417
                    </div>
                  )}
                </div>

                <div className="envio-label__grid">
                  <div>
                    <span>Remitente</span>
                    <strong>{parcelCreado.senderName}</strong>
                  </div>
                  <div>
                    <span>Destinatario</span>
                    <strong>{parcelCreado.recipientName}</strong>
                  </div>
                  <div>
                    <span>Origen → Destino</span>
                    <strong>
                      {parcelCreado.originAddress.split(',')[0]} →{' '}
                      {parcelCreado.destinationAddress.split(',')[0]}
                    </strong>
                  </div>
                  <div>
                    <span>Categoría</span>
                    <strong>{parcelCreado.categoria || 'Otro'}</strong>
                  </div>
                  <div>
                    <span>Dimensiones</span>
                    <strong>
                      {parcelCreado.largoCm && parcelCreado.anchoCm && parcelCreado.altoCm
                        ? `${parcelCreado.largoCm}x${parcelCreado.anchoCm}x${parcelCreado.altoCm} cm`
                        : 'No especificado'}
                    </strong>
                  </div>
                  <div>
                    <span>Peso</span>
                    <strong>{parcelCreado.weight} kg</strong>
                  </div>
                  <div>
                    <span>Costo de Envío</span>
                    <strong style={{ color: 'var(--success)' }}>
                      {parcelCreado.costoEnvio ? `${parcelCreado.costoEnvio} BOB` : 'Por liquidar'}
                    </strong>
                  </div>
                  <div>
                    <span>Estado Pago</span>
                    <strong
                      style={{
                        color:
                          parcelCreado.estadoPago === 'PAGADO'
                            ? 'var(--success)'
                            : 'var(--danger)',
                      }}
                    >
                      {parcelCreado.estadoPago || 'PENDIENTE'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="envio-card__actions" style={{ justifyContent: 'center', gap: 12 }}>
                <button className="btn btn--primary" onClick={() => window.print()}>
                  <Download size={16} /> Imprimir etiqueta
                </button>
                <Link to={`/rastreo?code=${parcelCreado.trackingNumber}`} className="btn btn--secondary">
                  Rastrear envío
                </Link>
              </div>

              {isGuest && (
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 20, textAlign: 'center' }}>
                  ¿Quieres guardar un historial de tus envíos?{' '}
                  <Link
                    to="/registro"
                    style={{ color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Crea una cuenta
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
