import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Rol } from '../types';
import { Package, Eye, EyeOff, Loader2 } from 'lucide-react';

const ROLE_REDIRECTS: Record<Rol, string> = {
  [Rol.ADMINISTRADOR]: '/dashboard',
  [Rol.TAQUILLA]: '/taquilla',
  [Rol.BODEGA]: '/bodega',
  [Rol.REMITENTE]: '/seguimiento',
  [Rol.DESTINATARIO]: '/seguimiento',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user) {
        navigate(ROLE_REDIRECTS[user.rol] || '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background */}
      <div className="login-page__bg">
        <div className="login-page__bg-gradient" />
        <div className="login-page__bg-pattern" />
      </div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-card__header">
          <div className="login-card__logo">
            <Package size={36} strokeWidth={2} />
          </div>
          <h1 className="login-card__title">Travell Encomiendas</h1>
          <p className="login-card__subtitle">
            Sistema de Gestión de Paquetes
          </p>
        </div>

        {/* Form */}
        <form className="login-card__form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-card__error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="usuario@travell.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div className="form-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input form-input--with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="form-input__toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Dev credentials hint */}
        <div className="login-card__hint">
          <p className="login-card__hint-title">Cuentas de prueba:</p>
          <div className="login-card__hint-grid">
            <button
              type="button"
              className="login-card__hint-item"
              onClick={() => {
                setEmail('admin@travell.com');
                setPassword('admin123');
              }}
            >
              <span className="login-card__hint-role">Admin</span>
              <span className="login-card__hint-email">admin@travell.com</span>
            </button>
            <button
              type="button"
              className="login-card__hint-item"
              onClick={() => {
                setEmail('taquilla@travell.com');
                setPassword('taquilla123');
              }}
            >
              <span className="login-card__hint-role">Taquilla</span>
              <span className="login-card__hint-email">taquilla@travell.com</span>
            </button>
            <button
              type="button"
              className="login-card__hint-item"
              onClick={() => {
                setEmail('bodega@travell.com');
                setPassword('bodega123');
              }}
            >
              <span className="login-card__hint-role">Bodega</span>
              <span className="login-card__hint-email">bodega@travell.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
