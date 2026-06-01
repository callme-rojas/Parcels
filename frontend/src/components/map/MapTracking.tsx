import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

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
      // Iniciamos con la línea recta como fallback seguro
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

      // Intentar obtener el trazado real por carretera desde la API de Direcciones de Mapbox
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
      if (busLat !== undefined && busLng !== undefined) {
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
      if (busLat !== undefined && busLng !== undefined) {
        bounds.extend([busLng, busLat]);
      }
      map.fitBounds(bounds, { padding: 60, duration: 800 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar posición del bus en tiempo real sin re-crear el mapa
  useEffect(() => {
    if (busMarkerRef.current && busLat !== undefined && busLng !== undefined) {
      busMarkerRef.current.setLngLat([busLng, busLat]);
    }
  }, [busLat, busLng]);

  return (
    <div
      ref={mapContainer}
      className="map-tracking-container"
      style={{ height, width: '100%', borderRadius: 10, overflow: 'hidden' }}
    />
  );
}
