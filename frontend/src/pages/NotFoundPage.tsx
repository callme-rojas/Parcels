import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="error-page">
      <FileQuestion size={72} strokeWidth={1.2} />
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/" className="btn btn--primary">Volver al inicio</Link>
    </div>
  );
}
