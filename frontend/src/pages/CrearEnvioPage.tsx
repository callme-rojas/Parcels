import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { REGISTRAR_PAGO_MUTATION } from '../graphql/mutations';
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
  const [tipoPago, setTipoPago] = useState<'REMITENTE' | 'DESTINATARIO'>('REMITENTE');
  const [metodoPago, setMetodoPago] = useState<'QR' | 'EFECTIVO'>('QR');

  const [registrarPago, { loading: payingQr }] = useMutation<any>(REGISTRAR_PAGO_MUTATION);

  const handleSimulatePayment = async (id: string) => {
    try {
      const { data } = await registrarPago({ variables: { id, metodoPago: 'QR' } });
      if (data?.registrarPago && parcelCreado) {
        setParcelCreado({
          ...parcelCreado,
          estadoPago: 'PAGADO',
          pagadoEn: data.registrarPago.pagadoEn,
        });
      }
    } catch (err: any) {
      alert(`Error al simular pago: ${err.message}`);
    }
  };

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
        tipoPago,
        metodoPago: tipoPago === 'REMITENTE' ? metodoPago : undefined,
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
              Sistema de <span>Encomiendas</span>
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
              Enviar encomienda
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

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>¿Quién cancela el costo del envío? *</label>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <button
                      type="button"
                      className={`btn ${tipoPago === 'REMITENTE' ? 'btn--primary' : 'btn--secondary'}`}
                      style={{ flex: 1, padding: '10px 8px', fontSize: 13, minWidth: 'auto' }}
                      onClick={() => setTipoPago('REMITENTE')}
                    >
                      💵 Remitente (Pago en Origen)
                    </button>
                    <button
                      type="button"
                      className={`btn ${tipoPago === 'DESTINATARIO' ? 'btn--primary' : 'btn--secondary'}`}
                      style={{ flex: 1, padding: '10px 8px', fontSize: 13, minWidth: 'auto' }}
                      onClick={() => setTipoPago('DESTINATARIO')}
                    >
                      📦 Destinatario (Al Cobro en Destino)
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                    {tipoPago === 'REMITENTE'
                      ? 'Selecciona si realizarás el pago de forma virtual o en efectivo en nuestras oficinas.'
                      : 'El destinatario deberá pagar el costo total del envío al momento de retirar el paquete.'}
                  </small>
                  
                  {tipoPago === 'REMITENTE' && (
                    <div style={{ marginTop: 12 }}>
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Método de Pago *</label>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                        <button
                          type="button"
                          className={`btn btn--sm ${metodoPago === 'QR' ? 'btn--primary' : 'btn--secondary'}`}
                          style={{ flex: 1, padding: '8px', fontSize: 12, minWidth: 'auto' }}
                          onClick={() => setMetodoPago('QR')}
                        >
                          📱 Pago con QR Simple
                        </button>
                        <button
                          type="button"
                          className={`btn btn--sm ${metodoPago === 'EFECTIVO' ? 'btn--primary' : 'btn--secondary'}`}
                          style={{ flex: 1, padding: '8px', fontSize: 12, minWidth: 'auto' }}
                          onClick={() => setMetodoPago('EFECTIVO')}
                        >
                          💵 Efectivo en Ventanilla
                        </button>
                      </div>
                    </div>
                  )}
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

              <div className="envio-disclaimer" style={{ 
                marginTop: 20, 
                padding: 14, 
                background: 'rgba(239, 68, 68, 0.05)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                textAlign: 'left'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--danger)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  ⚠️ Términos y Condiciones del Envío
                </span>
                Si el paquete no se entrega físicamente en nuestras oficinas autorizadas en origen, o si una vez llegado a su destino transcurren <strong>15 días calendario</strong> sin ser retirado por el destinatario, la encomienda se considerará automáticamente como <strong>Cancelada/Abandonada</strong> sin derecho a devoluciones ni reembolsos. Asimismo, la empresa no asume ninguna responsabilidad sobre paquetes dañados, deteriorados o perecederos no retirados a tiempo.
              </div>

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
                  <Package size={20} /> <strong>Sistema de Encomiendas</strong>
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
                    <span>Tipo de Pago</span>
                    <strong>{parcelCreado.tipoPago === 'REMITENTE' ? 'Prepago (Remitente)' : 'Al Cobro (Destinatario)'}</strong>
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

              {parcelCreado.tipoPago === 'REMITENTE' && parcelCreado.estadoPago === 'PENDIENTE' && parcelCreado.metodoPago !== 'EFECTIVO' && (
                <div className="dashboard-panel animate-fade-in" style={{ maxWidth: 450, margin: '24px auto', padding: 20, border: '1px dashed var(--accent)', background: 'var(--bg-panel)' }}>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Simulador de Pago QR Simple
                    </span>
                    <h3 style={{ fontSize: 16, color: 'var(--navy)', marginTop: 4, fontWeight: 700 }}>Escanea para Pagar el Envío</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Simula el flujo de pago inmediato utilizando un código QR estandarizado en Bolivia.</p>
                  </div>
                  
                  <div style={{ background: 'var(--bg-page)', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: '1px solid var(--border)' }}>
                    <div style={{ background: 'white', padding: 10, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <svg width="130" height="130" viewBox="0 0 100 100" style={{ display: 'block' }}>
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <rect x="5" y="5" width="25" height="25" fill="#1e293b" />
                        <rect x="9" y="9" width="17" height="17" fill="white" />
                        <rect x="12" y="12" width="11" height="11" fill="#1e293b" />
                        
                        <rect x="70" y="5" width="25" height="25" fill="#1e293b" />
                        <rect x="74" y="9" width="17" height="17" fill="white" />
                        <rect x="77" y="12" width="11" height="11" fill="#1e293b" />
                        
                        <rect x="5" y="70" width="25" height="25" fill="#1e293b" />
                        <rect x="9" y="74" width="17" height="17" fill="white" />
                        <rect x="12" y="77" width="11" height="11" fill="#1e293b" />
                        
                        <rect x="42" y="42" width="16" height="16" fill="#1e3a8a" rx="2" />
                        <circle cx="50" cy="50" r="4" fill="#fbbf24" />
                        
                        <rect x="40" y="10" width="8" height="8" fill="#475569" />
                        <rect x="55" y="15" width="6" height="6" fill="#1e293b" />
                        <rect x="45" y="25" width="12" height="6" fill="#475569" />
                        <rect x="10" y="40" width="10" height="6" fill="#1e293b" />
                        <rect x="25" y="45" width="6" height="12" fill="#475569" />
                        <rect x="15" y="58" width="12" height="8" fill="#1e293b" />
                        <rect x="70" y="40" width="15" height="6" fill="#475569" />
                        <rect x="75" y="50" width="8" height="12" fill="#1e293b" />
                        <rect x="85" y="65" width="10" height="10" fill="#475569" />
                        <rect x="40" y="70" width="6" height="14" fill="#1e293b" />
                        <rect x="52" y="75" width="14" height="6" fill="#475569" />
                        <rect x="60" y="85" width="12" height="10" fill="#1e293b" />
                        <rect x="45" y="62" width="8" height="8" fill="#1e293b" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Monto: {parcelCreado.costoEnvio?.toFixed(2)} BOB</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Vence en: 01:59 minutos</span>
                  </div>
                  
                  <div style={{ marginTop: 16 }}>
                    <button
                      className="btn btn--gold btn--full animate-pulse"
                      onClick={() => handleSimulatePayment(parcelCreado.id)}
                      disabled={payingQr}
                      style={{ gap: 8, minWidth: 'auto' }}
                    >
                      {payingQr ? <Loader2 size={16} className="spin" /> : '✓ Simular Pago QR Simple'}
                    </button>
                  </div>
                </div>
              )}

              {parcelCreado.tipoPago === 'REMITENTE' && parcelCreado.estadoPago === 'PENDIENTE' && parcelCreado.metodoPago === 'EFECTIVO' && (
                <div className="dashboard-panel animate-fade-in" style={{ maxWidth: 450, margin: '24px auto', padding: 16, background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>💵</span>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ color: 'var(--navy)', fontWeight: 700, fontSize: 14 }}>Pago Pendiente en Origen (Ventanilla)</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                        Deberá cancelar el monto de <strong>{parcelCreado.costoEnvio?.toFixed(2)} BOB</strong> en efectivo al momento de entregar físicamente el paquete en nuestras oficinas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {parcelCreado.tipoPago === 'DESTINATARIO' && (
                <div className="dashboard-panel animate-fade-in" style={{ maxWidth: 450, margin: '24px auto', padding: 16, background: 'rgba(251, 191, 36, 0.05)', border: '1px dashed rgba(251, 191, 36, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>📦</span>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ color: 'var(--navy)', fontWeight: 700, fontSize: 14 }}>Envío con Pago al Retiro (Destinatario)</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                        Esta encomienda se enviará bajo la modalidad al cobro. El destinatario registrado deberá pagar **{parcelCreado.costoEnvio?.toFixed(2)} BOB** mediante ventanilla o QR en destino para proceder con la entrega del paquete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
