import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Package, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(nombre, email, password, telefono || undefined);
      navigate('/mis-envios', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__bg">
        <div className="login-page__bg-gradient" />
        <div className="login-page__bg-pattern" />
      </div>

      <div className="login-card" style={{ maxWidth: 460 }}>
        <div className="login-card__header">
          <div className="login-card__logo">
            <UserPlus size={32} strokeWidth={2} />
          </div>
          <h1 className="login-card__title">Crear Cuenta</h1>
          <p className="login-card__subtitle">
            Regístrate para enviar y rastrear tus encomiendas
          </p>
        </div>

        <form className="login-card__form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-card__error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nombre" className="form-label">Nombre completo</label>
            <input id="nombre" type="text" className="form-input" placeholder="Ej: Rosa Méndez Suárez"
              value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Correo electrónico</label>
            <input id="reg-email" type="email" className="form-input" placeholder="tu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="telefono" className="form-label">Teléfono (opcional)</label>
            <input id="telefono" type="tel" className="form-input" placeholder="+591 7XXX-XXXX"
              value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Contraseña</label>
            <div className="form-input-wrapper">
              <input id="reg-password" type={showPassword ? 'text' : 'password'}
                className="form-input form-input--with-icon" placeholder="Mínimo 6 caracteres"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="form-input__toggle"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">Confirmar contraseña</label>
            <input id="confirm-password" type={showPassword ? 'text' : 'password'}
              className="form-input" placeholder="Repite tu contraseña"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? (<><Loader2 size={18} className="spin" /> Creando cuenta...</>) : 'Crear Cuenta'}
          </button>
        </form>

        <div className="login-card__hint" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#6B7280' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#1B3A6B', fontWeight: 600, textDecoration: 'none' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
