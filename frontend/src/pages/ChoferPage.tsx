import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Truck, Wifi, WifiOff, Play, Square, RefreshCw, MapPin, Smartphone, Route, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { GET_BUSES } from '../graphql/queries';
import { REGISTRAR_COORDENADA_MUTATION } from '../graphql/mutations';
import type { Bus, RegistrarCoordenadaBusInput } from '../types';

// Coordenadas reales de parada en carretera de la Ruta Nacional 4 en Bolivia
const PUNTOS_RUTA: Record<string, { name: string; lat: number; lng: number }[]> = {
  'SCZ-PQA': [
    { name: 'Santa Cruz (Terminal)', lat: -17.7897, lng: -63.1594 },
    { name: 'Cotoca', lat: -17.7554, lng: -63.0645 },
    { name: 'Pailón', lat: -17.6583, lng: -62.7239 },
    { name: 'Tres Cruces', lat: -17.7812, lng: -62.1583 },
    { name: 'San José de Chiquitos', lat: -17.8427, lng: -60.7423 },
    { name: 'Taperas', lat: -17.9547, lng: -60.1254 },
    { name: 'Roboré', lat: -18.3341, lng: -59.7548 },
    { name: 'Santiago de Chiquitos', lat: -18.3414, lng: -59.5992 },
    { name: 'El Carmen Rivero Torres', lat: -18.8242, lng: -58.6253 },
    { name: 'Puerto Suárez', lat: -18.9669, lng: -57.7972 },
    { name: 'Puerto Quijarro (Frontera)', lat: -19.0069, lng: -57.7289 },
  ],
  'SCZ-ROB': [
    { name: 'Santa Cruz (Terminal)', lat: -17.7897, lng: -63.1594 },
    { name: 'Cotoca', lat: -17.7554, lng: -63.0645 },
    { name: 'Pailón', lat: -17.6583, lng: -62.7239 },
    { name: 'Tres Cruces', lat: -17.7812, lng: -62.1583 },
    { name: 'San José de Chiquitos', lat: -17.8427, lng: -60.7423 },
    { name: 'Roboré (Terminal)', lat: -18.3341, lng: -59.7548 },
  ],
  'SCZ-SJC': [
    { name: 'Santa Cruz (Terminal)', lat: -17.7897, lng: -63.1594 },
    { name: 'Cotoca', lat: -17.7554, lng: -63.0645 },
    { name: 'Pailón', lat: -17.6583, lng: -62.7239 },
    { name: 'San José de Chiquitos (Terminal)', lat: -17.8427, lng: -60.7423 },
  ],
  'PQA-SCZ': [
    { name: 'Puerto Quijarro (Terminal)', lat: -19.0069, lng: -57.7289 },
    { name: 'Puerto Suárez', lat: -18.9669, lng: -57.7972 },
    { name: 'El Carmen Rivero Torres', lat: -18.8242, lng: -58.6253 },
    { name: 'Roboré', lat: -18.3341, lng: -59.7548 },
    { name: 'San José de Chiquitos', lat: -17.8427, lng: -60.7423 },
    { name: 'Tres Cruces', lat: -17.7812, lng: -62.1583 },
    { name: 'Pailón', lat: -17.6583, lng: -62.7239 },
    { name: 'Cotoca', lat: -17.7554, lng: -63.0645 },
    { name: 'Santa Cruz (Terminal)', lat: -17.7897, lng: -63.1594 },
  ],
};

const LOCAL_STORAGE_KEY = 'travell_offline_gps_queue';

export default function ChoferPage() {
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [simularOffline, setSimularOffline] = useState<boolean>(false);
  const [viajeActivo, setViajeActivo] = useState<boolean>(false);
  const [origenCoordenadas, setOrigenCoordenadas] = useState<'GPS' | 'RUTA'>('RUTA');
  const [intervaloSegundos, setIntervaloSegundos] = useState<number>(10);
  const [indiceRuta, setIndiceRuta] = useState<number>(0);
  const [colaOffline, setColaOffline] = useState<RegistrarCoordenadaBusInput[]>([]);
  const [ultimaCoordenada, setUltimaCoordenada] = useState<{ lat: number; lng: number; time: string } | null>(null);
  const [historialLocal, setHistorialLocal] = useState<{ lat: number; lng: number; status: string; time: string }[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<string>('');

  const timerRef = useRef<any>(null);

  // Obtener lista de buses para el selector
  const { data: busesData, loading: loadingBuses } = useQuery<{ buses: Bus[] }>(GET_BUSES, {
    fetchPolicy: 'network-only',
  });

  const activeBuses = busesData?.buses || [];
  const selectedBus = activeBuses.find((b: Bus) => b.id === selectedBusId);

  // Mutación para enviar coordenadas al backend
  const [registrarCoordenada] = useMutation(REGISTRAR_COORDENADA_MUTATION);

  // Detectar estado de internet real
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar cola offline inicial
    const savedQueue = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedQueue) {
      try {
        setColaOffline(JSON.parse(savedQueue));
      } catch (e) {
        console.error('Error al cargar la cola de coordenadas offline:', e);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determinar si la app está operando en modo online u offline
  const activeOnline = isOnline && !simularOffline;

  // Sincronizar cola local cuando se reconecte
  useEffect(() => {
    if (activeOnline && colaOffline.length > 0 && !syncing) {
      procesarColaSincronizacion();
    }
  }, [activeOnline, colaOffline.length]);

  // Manejar el ciclo de captura de coordenadas
  useEffect(() => {
    if (viajeActivo && selectedBusId) {
      // Iniciar primera captura de inmediato
      capturarYEnviar();

      // Configurar intervalo para siguientes capturas
      timerRef.current = setInterval(() => {
        capturarYEnviar();
      }, intervaloSegundos * 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [viajeActivo, selectedBusId, origenCoordenadas, intervaloSegundos, indiceRuta, simularOffline, isOnline]);

  // Sincronizar cola local en lote secuencial
  const procesarColaSincronizacion = async () => {
    setSyncing(true);
    const itemsToSync = [...colaOffline];
    const total = itemsToSync.length;
    
    setSyncProgress(`Sincronizando ${total} coordenadas pendientes...`);
    
    let successCount = 0;
    const remainingItems: RegistrarCoordenadaBusInput[] = [];

    for (let i = 0; i < total; i++) {
      const item = itemsToSync[i];
      setSyncProgress(`Enviando punto ${i + 1} de ${total}...`);
      try {
        await registrarCoordenada({
          variables: {
            input: {
              busId: item.busId,
              lat: item.lat,
              lng: item.lng,
              velocidad: item.velocidad,
              recordedAt: item.recordedAt,
            },
          },
        });
        successCount++;
        // Agregar al historial visual
        setHistorialLocal(prev => [
          { lat: item.lat, lng: item.lng, status: 'SINCRONIZADO', time: new Date(item.recordedAt || '').toLocaleTimeString() },
          ...prev.slice(0, 19)
        ]);
      } catch (err) {
        console.error('Error al sincronizar punto offline:', err);
        // Si falla (por ejemplo, el server está caído), detenemos la sincronización y guardamos los restantes
        remainingItems.push(...itemsToSync.slice(i));
        break;
      }
    }

    setColaOffline(remainingItems);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remainingItems));
    setSyncing(false);
    setSyncProgress('');

    if (successCount > 0) {
      alert(`Sincronización completa: ${successCount} coordenadas transmitidas al servidor con éxito.`);
    }
  };

  // Función núcleo de captura y almacenamiento
  const capturarYEnviar = () => {
    if (!selectedBusId) return;

    const timestamp = new Date().toISOString();
    const mockSpeed = Math.floor(Math.random() * 30) + 50; // Velocidad simulada entre 50 y 80 km/h

    if (origenCoordenadas === 'RUTA') {
      // Usar coordenadas precargadas de la ruta nacional
      const routeCode = selectedBus?.routeCode || 'SCZ-PQA';
      const puntos = PUNTOS_RUTA[routeCode] || PUNTOS_RUTA['SCZ-PQA'];
      
      const punto = puntos[indiceRuta];
      if (!punto) {
        // Fin de ruta, reiniciar o detener
        setViajeActivo(false);
        alert('Viaje completado: Llegada al destino de la ruta.');
        return;
      }

      // Añadir una pequeña vibración/offset aleatorio de coordenadas para que no sea idéntico en pruebas
      const offsetLat = (Math.random() - 0.5) * 0.003;
      const offsetLng = (Math.random() - 0.5) * 0.003;
      const lat = parseFloat((punto.lat + offsetLat).toFixed(6));
      const lng = parseFloat((punto.lng + offsetLng).toFixed(6));

      registrarPuntoGps({ busId: selectedBusId, lat, lng, velocidad: mockSpeed, recordedAt: timestamp });
      
      // Avanzar al siguiente punto
      setIndiceRuta(prev => (prev + 1) % puntos.length);
    } else {
      // Usar GPS real del celular (Android/HTML5 Navigator)
      if (!navigator.geolocation) {
        alert('El servicio de Geolocalización GPS no está disponible en este dispositivo.');
        setOrigenCoordenadas('RUTA');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const velocidad = position.coords.speed ? parseFloat((position.coords.speed * 3.6).toFixed(1)) : mockSpeed;

          registrarPuntoGps({ busId: selectedBusId, lat, lng, velocidad, recordedAt: timestamp });
        },
        (error) => {
          console.error('Error al capturar ubicación GPS real:', error);
          // Registrar en historial con error
          setHistorialLocal(prev => [
            { lat: 0, lng: 0, status: `ERROR GPS: ${error.message}`, time: new Date().toLocaleTimeString() },
            ...prev.slice(0, 19)
          ]);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  // Guardar ubicación localmente o enviarla al servidor
  const registrarPuntoGps = async (input: RegistrarCoordenadaBusInput) => {
    const timeStr = new Date(input.recordedAt || '').toLocaleTimeString();
    setUltimaCoordenada({ lat: input.lat, lng: input.lng, time: timeStr });

    if (activeOnline) {
      // Envío directo en tiempo real
      try {
        await registrarCoordenada({
          variables: { input },
        });
        setHistorialLocal(prev => [
          { lat: input.lat, lng: input.lng, status: 'ENVIADO (ONLINE)', time: timeStr },
          ...prev.slice(0, 19)
        ]);
      } catch (err: any) {
        console.error('Error enviando coordenada online, derivando a cola local:', err);
        encolarPuntoOffline(input);
      }
    } else {
      // Guardar en cola local por falta de conexión
      encolarPuntoOffline(input);
    }
  };

  const encolarPuntoOffline = (input: RegistrarCoordenadaBusInput) => {
    const timeStr = new Date(input.recordedAt || '').toLocaleTimeString();
    setColaOffline(prev => {
      const newQueue = [...prev, input];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newQueue));
      return newQueue;
    });
    setHistorialLocal(prev => [
      { lat: input.lat, lng: input.lng, status: 'ALMACENADO (OFFLINE)', time: timeStr },
      ...prev.slice(0, 19)
    ]);
  };

  const limpiarColaLocal = () => {
    if (window.confirm('¿Está seguro de que desea limpiar la cola de ubicaciones guardadas localmente? Se perderán estos reportes.')) {
      setColaOffline([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <div className="chofer-simulator container" style={{ maxWidth: '600px', padding: '16px 8px' }}>
      {/* Cabecera Móvil del Chofer */}
      <div className="card" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #0e1e38 0%, #15294a 100%)', borderColor: '#1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#1e293b', padding: '10px', borderRadius: '12px', border: '1px solid #334155' }}>
              <Truck size={24} style={{ color: '#E5A100' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700, color: '#f1f5f9' }}>Terminal de Chofer</h2>
              <p style={{ fontSize: '12px', margin: 0, color: '#94a3b8' }}>Rastreo GPS y Sincronización</p>
            </div>
          </div>

          {/* Indicador gigante de estado de red */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {activeOnline ? (
              <span className="badge badge--green" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, padding: '4px 8px' }}>
                <Wifi size={14} /> ONLINE
              </span>
            ) : (
              <span className="badge badge--red" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, padding: '4px 8px' }}>
                <WifiOff size={14} /> OFFLINE
              </span>
            )}
            {simularOffline && (
              <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>Simulado</span>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Configuración y Simulación de Señal */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px', borderColor: '#1e293b' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={16} /> Configuración de Red e Dispositivo
        </h3>
        
        {/* Toggle para forzar offline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '8px 12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', display: 'block' }}>Simular Corte de Señal</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Fuerza el guardado local sin internet</span>
          </div>
          <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
            <input 
              type="checkbox" 
              checked={simularOffline}
              onChange={(e) => setSimularOffline(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span className="slider" style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: simularOffline ? '#ef4444' : '#334155', borderRadius: '34px',
              transition: '0.4s'
            }}>
              <span style={{
                position: 'absolute', content: '""', height: '18px', width: '18px', left: simularOffline ? '26px' : '4px', bottom: '4px',
                backgroundColor: 'white', transition: '0.4s', borderRadius: '50%'
              }} />
            </span>
          </label>
        </div>

        {/* Selector de Bus */}
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Bus / Flota Asignada</label>
          <select 
            className="form-control" 
            value={selectedBusId}
            onChange={(e) => {
              setSelectedBusId(e.target.value);
              setIndiceRuta(0); // Reiniciar ruta al cambiar de bus
            }}
            disabled={viajeActivo || loadingBuses}
            style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: '8px' }}
          >
            <option value="">-- Seleccione su Placa / Flota --</option>
            {activeBuses.map((bus: Bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.flota} ({bus.placa}) - Ruta: {bus.routeCode}
              </option>
            ))}
          </select>
          {loadingBuses && <span style={{ fontSize: '11px', color: '#64748b' }}>Cargando flotas activas...</span>}
        </div>

        {/* Detalle del bus seleccionado */}
        {selectedBus && (
          <div style={{ padding: '8px 12px', background: '#1e293b', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
            <strong>Ruta:</strong> {selectedBus.routeLabel} <br/>
            <strong>Conductor:</strong> {selectedBus.conductor || 'No asignado'} | <strong>Estado:</strong> {selectedBus.estado}
          </div>
        )}
      </div>

      {/* Controles de Viaje */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px', borderColor: '#1e293b' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Route size={16} /> Controles del GPS del Viaje
        </h3>

        {/* Origen de Coordenadas */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button 
            type="button"
            className={`btn ${origenCoordenadas === 'RUTA' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setOrigenCoordenadas('RUTA')}
            disabled={viajeActivo}
            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Route size={16} /> Simular Trayecto
          </button>
          <button 
            type="button"
            className={`btn ${origenCoordenadas === 'GPS' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setOrigenCoordenadas('GPS')}
            disabled={viajeActivo}
            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Smartphone size={16} /> GPS Real
          </button>
        </div>

        {/* Frecuencia de reporte */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Intervalo de Reporte GPS</label>
          <select
            className="form-control"
            value={intervaloSegundos}
            onChange={(e) => setIntervaloSegundos(Number(e.target.value))}
            disabled={viajeActivo}
            style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: '8px' }}
          >
            <option value={5}>Cada 5 segundos (Pruebas rápidas)</option>
            <option value={10}>Cada 10 segundos</option>
            <option value={30}>Cada 30 segundos</option>
            <option value={60}>Cada 1 minuto (Normal en ruta)</option>
          </select>
        </div>

        {/* Botón Gigante Iniciar / Parar */}
        {!viajeActivo ? (
          <button
            className="btn btn--primary"
            onClick={() => {
              if (!selectedBusId) {
                alert('Debe seleccionar el bus asignado antes de iniciar el viaje.');
                return;
              }
              setViajeActivo(true);
            }}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: '12px',
              backgroundColor: '#16A34A',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
            }}
          >
            <Play size={20} fill="white" /> INICIAR VIAJE
          </button>
        ) : (
          <button
            className="btn btn--danger"
            onClick={() => setViajeActivo(false)}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: '12px',
              backgroundColor: '#DC2626',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
            }}
          >
            <Square size={20} fill="white" /> DETENER VIAJE
          </button>
        )}
      </div>

      {/* Monitor de Cola Offline */}
      {colaOffline.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', borderColor: '#ef4444', backgroundColor: '#1a0f0f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} style={{ color: '#ef4444' }} />
              <div>
                <strong style={{ color: '#f87171', fontSize: '13px', display: 'block' }}>Reportes Offline Acumulados</strong>
                <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700 }}>
                  {colaOffline.length} ubicaciones en memoria local
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeOnline && (
                <button 
                  className="btn btn--sm btn--primary" 
                  onClick={procesarColaSincronizacion}
                  disabled={syncing}
                  style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> Sincronizar
                </button>
              )}
              <button 
                className="btn btn--sm btn--danger-outline" 
                onClick={limpiarColaLocal}
                disabled={syncing}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                Limpiar
              </button>
            </div>
          </div>
          {syncProgress && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #ef4444', fontSize: '11px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={12} className="animate-spin" /> {syncProgress}
            </div>
          )}
        </div>
      )}

      {/* Última ubicación capturada */}
      {ultimaCoordenada && (
        <div className="card" style={{ marginBottom: '16px', padding: '16px', borderColor: '#1e293b' }}>
          <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} /> Última Ubicación Reportada
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Latitud</span>
              <strong style={{ fontSize: '14px', color: '#f1f5f9' }}>{ultimaCoordenada.lat}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Longitud</span>
              <strong style={{ fontSize: '14px', color: '#f1f5f9' }}>{ultimaCoordenada.lng}</strong>
            </div>
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid #1e293b', paddingTop: '8px', marginTop: '4px', fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Capturado a las: {ultimaCoordenada.time}</span>
              <span style={{ color: activeOnline ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {activeOnline ? 'Transmitido' : 'En cola local'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Registro local reciente */}
      <div className="card" style={{ padding: '16px', borderColor: '#1e293b' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#cbd5e1', fontWeight: 600 }}>
          Historial de Eventos Recientes (Dispositivo)
        </h3>
        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {historialLocal.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '16px 0' }}>
              No se han registrado eventos en este turno.
            </p>
          ) : (
            historialLocal.map((h, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '6px 10px', 
                  background: '#0f172a', 
                  borderRadius: '6px', 
                  fontSize: '11px',
                  borderLeft: `3px solid ${
                    h.status.includes('ONLINE') || h.status.includes('SINCRONIZADO') ? '#22c55e' : h.status.includes('OFFLINE') ? '#ef4444' : '#eab308'
                  }`
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#e2e8f0', marginRight: '8px' }}>{h.time}</span>
                  <span style={{ color: '#94a3b8' }}>({h.lat}, {h.lng})</span>
                </div>
                <span style={{ 
                  fontWeight: 700, 
                  color: h.status.includes('ONLINE') || h.status.includes('SINCRONIZADO') ? '#22c55e' : h.status.includes('OFFLINE') ? '#ef4444' : '#eab308' 
                }}>
                  {h.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
