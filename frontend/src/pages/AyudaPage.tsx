import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Rol } from '../types';
import {
  HelpCircle,
  BookOpen,
  User,
  Truck,
  Building,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  ScanBarcode,
  Users
} from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
}

interface RoleGuide {
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: string[];
  faqs: FAQ[];
}

const GUIDES: Record<string, RoleGuide> = {
  cliente: {
    title: 'Guía para Clientes',
    description: 'Aprende a registrar envíos y hacer seguimiento en tiempo real.',
    icon: <User size={20} />,
    steps: [
      'Crea una cuenta o inicia sesión para tener un historial de tus encomiendas.',
      'Registra un nuevo envío indicando remitente, destinatario, peso, dimensiones, categoría ( Pirate Ship style ) y si es frágil.',
      'Realiza el pago correspondiente en taquilla o simula el cobro en el panel de transacciones.',
      'Usa el número de tracking generado (ej: TRV-XXXX-XXXX) en la página pública para rastrear el recorrido en tiempo real.',
      'Cuando el estado de la encomienda sea "Disponible", el destinatario puede ir a retirarla con su CI.'
    ],
    faqs: [
      {
        q: '¿Cómo obtengo mi etiqueta PDF417 para impresión?',
        a: 'Una vez creada tu encomienda, desde "Mis Envíos" o al ingresar al detalle de la encomienda, verás la opción de "Generar Etiqueta". Esto creará un PDF listo para imprimir con todos los detalles codificados.',
      },
      {
        q: '¿Qué información incluye el código PDF417?',
        a: 'Codifica de forma segura el número de tracking, la ciudad de origen y destino, el nombre y CI del remitente/destinatario y detalles del contenido.',
      },
    ],
  },
  taquilla: {
    title: 'Guía para Personal de Taquilla',
    description: 'Operaciones de admisión, cobros físicos y entrega al cliente.',
    icon: <ScanBarcode size={20} />,
    steps: [
      'Recepcionar paquetes en ventanilla buscando por código de tracking o escaneando la etiqueta PDF417 con la cámara web.',
      'Confirmar que los datos de remitente y destinatario sean correctos, pesar el paquete y validar dimensiones.',
      'Pasar el estado del paquete de "Registrado" a "Recepcionado".',
      'Registrar los pagos en la pestaña de "Cobros del Día" marcando la encomienda como "Cobrada".',
      'Entregar encomiendas al cliente final verificando físicamente su Cédula de Identidad (CI) antes de marcar como "Entregado".'
    ],
    faqs: [
      {
        q: '¿Cómo funciona el escáner de la cámara web?',
        a: 'En la pestaña "Panel Taquilla", presiona "Iniciar Escaneo". Concede permisos de cámara al navegador y apunta el código PDF417 impreso. El sistema reconocerá automáticamente los datos y abrirá la encomienda.',
      },
      {
        q: '¿Qué hacer si el destinatario no tiene su CI física al retirar?',
        a: 'Por seguridad, el sistema exige ingresar el número de CI verificado. Si los datos no coinciden o no presenta la identificación, no se debe procesar la entrega en la plataforma.',
      },
    ],
  },
  bodega: {
    title: 'Guía para Personal de Bodega',
    description: 'Gestión de despachos, clasificación, carga de buses y logística.',
    icon: <Truck size={20} />,
    steps: [
      'Clasificar las encomiendas recepcionadas en ventanilla para agruparlas por destino.',
      'Seleccionar el bus asignado a la ruta correspondiente en la pestaña "Buses & Flota".',
      'Asignar las encomiendas al bus adecuado respetando el límite de capacidad de la unidad.',
      'Registrar la Carga de los paquetes al bus al momento de la partida (cambia estado a "En Tránsito").',
      'Al llegar el bus a destino, registrar la Descarga de los paquetes en la bodega local (cambia estado a "En Destino").',
      'Mover las encomiendas descargadas a los estantes físicos de entrega y marcarlas como "Disponible" en el sistema.'
    ],
    faqs: [
      {
        q: '¿Cómo sé cuántas encomiendas tiene asignadas un bus?',
        a: 'En la pestaña "Manifiestos de Carga", selecciona la placa del bus. Verás la lista completa de encomiendas asignadas, el progreso de carga actual y podrás imprimir la hoja de ruta física para el conductor.',
      },
      {
        q: '¿Qué pasa si una encomienda es frágil?',
        a: 'El detalle de la encomienda y el manifiesto mostrarán una insignia de alerta de color ámbar. Se debe dar trato prioritario y posicionarla en un área segura de la bodega o el bus.',
      },
    ],
  },
  admin: {
    title: 'Guía para Administradores',
    description: 'Supervisión general, gestión de usuarios, sucursales y reportes avanzados.',
    icon: <Building size={20} />,
    steps: [
      'Monitorear los indicadores y KPIs del Tablero General (envíos del día, estados, gráficos).',
      'Gestionar usuarios del sistema (crear cuentas para Taquilla/Bodega, editar perfiles y suspender accesos).',
      'Registrar y actualizar las oficinas en "Gestión de Sucursales".',
      'Consultar reportes de operaciones y exportar el historial a formatos imprimibles.',
      'Revisar y dar seguimiento a las alertas registradas en el Panel de Incidencias.'
    ],
    faqs: [
      {
        q: '¿Cómo suspendo a un usuario u oficina temporalmente?',
        a: 'En "Usuarios & Roles" o "Gestión de Sucursales", usa el interruptor (switch) de estado activo/inactivo. Al desactivarlo, el usuario perderá acceso inmediato al sistema y las sucursales no se mostrarán en la selección de envíos.',
      },
      {
        q: '¿Cómo se registran las coordenadas GPS en el Seguimiento en Vivo?',
        a: 'Las coordenadas GPS son transmitidas en tiempo real por el dispositivo del conductor del bus. El administrador puede visualizar el mapa en vivo en la pestaña de "Seguimiento GPS".',
      },
    ],
  },
};

export default function AyudaPage() {
  const user = useAuthStore((s) => s.user);

  // Map user role to the GUIDE key
  const getRoleKey = () => {
    if (!user) return 'cliente';
    switch (user.rol) {
      case Rol.ADMINISTRADOR: return 'admin';
      case Rol.TAQUILLA: return 'taquilla';
      case Rol.BODEGA: return 'bodega';
      case Rol.CLIENTE: return 'cliente';
      default: return 'cliente';
    }
  };

  const roleKey = getRoleKey();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const guide = GUIDES[roleKey];

  return (
    <div className="panel-page">
      <style>{`
        .ayuda-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 20px;
        }
        .ayuda-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ayuda-tab {
          width: 100%;
          justify-content: flex-start;
          text-align: left;
          padding: 10px 14px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          border: 1px solid transparent;
        }
        .ayuda-tab--active {
          background: var(--navy);
          color: white;
        }
        .ayuda-tab--inactive {
          background: white;
          color: var(--text);
          border-color: var(--border);
        }
        .ayuda-tab--inactive:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        
        .faq-item {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }
        .faq-header {
          width: 100%;
          padding: 12px 16px;
          text-align: left;
          background: #f8fafc;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          font-size: 13px;
          color: var(--navy);
          cursor: pointer;
        }
        .faq-header:hover {
          background: #f1f5f9;
        }
        .faq-body {
          padding: 14px 16px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--text);
          border-top: 1px solid var(--border);
        }
        
        @media (max-width: 768px) {
          .ayuda-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ─── Header Bar ──────────────────────── */}
      <div className="enc-header" style={{ marginBottom: 20 }}>
        <div className="enc-header__left">
          <h2 className="enc-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={24} style={{ color: 'var(--navy)' }} /> Centro de Ayuda & Guías
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Aprende a utilizar el sistema de Travell Encomiendas de acuerdo con tu rol y responsabilidades en la plataforma.
          </p>
        </div>
      </div>

      <div className="ayuda-layout" style={{ gridTemplateColumns: '1fr' }}>
        {/* Right Side: Guide Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="dashboard-panel">
            <div className="dashboard-panel__header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {guide.icon}
              <span className="dashboard-panel__title">{guide.title}</span>
            </div>
            <div className="dashboard-panel__body">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                {guide.description}
              </p>

              {/* Steps checklist */}
              <h4 style={{ fontSize: 14, fontWeight: 650, color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} /> Flujo de Trabajo / Pasos Clave
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {guide.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      background: 'var(--navy)',
                      color: 'white',
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--text)' }}>{step}</span>
                  </div>
                ))}
              </div>

              {/* FAQs Accordion */}
              <h4 style={{ fontSize: 14, fontWeight: 650, color: 'var(--navy)', marginBottom: 12 }}>Preguntas Frecuentes (FAQs)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {guide.faqs.map((faq, idx) => (
                  <div key={idx} className="faq-item">
                    <button
                      className="faq-header"
                      onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                    >
                      <span>{faq.q}</span>
                      {openFaqIdx === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {openFaqIdx === idx && (
                      <div className="faq-body">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
