import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  ClipboardList,
  Truck,
  Printer,
  MapPin,
  AlertCircle,
  Loader2,
  Package,
  FileText,
  User,
  Activity
} from 'lucide-react';
import { GET_BUSES, GET_PARCELS } from '../graphql/queries';
import { RUTAS_DISPONIBLES } from '../types';
import type { Bus, Parcel } from '../types';

export default function ManifiestosPage() {
  const [selectedBusId, setSelectedBusId] = useState<string>('');

  // Fetch buses
  const { data: busesData, loading: loadingBuses, error: errorBuses } = useQuery<{ buses: Bus[] }>(GET_BUSES, {
    fetchPolicy: 'cache-and-network',
  });

  // Fetch parcels
  const { data: parcelsData, loading: loadingParcels, error: errorParcels } = useQuery<{ parcels: Parcel[] }>(GET_PARCELS, {
    fetchPolicy: 'cache-and-network',
  });

  const buses = busesData?.buses || [];
  const parcels = parcelsData?.parcels || [];

  // Filter buses that have route code
  const activeBuses = useMemo(() => {
    return buses.filter((b) => b.activo);
  }, [buses]);

  // Set default selected bus once loaded
  useMemo(() => {
    if (activeBuses.length > 0 && !selectedBusId) {
      setSelectedBusId(activeBuses[0].id);
    }
  }, [activeBuses, selectedBusId]);

  // Selected bus object
  const selectedBus = useMemo(() => {
    return activeBuses.find((b) => b.id === selectedBusId) || null;
  }, [activeBuses, selectedBusId]);

  // Filter parcels assigned to selected bus
  const assignedParcels = useMemo(() => {
    if (!selectedBusId) return [];
    return parcels.filter((p) => p.assignedBusId === selectedBusId);
  }, [parcels, selectedBusId]);

  const handlePrint = () => {
    window.print();
  };

  const getRouteLabel = (code: string) => {
    return RUTAS_DISPONIBLES.find((r) => r.value === code)?.label || code;
  };

  const loadPercentage = useMemo(() => {
    if (!selectedBus) return 0;
    const capacity = selectedBus.capacidad || 30;
    const loaded = assignedParcels.length;
    return Math.min(100, Math.round((loaded / capacity) * 100));
  }, [selectedBus, assignedParcels]);

  return (
    <div className="panel-page">
      <style>{`
        /* Print layout for Manifest */
        @media print {
          body * {
            visibility: hidden;
          }
          .manifest-print-area, .manifest-print-area * {
            visibility: visible;
          }
          .manifest-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            color: #000 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
        
        .manifest-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .manifest-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ─── Header Bar ──────────────────────── */}
      <div className="enc-header no-print" style={{ marginBottom: 20 }}>
        <div className="enc-header__left">
          <h2 className="enc-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={24} style={{ color: 'var(--navy)' }} /> Manifiestos de Carga
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Consulta la asignación de encomiendas por bus y genera las hojas de ruta impresas oficiales para el conductor.
          </p>
        </div>
        {selectedBus && assignedParcels.length > 0 && (
          <div className="enc-header__actions">
            <button className="btn btn--primary" onClick={handlePrint}>
              <Printer size={16} /> Imprimir Manifiesto
            </button>
          </div>
        )}
      </div>

      {/* ─── Errors ──────────────────────────── */}
      {(errorBuses || errorParcels) && (
        <div className="taq-scan-result taq-scan-result--error no-print" style={{ marginBottom: 16 }}>
          <AlertCircle size={18} />
          <div>
            <strong>Error al sincronizar datos</strong>
            <span>{errorBuses?.message || errorParcels?.message}</span>
          </div>
        </div>
      )}

      {/* ─── Main Grid Layout ────────────────── */}
      <div className="manifest-grid no-print">
        {/* Left Side: Bus Selection */}
        <div className="dashboard-panel" style={{ height: 'fit-content' }}>
          <div className="dashboard-panel__header">
            <span className="dashboard-panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={16} /> Seleccionar Unidad
            </span>
          </div>
          <div className="dashboard-panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loadingBuses ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 className="spin" size={18} style={{ display: 'inline-block', marginRight: 6 }} /> Cargando buses...
              </div>
            ) : activeBuses.length === 0 ? (
              <div style={{ padding: 12, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                No hay buses activos registrados en el sistema.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Unidades Disponibles</label>
                {activeBuses.map((bus) => (
                  <button
                    key={bus.id}
                    className={`btn ${selectedBusId === bus.id ? 'btn--primary' : 'btn--secondary'}`}
                    style={{
                      justifyContent: 'flex-start',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                    onClick={() => setSelectedBusId(bus.id)}
                  >
                    <Truck size={16} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 700 }}>{bus.placa}</span>
                      <span style={{ fontSize: 11, opacity: 0.8 }}>{bus.flota}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Manifest Sheet Preview */}
        <div className="dashboard-panel">
          {!selectedBus ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Selecciona una unidad de bus a la izquierda para ver su manifiesto.
            </div>
          ) : (
            <>
              <div className="dashboard-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="dashboard-panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} /> Vista Previa del Manifiesto
                </span>
                <span className="badge badge--blue" style={{ fontSize: 11 }}>
                  Estado Bus: {selectedBus.estado}
                </span>
              </div>
              <div className="dashboard-panel__body">
                {/* Bus Metrics Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ruta del Bus</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {getRouteLabel(selectedBus.routeCode)}
                    </span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Conductor Asignado</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} /> {selectedBus.conductor || 'No asignado'}
                    </span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Progreso de Carga</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                        {assignedParcels.length} / {selectedBus.capacidad || 30}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({loadPercentage}%)</span>
                    </div>
                    <div style={{ marginTop: 6, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--navy)', width: `${loadPercentage}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>

                {/* Loading list of parcels */}
                <h4 style={{ fontSize: 14, fontWeight: 650, color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={14} /> Detalle de Carga de Encomiendas
                </h4>
                {loadingParcels ? (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 className="spin" size={18} style={{ display: 'inline-block', marginRight: 6 }} /> Cargando encomiendas...
                  </div>
                ) : assignedParcels.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 8 }}>
                    No hay encomiendas cargadas o asignadas a esta unidad para hoy.
                  </div>
                ) : (
                  <table className="data-table" style={{ border: '1px solid var(--border)' }}>
                    <thead>
                      <tr>
                        <th>Código Tracking</th>
                        <th>Destinatario</th>
                        <th>Destino</th>
                        <th style={{ width: 80, textAlign: 'center' }}>Peso</th>
                        <th style={{ width: 110, textAlign: 'center' }}>Estado Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedParcels.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <span className="data-table__code">{p.trackingNumber}</span>
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 600 }}>{p.recipientName}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            <span className="data-table__route">{p.destinationAddress.split(',')[0]}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.weight} kg</td>
                          <td style={{ textAlign: 'center' }}>
                            {p.estadoPago === 'PAGADO' ? (
                              <span className="badge badge--green">Sí</span>
                            ) : (
                              <span className="badge badge--amber">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Printable Manifest Area (Only Visible when printing) ─── */}
      {selectedBus && (
        <div className="manifest-print-area" style={{ display: 'none' }}>
          <div style={{ borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>TRAVELL ENCOMIENDAS</h1>
              <span style={{ fontSize: 12, color: '#333' }}>Manifiesto de Carga y Hoja de Ruta Oficial</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 14, fontWeight: 700, display: 'block' }}>PLACA: {selectedBus.placa}</span>
              <span style={{ fontSize: 12, color: '#333' }}>Flota: {selectedBus.flota || '—'}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', width: '15%', fontWeight: 700 }}>Ruta:</td>
                <td style={{ padding: '6px 0', width: '35%' }}>{getRouteLabel(selectedBus.routeCode)}</td>
                <td style={{ padding: '6px 0', width: '15%', fontWeight: 700 }}>Fecha:</td>
                <td style={{ padding: '6px 0', width: '35%' }}>{new Date().toLocaleDateString('es-BO')}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 700 }}>Conductor:</td>
                <td>{selectedBus.conductor || 'No asignado'}</td>
                <td style={{ padding: '6px 0', fontWeight: 700 }}>Total Bultos:</td>
                <td>{assignedParcels.length}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000', borderTop: '2px solid #000' }}>
                <th style={{ padding: '10px 6px', textAlign: 'left' }}>Nro. Encomienda</th>
                <th style={{ padding: '10px 6px', textAlign: 'left' }}>Destinatario</th>
                <th style={{ padding: '10px 6px', textAlign: 'left' }}>Ciudad Destino</th>
                <th style={{ padding: '10px 6px', textAlign: 'center', width: 70 }}>Peso</th>
                <th style={{ padding: '10px 6px', textAlign: 'center', width: 80 }}>Pago</th>
                <th style={{ padding: '10px 6px', textAlign: 'center', width: 140 }}>Firma Recepción</th>
              </tr>
            </thead>
            <tbody>
              {assignedParcels.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center' }}>No hay bultos registrados en este manifiesto.</td>
                </tr>
              ) : (
                assignedParcels.map((p, idx) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 700 }}>{p.trackingNumber}</td>
                    <td style={{ padding: '8px 6px' }}>{p.recipientName}</td>
                    <td style={{ padding: '8px 6px' }}>{p.destinationAddress.split(',')[0]}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>{p.weight} kg</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>{p.estadoPago}</td>
                    <td style={{ padding: '8px 6px', borderLeft: '1px solid #ccc' }}></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, textAlign: 'center' }}>
            <div>
              <div style={{ borderBottom: '1px solid #000', height: 40 }} />
              <span style={{ fontSize: 11, display: 'block', marginTop: 6 }}>Firma del Conductor Responsable</span>
            </div>
            <div>
              <div style={{ borderBottom: '1px solid #000', height: 40 }} />
              <span style={{ fontSize: 11, display: 'block', marginTop: 6 }}>Despachador de Bodega / Sello</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
