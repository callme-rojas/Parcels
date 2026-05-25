import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'scanner-video-container';

  // Request cameras list
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Auto-select back camera if possible, or the first camera
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMsg('No se detectaron cámaras en este dispositivo.');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setErrorMsg('Permiso de cámara denegado o error de hardware.');
      });

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = (cameraId: string) => {
    if (!cameraId) return;
    
    // Stop any existing scanner session first
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setIsScanning(false);
        initScanner(cameraId);
      }).catch(err => {
        console.error('Error resetting scanner:', err);
        initScanner(cameraId);
      });
    } else {
      initScanner(cameraId);
    }
  };

  const initScanner = (cameraId: string) => {
    const html5Qrcode = new Html5Qrcode(elementId);
    scannerRef.current = html5Qrcode;
    setIsScanning(true);
    setErrorMsg('');

    html5Qrcode
      .start(
        cameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            // Stylized scanning box
            const size = Math.min(width, height) * 0.8;
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          // Success
          html5Qrcode.stop().then(() => {
            scannerRef.current = null;
            setIsScanning(false);
            onScanSuccess(decodedText);
          }).catch(err => {
            console.error('Error stopping scanner on success:', err);
            onScanSuccess(decodedText);
          });
        },
        () => {
          // ignore scan frame errors
        }
      )
      .catch((err) => {
        console.error('Error starting scanner:', err);
        setErrorMsg('Error al iniciar la cámara. Puede que esté ocupada por otra app.');
        setIsScanning(false);
      });
  };

  const stopScanning = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
          setIsScanning(false);
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err);
        });
    } else {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedCameraId) {
      const t = setTimeout(() => startScanning(selectedCameraId), 300);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedCameraId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal__header">
          <h3>Escanear Código de Barra</h3>
          <button className="modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal__body" style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Coloque el código de la etiqueta frente a la cámara para escanear.
          </p>

          {/* Visor de Cámara */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/3',
              background: '#000',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
            }}
          >
            <div id={elementId} style={{ width: '100%', height: '100%' }} />

            {/* Guías de Escaneo Animadas (Laser Scan Effect) */}
            {isScanning && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    right: '10%',
                    bottom: '10%',
                    border: '2px dashed rgba(229, 161, 0, 0.8)',
                    borderRadius: 8,
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                  }}
                />
                {/* Laser line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '12%',
                    right: '12%',
                    height: 2,
                    background: '#E5A100',
                    boxShadow: '0 0 8px #E5A100',
                    animation: 'scanner-laser 2s infinite ease-in-out',
                    pointerEvents: 'none',
                  }}
                />
              </>
            )}

            {!isScanning && !errorMsg && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>
                <Loader2 className="spin" size={24} style={{ color: 'var(--gold)' }} />
                <span style={{ marginLeft: 8 }}>Iniciando cámara...</span>
              </div>
            )}

            {errorMsg && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 20, background: 'rgba(0,0,0,0.85)' }}>
                <AlertTriangle size={36} style={{ color: '#EF4444', marginBottom: 8 }} />
                <span style={{ fontSize: 13, textAlign: 'center' }}>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Selector de cámara */}
          {cameras.length > 1 && (
            <div className="form-group" style={{ marginTop: 16, textAlign: 'left' }}>
              <label className="form-label">Seleccionar Cámara</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="form-input"
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Cámara ${c.id}`}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn--secondary"
                  onClick={() => startScanning(selectedCameraId)}
                  title="Reiniciar cámara"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary btn--full" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
