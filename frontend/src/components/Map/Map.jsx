import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  IN_TRANSIT: '#3b82f6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

export default function Map({ parcels, onParcelSelect, selectedParcel }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-60, 0],
      zoom: 2.5,
      pitch: 15,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when parcels or selection changes
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clear existing source/layers
    if (map.current.getLayer('parcel-routes')) {
      map.current.removeLayer('parcel-routes');
    }
    if (map.current.getSource('routes')) {
      map.current.removeSource('routes');
    }

    if (!parcels || parcels.length === 0) return;

    const routeFeatures = [];

    parcels.forEach((parcel) => {
      const color = STATUS_COLORS[parcel.status] || '#6366f1';
      const isSelected = selectedParcel?.id === parcel.id;

      // Origin marker
      const originEl = document.createElement('div');
      originEl.className = `map-marker origin ${isSelected ? 'selected' : ''}`;
      originEl.style.backgroundColor = color;
      originEl.innerHTML = `<span class="marker-pulse" style="border-color: ${color}"></span>`;

      const originPopup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div class="popup-content">
          <div class="popup-label">Origen</div>
          <div class="popup-title">${parcel.originAddress}</div>
          <div class="popup-tracking">${parcel.trackingNumber}</div>
        </div>
      `);

      const originMarker = new mapboxgl.Marker({ element: originEl })
        .setLngLat([parcel.originLng, parcel.originLat])
        .setPopup(originPopup)
        .addTo(map.current);

      originEl.addEventListener('click', () => onParcelSelect?.(parcel));
      markersRef.current.push(originMarker);

      // Destination marker
      const destEl = document.createElement('div');
      destEl.className = `map-marker destination ${isSelected ? 'selected' : ''}`;
      destEl.style.backgroundColor = color;

      const destPopup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div class="popup-content">
          <div class="popup-label">Destino</div>
          <div class="popup-title">${parcel.destinationAddress}</div>
          <div class="popup-tracking">${parcel.trackingNumber}</div>
        </div>
      `);

      const destMarker = new mapboxgl.Marker({ element: destEl })
        .setLngLat([parcel.destinationLng, parcel.destinationLat])
        .setPopup(destPopup)
        .addTo(map.current);

      destEl.addEventListener('click', () => onParcelSelect?.(parcel));
      markersRef.current.push(destMarker);

      // Route arc between origin and destination
      const arc = createArc(
        [parcel.originLng, parcel.originLat],
        [parcel.destinationLng, parcel.destinationLat]
      );

      routeFeatures.push({
        type: 'Feature',
        properties: { color, status: parcel.status },
        geometry: {
          type: 'LineString',
          coordinates: arc,
        },
      });
    });

    // Add route lines
    map.current.addSource('routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: routeFeatures,
      },
    });

    map.current.addLayer({
      id: 'parcel-routes',
      type: 'line',
      source: 'routes',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-opacity': 0.6,
        'line-dasharray': [2, 2],
      },
    });
  }, [parcels, mapReady, selectedParcel, onParcelSelect]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />
      {!MAPBOX_TOKEN || MAPBOX_TOKEN === 'YOUR_MAPBOX_TOKEN_HERE' ? (
        <div className="map-token-warning">
          <div className="warning-icon">🗺️</div>
          <p>
            Agrega tu <strong>Mapbox Access Token</strong> en{' '}
            <code>frontend/.env</code> para ver el mapa interactivo.
          </p>
          <code>VITE_MAPBOX_TOKEN=pk.eyJ1I...</code>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Creates a curved arc between two geographic points.
 */
function createArc(start, end, numPoints = 50) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    // Add curvature
    const altitude = Math.sin(Math.PI * t) * 10;
    points.push([lng, lat + altitude]);
  }
  return points;
}
