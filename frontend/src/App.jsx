import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_PARCELS } from './graphql/queries';
import Map from './components/Map/Map';
import ParcelList from './components/ParcelList/ParcelList';
import './index.css';

function App() {
  const { data, loading, error } = useQuery(GET_ALL_PARCELS);
  const [selectedParcel, setSelectedParcel] = useState(null);

  const parcels = data?.parcels || [];

  const statusCounts = parcels.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">📦</div>
          <div>
            <div className="header-title">Travell Encomiendas</div>
            <div className="header-subtitle">Sistema de Rastreo de Paquetes</div>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            ⏳ Pendientes <span className="stat-value">{statusCounts.PENDING || 0}</span>
          </div>
          <div className="stat-chip">
            🚚 En Tránsito <span className="stat-value">{statusCounts.IN_TRANSIT || 0}</span>
          </div>
          <div className="stat-chip">
            ✅ Entregados <span className="stat-value">{statusCounts.DELIVERED || 0}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        {/* Sidebar - Parcel List */}
        <aside className="sidebar">
          <ParcelList
            parcels={parcels}
            loading={loading}
            error={error}
            selectedParcel={selectedParcel}
            onParcelSelect={setSelectedParcel}
          />
        </aside>

        {/* Map */}
        <section className="map-area">
          <Map
            parcels={parcels}
            selectedParcel={selectedParcel}
            onParcelSelect={setSelectedParcel}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
