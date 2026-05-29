import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Truck, Wifi, WifiOff, Play, Square, RefreshCw, MapPin, Route, AlertCircle, Database, ChevronDown, ChevronUp, Clock, Gauge } from 'lucide-react';
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
  const [intervaloSegundos, setIntervaloSegundos] = useState<number>(60);
  const [indiceRutaVisual, setIndiceRutaVisual] = useState<number>(0);
  const [colaOffline, setColaOffline] = useState<RegistrarCoordenadaBusInput[]>([]);
  
  // Métrica del punto actual del viaje
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [lastReportTime, setLastReportTime] = useState<string>('--:--:--');
  const [currentLocationName, setCurrentLocationName] = useState<string>('No iniciado');

  // Control del panel colapsable
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);
  const [historialLocal, setHistorialLocal] = useState<{ lat: number; lng: number; status: string; time: string }[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<string>('');

  const timerRef = useRef<any>(null);

  // Referencias mutables para evitar el bucle infinito y optimizar el filtrado de telemetría
  const indiceRutaRef = useRef<number>(0);
  const ultimoPuntoReportadoRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  // Calcula la distancia en metros entre dos coordenadas (Fórmula Haversine)
  const calcularDistanciaMetros = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

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

  const activeOnline = isOnline && !simularOffline;

  // Sincronizar de forma instantánea al reconectarse
  useEffect(() => {
    if (activeOnline && colaOffline.length > 0 && !syncing) {
      procesarColaSincronizacion();
    }
  }, [activeOnline, colaOffline.length]);

  // Manejar el ciclo de captura de coordenadas (SIN DEPENDER de indiceRutaVisual)
  useEffect(() => {
    if (viajeActivo && selectedBusId) {
      capturarYEnviar();

      timerRef.current = setInterval(() => {
        capturarYEnviar();
      }, intervaloSegundos * 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCurrentSpeed(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [viajeActivo, selectedBusId, origenCoordenadas, intervaloSegundos, simularOffline, isOnline]);

  // Sincronización en paralelo acelerada
  const procesarColaSincronizacion = async () => {
    if (colaOffline.length === 0 || syncing) return;
    setSyncing(true);
    setSyncProgress(`Sincronizando ${colaOffline.length} ubicaciones...`);

    const itemsToSync = [...colaOffline];

    try {
      // Envío de todas las peticiones de forma simultánea para transmisión inmediata
      await Promise.all(
        itemsToSync.map(item =>
          registrarCoordenada({
            variables: {
              input: {
                busId: item.busId,
                lat: item.lat,
                lng: item.lng,
                velocidad: item.velocidad,
                recordedAt: item.recordedAt,
              },
            },
          })
        )
      );

      const nowStr = new Date().toLocaleTimeString();
      setHistorialLocal(prev => [
        { lat: 0, lng: 0, status: `SINCRONIZADO EN LOTE (${itemsToSync.length} pts)`, time: nowStr },
        ...prev.slice(0, 19)
      ]);

      setColaOffline([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err: any) {
      console.error('Error al sincronizar cola local:', err);
    } finally {
      setSyncing(false);
      setSyncProgress('');
    }
  };

  // Capturar coordenadas
  const capturarYEnviar = () => {
    if (!selectedBusId) return;

    const timestamp = new Date().toISOString();
    const mockSpeed = Math.floor(Math.random() * 15) + 60; // Velocidad estable 60-75 km/h

    if (origenCoordenadas === 'RUTA') {
      const routeCode = selectedBus?.routeCode || 'SCZ-PQA';
      const puntos = PUNTOS_RUTA[routeCode] || PUNTOS_RUTA['SCZ-PQA'];
      
      const punto = puntos[indiceRutaRef.current];
      if (!punto) {
        setViajeActivo(false);
        setCurrentLocationName('Llegada a destino');
        alert('Viaje completado: Llegada al destino de la ruta.');
        return;
      }

      setCurrentLocationName(punto.name);
      setCurrentSpeed(mockSpeed);

      const offsetLat = (Math.random() - 0.5) * 0.001;
      const offsetLng = (Math.random() - 0.5) * 0.001;
      const lat = parseFloat((punto.lat + offsetLat).toFixed(6));
      const lng = parseFloat((punto.lng + offsetLng).toFixed(6));

      registrarPuntoGps({ busId: selectedBusId, lat, lng, velocidad: mockSpeed, recordedAt: timestamp });
      
      // Avanzar el índice de la ruta usando la referencia mutable
      indiceRutaRef.current = (indiceRutaRef.current + 1) % puntos.length;
      setIndiceRutaVisual(indiceRutaRef.current);
    } else {
      if (!navigator.geolocation) {
        alert('El GPS no está disponible en este dispositivo.');
        setOrigenCoordenadas('RUTA');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const velocidad = position.coords.speed ? Math.round(position.coords.speed * 3.6) : mockSpeed;

          setCurrentLocationName('GPS Activo Celular');
          setCurrentSpeed(velocidad);
          registrarPuntoGps({ busId: selectedBusId, lat, lng, velocidad, recordedAt: timestamp });
        },
        (error) => {
          console.error('Error GPS real:', error);
          setHistorialLocal(prev => [
            { lat: 0, lng: 0, status: `ERROR GPS: ${error.message}`, time: new Date().toLocaleTimeString() },
            ...prev.slice(0, 19)
          ]);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  // Registrar coordenada con filtros de telemetría inteligentes
  const registrarPuntoGps = async (input: RegistrarCoordenadaBusInput) => {
    const ahora = Date.now();
    const lat = input.lat;
    const lng = input.lng;
    const velocidad = input.velocidad ?? 0;
    const timeStr = new Date(input.recordedAt || '').toLocaleTimeString();

    // ── Filtro 1: Frecuencia dinámica si el bus está detenido (velocidad <= 5) ──
    if (ultimoPuntoReportadoRef.current && velocidad <= 5) {
      const minutosDesdeUltimo = (ahora - ultimoPuntoReportadoRef.current.timestamp) / 1000 / 60;
      if (minutosDesdeUltimo < 5) {
        // Ignoramos el reporte ya que el bus está detenido y no han pasado 5 minutos
        setHistorialLocal(prev => [
          { lat, lng, status: 'DETENIDO (OMITIDO)', time: timeStr },
          ...prev.slice(0, 19)
        ]);
        return;
      }
    }

    // ── Filtro 2: Filtro de distancia mínima si está en movimiento (velocidad > 5) ──
    if (ultimoPuntoReportadoRef.current && velocidad > 5) {
      const distancia = calcularDistanciaMetros(
        lat,
        lng,
        ultimoPuntoReportadoRef.current.lat,
        ultimoPuntoReportadoRef.current.lng
      );
      if (distancia < 100) {
        // Ignoramos el reporte porque se movió menos de 100 metros
        setHistorialLocal(prev => [
          { lat, lng, status: '<100m (OMITIDO)', time: timeStr },
          ...prev.slice(0, 19)
        ]);
        return;
      }
    }

    // Actualizar referencia de último punto registrado con éxito
    ultimoPuntoReportadoRef.current = { lat, lng, timestamp: ahora };
    setLastReportTime(timeStr);

    if (activeOnline) {
      try {
        await registrarCoordenada({
          variables: { input },
        });
        setHistorialLocal(prev => [
          { lat: input.lat, lng: input.lng, status: 'TRANSMITIDO', time: timeStr },
          ...prev.slice(0, 19)
        ]);
      } catch (err: any) {
        encolarPuntoOffline(input);
      }
    } else {
      encolarPuntoOffline(input);
    }
  };

  const encolarPuntoOffline = (input: RegistrarCoordenadaBusInput) => {
    const timeStr = new Date(input.recordedAt || '').toLocaleTimeString();
    setColaOffline(prev => {
      const newQueue = [...prev, input];
      
      // ── Filtro 3: Límite de tamaño de cola local (máx 300) ──
      if (newQueue.length > 300) {
        newQueue.shift(); // Elimina el reporte más antiguo
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newQueue));
      return newQueue;
    });
    setHistorialLocal(prev => [
      { lat: input.lat, lng: input.lng, status: 'COLA OFFLINE', time: timeStr },
      ...prev.slice(0, 19)
    ]);
  };

  const limpiarColaLocal = () => {
    if (window.confirm('¿Deseas vaciar las ubicaciones guardadas en la cola local?')) {
      setColaOffline([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Obtener puntos de la ruta actual
  const routeCode = selectedBus?.routeCode || 'SCZ-PQA';
  const puntos = PUNTOS_RUTA[routeCode] || PUNTOS_RUTA['SCZ-PQA'];

  return (
    <div className="chofer-dashboard" style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 8px' }}>
      
      {/* 1. Header & Network State Panel */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--navy-light)', padding: '8px', borderRadius: '8px', color: 'white', display: 'flex' }}>
              <Truck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Terminal de Ruta</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {selectedBus ? `Flota ${selectedBus.flota} (${selectedBus.placa})` : 'Dispositivo Chofer'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeOnline ? (
              <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={14} /> ONLINE
              </span>
            ) : (
              <span style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <WifiOff size={14} /> OFFLINE
              </span>
            )}
          </div>
        </div>

        {/* Toggle para pruebas de red */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Modo de Red en Ruta:</span>
          <button
            type="button"
            onClick={() => setSimularOffline(!simularOffline)}
            className={`btn btn--sm ${simularOffline ? 'btn--danger' : 'btn--secondary'}`}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {simularOffline ? 'Restaurar Red' : 'Cortar Internet'}
          </button>
        </div>
      </div>

      {/* 2. Bus Selection Card */}
      {!viajeActivo && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px', border: '1px solid var(--border)' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Selecciona tu Bus asignado
            </label>
            <select
              className="form-control"
              value={selectedBusId}
              onChange={(e) => {
                setSelectedBusId(e.target.value);
                indiceRutaRef.current = 0;
                setIndiceRutaVisual(0);
                setCurrentLocationName('Listo para iniciar');
              }}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
            >
              <option value="">-- Escoge tu placa --</option>
              {activeBuses.map((bus: Bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.flota} ({bus.placa}) - {bus.routeCode}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. Trip Status Panel (Visual, Simple & Clean) */}
      {selectedBus && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
          
          {/* Status pulsing state */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            {viajeActivo ? (
              <span className="badge badge--green" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 12px', animation: 'fadeIn 1s infinite alternate' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white', display: 'inline-block' }} />
                VIAJE EN PROGRESO
              </span>
            ) : (
              <span className="badge badge--amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 12px' }}>
                EN ESPERA DE SALIDA
              </span>
            )}
          </div>

          {/* Current Location Highlight */}
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ubicación Actual</span>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '2px 0', color: 'var(--navy)' }}>
              {currentLocationName}
            </h1>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Ruta: {selectedBus.routeLabel}
            </span>
          </div>

          {/* Stepper visual de la ruta */}
          {origenCoordenadas === 'RUTA' && (
            <div style={{ margin: '24px 0 16px 0', padding: '0 10px' }}>
              <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
                {/* Línea de progreso */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  height: '4px',
                  backgroundColor: 'var(--navy)',
                  width: `${(indiceRutaVisual / Math.max(1, puntos.length - 1)) * 100}%`,
                  borderRadius: '2px',
                  transition: 'width 0.5s ease'
                }} />

                {/* Parada inicial */}
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--navy)', border: '2px solid white', zIndex: 2, position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>SCZ</span>
                </div>

                {/* Parada intermedia */}
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: indiceRutaVisual > puntos.length / 2 ? 'var(--navy)' : 'var(--border)', 
                  border: '2px solid white', 
                  zIndex: 2, 
                  position: 'relative' 
                }}>
                  <span style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Roboré</span>
                </div>

                {/* Parada final */}
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: indiceRutaVisual === puntos.length - 1 ? 'var(--navy)' : 'var(--border)', 
                  border: '2px solid white', 
                  zIndex: 2, 
                  position: 'relative' 
                }}>
                  <span style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {routeCode.split('-')[1]}
                  </span>
                </div>

              </div>
              <div style={{ marginTop: '22px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Progreso: {indiceRutaVisual} / {puntos.length} puntos de control
              </div>
            </div>
          )}

          {/* Métrica de Velocidad y Reporte */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px', padding: '12px', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ borderRight: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Gauge size={12} /> Velocidad
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentSpeed} <span style={{ fontSize: '10px', fontWeight: 400 }}>km/h</span>
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Clock size={12} /> Último GPS
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lastReportTime}
              </span>
            </div>
          </div>

          {/* Botones Grandes de Control */}
          <div style={{ marginTop: '20px' }}>
            {!viajeActivo ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  if (!selectedBusId) {
                    alert('Debe seleccionar el bus asignado antes de iniciar el viaje.');
                    return;
                  }
                  indiceRutaRef.current = 0;
                  setIndiceRutaVisual(0);
                  setViajeActivo(true);
                }}
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: 'var(--radius)' }}
              >
                <Play size={18} fill="white" /> INICIAR TRANSMISIÓN
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => setViajeActivo(false)}
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: 'var(--radius)' }}
              >
                <Square size={18} fill="white" /> DETENER TRANSMISIÓN
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Offline Queue Banner (Floating, non-distracting) */}
      {colaOffline.length > 0 && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', border: '1px solid var(--danger-light)', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#B91C1C' }}>
            <AlertCircle size={18} />
            <span>
              <strong>{colaOffline.length} reportes guardados</strong> sin internet.
            </span>
          </div>
          {activeOnline && (
            <button
              onClick={procesarColaSincronizacion}
              disabled={syncing}
              className="btn btn--sm btn--primary"
              style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={syncing ? 'spin' : ''} /> Enviar
            </button>
          )}
        </div>
      )}

      {/* 5. Collapsible Developer Panel (Keeps main interface clean) */}
      <div className="card" style={{ padding: '12px 16px', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setShowDevPanel(!showDevPanel)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <Database size={15} />
            <span>Telemetría y Herramientas Dev</span>
          </div>
          {showDevPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {showDevPanel && (
        <div className="card" style={{ padding: '16px', borderTop: '0', borderTopLeftRadius: '0', borderTopRightRadius: '0', border: '1px solid var(--border)', marginTop: '-1px' }}>
          
          {/* Frecuencia e Input */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Origen Ubicación</label>
              <select
                className="form-control"
                value={origenCoordenadas}
                onChange={(e) => setOrigenCoordenadas(e.target.value as 'GPS' | 'RUTA')}
                disabled={viajeActivo}
                style={{ width: '100%', padding: '6px', fontSize: '11px' }}
              >
                <option value="RUTA">Ruta Simulada</option>
                <option value="GPS">GPS Celular</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Frecuencia Reporte</label>
              <select
                className="form-control"
                value={intervaloSegundos}
                onChange={(e) => setIntervaloSegundos(Number(e.target.value))}
                disabled={viajeActivo}
                style={{ width: '100%', padding: '6px', fontSize: '11px' }}
              >
                <option value={5}>Cada 5 seg (Pruebas)</option>
                <option value={10}>Cada 10 seg (Pruebas)</option>
                <option value={30}>Cada 30 seg</option>
                <option value={60}>Cada 1 min (Producción)</option>
                <option value={300}>Cada 5 min (Producción)</option>
              </select>
            </div>
          </div>

          {/* Limpieza Cola */}
          {colaOffline.length > 0 && (
            <button
              onClick={limpiarColaLocal}
              className="btn btn--sm btn--danger-outline"
              style={{ width: '100%', padding: '6px', fontSize: '11px', marginBottom: '16px' }}
            >
              Borrar Caché Local
            </button>
          )}

          {/* Historial de telemetría con ALTURA FIJA (Prevents Layout Jumping) */}
          <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Log de Ubicaciones</h4>
          <div style={{ height: '140px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-page)', padding: '6px' }}>
            {historialLocal.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '48px' }}>
                Ningún reporte transmitido aún.
              </p>
            ) : (
              historialLocal.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderBottom: '1px solid var(--border)', fontSize: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.time}</span>
                  <span style={{ fontWeight: 600, color: h.status === 'TRANSMITIDO' || h.status.includes('SINCRONIZADO') ? 'var(--success)' : 'var(--warning)' }}>
                    {h.status}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
