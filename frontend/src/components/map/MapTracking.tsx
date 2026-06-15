import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export interface MapTrackingProps {
  /** Coordenadas del punto de origen */
  originLat: number;
  originLng: number;
  originLabel?: string;

  /** Coordenadas del punto de destino */
  destinationLat: number;
  destinationLng: number;
  destinationLabel?: string;

  /** Coordenadas actuales del bus (opcional) */
  busLat?: number;
  busLng?: number;
  busLabel?: string;

  /** Altura del contenedor */
  height?: string | number;
}

export default function MapTracking({
  originLat,
  originLng,
  originLabel = 'Origen',
  destinationLat,
  destinationLng,
  destinationLabel = 'Destino',
  busLat,
  busLng,
  busLabel = 'Bus',
  height = 320,
}: MapTrackingProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const busMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    if (!mapboxgl.accessToken) {
      setMapError('El token de Mapbox (VITE_MAPBOX_TOKEN) no está configurado en las variables de entorno de Vercel. Por favor, agréguelo en el panel de Vercel para activar el rastreo satelital.');
      return;
    }

    try {
      // Calcular centro entre origen y destino
      const centerLng = (originLng + destinationLng) / 2;
      const centerLat = (originLat + destinationLat) / 2;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [centerLng, centerLat],
        zoom: 6,
        attributionControl: false,
      });
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => {
        try {
          // ── Marcador de Origen (azul) ─────────────────────────
          const elOrigen = document.createElement('div');
          elOrigen.innerHTML = `<div style="
            width:36px;height:36px;border-radius:50%;
            background:#1B3A6B;border:3px solid #fff;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.45);
            font-size:14px;
          ">📦</div>`;
          new mapboxgl.Marker({ element: elOrigen, anchor: 'center' })
            .setLngLat([originLng, originLat])
            .setPopup(new mapboxgl.Popup({ offset: 20 }).setText(originLabel))
            .addTo(map);

          // ── Marcador de Destino (verde) ───────────────────────
          const elDest = document.createElement('div');
          elDest.innerHTML = `<div style="
            width:36px;height:36px;border-radius:50%;
            background:#16A34A;border:3px solid #fff;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.45);
            font-size:14px;
          ">🏁</div>`;
          new mapboxgl.Marker({ element: elDest, anchor: 'center' })
            .setLngLat([destinationLng, destinationLat])
            .setPopup(new mapboxgl.Popup({ offset: 20 }).setText(destinationLabel))
            .addTo(map);

          // ── Línea de ruta (origen → destino) ─────────────────
          const fallbackGeojson: any = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [originLng, originLat],
                [destinationLng, destinationLat],
              ],
            },
          };

          map.addSource('route', {
            type: 'geojson',
            data: fallbackGeojson,
          });

          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#C9A84C',
              'line-width': 2.5,
              'line-dasharray': [4, 3],
              'line-opacity': 0.75,
            },
          });

          // Intentar obtener el trazado real por carretera
          if (mapboxgl.accessToken) {
            const queryUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destinationLng},${destinationLat}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
            fetch(queryUrl)
              .then((res) => res.json())
              .then((data) => {
                if (data.routes && data.routes.length > 0) {
                  const routeGeometry = data.routes[0].geometry;
                  const routeSource = map.getSource('route') as mapboxgl.GeoJSONSource;
                  if (routeSource) {
                    routeSource.setData({
                      type: 'Feature',
                      properties: {},
                      geometry: routeGeometry,
                    });
                  }
                } else {
                  console.warn('Mapbox Directions: No se encontraron rutas por carretera. Se mantiene la línea recta.');
                }
              })
              .catch((err) => {
                console.warn('Mapbox Directions: Error al obtener ruta por carretera, usando fallback de línea recta:', err);
              });
          }

          // ── Marcador del Bus (dorado, si hay coordenadas) ─────
          if (busLat !== undefined && busLng !== undefined && !isNaN(busLat) && !isNaN(busLng)) {
            const elBus = document.createElement('div');
            elBus.innerHTML = `<div style="
              width:42px;height:42px;border-radius:50%;
              background:#C9A84C;border:3px solid #fff;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 12px rgba(201,168,76,0.7);
              font-size:18px;
              animation: pulse-bus 2s infinite;
            ">🚌</div>
            <style>
              @keyframes pulse-bus {
                0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.5)}
                50%{box-shadow:0 0 0 10px rgba(201,168,76,0)}
              }
            </style>`;
            const busMarker = new mapboxgl.Marker({ element: elBus, anchor: 'center' })
              .setLngLat([busLng, busLat])
              .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(busLabel))
              .addTo(map);
            busMarkerRef.current = busMarker;
          }

          // ── Fit map to bounds ─────────────────────────────────
          const bounds = new mapboxgl.LngLatBounds(
            [originLng, originLat],
            [destinationLng, destinationLat],
          );
          if (busLat !== undefined && busLng !== undefined && !isNaN(busLat) && !isNaN(busLng)) {
            bounds.extend([busLng, busLat]);
          }
          map.fitBounds(bounds, { padding: 60, duration: 800 });
        } catch (errInner: any) {
          console.error('Error durante la carga de elementos del mapa:', errInner);
          setMapError(`Error en elementos del mapa: ${errInner.message || errInner}`);
        }
      });
    } catch (err: any) {
      console.error('Error al inicializar Mapbox:', err);
      setMapError(`No se pudo cargar el mapa de Mapbox: ${err.message || err}`);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originLat, originLng, destinationLat, destinationLng]);

  // Actualizar posición del bus en tiempo real sin re-crear el mapa
  useEffect(() => {
    if (busMarkerRef.current && busLat !== undefined && busLng !== undefined && !isNaN(busLat) && !isNaN(busLng)) {
      busMarkerRef.current.setLngLat([busLng, busLat]);
    }
  }, [busLat, busLng]);

  if (mapError) {
    return (
      <div
        className="map-error-placeholder"
        style={{
          height,
          width: '100%',
          borderRadius: 10,
          background: 'var(--bg-card)',
          border: '1px dashed var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-secondary)',
          gap: 12
        }}
      >
        <span style={{ fontSize: 24 }}>🗺️</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Mapa de Rastreo</span>
        <p style={{ fontSize: 11, maxWidth: 360, margin: 0, lineHeight: '1.4' }}>{mapError}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="map-tracking-container"
      style={{ height, width: '100%', borderRadius: 10, overflow: 'hidden' }}
    />
  );
}
