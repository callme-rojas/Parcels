import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  DollarSign,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { GET_PARCELS } from '../graphql/queries';
import { REGISTRAR_PAGO_MUTATION } from '../graphql/mutations';
import type { Parcel } from '../types';

export default function CobrosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagoFilter, setPagoFilter] = useState<string>('TODOS');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

  // Query parcels
  const { data, loading, error, refetch } = useQuery<{ parcels: Parcel[] }>(GET_PARCELS, {
    fetchPolicy: 'cache-and-network',
  });

  // Mutation: Register Payment
  const [registrarPago, { loading: paying }] = useMutation(REGISTRAR_PAGO_MUTATION, {
    onCompleted: (data) => {
      setSuccessMsg(`Pago de encomienda registrado con éxito.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setSelectedParcel(null);
      refetch();
    },
    onError: (err) => {
      setErrorMsg(`Error al registrar el pago: ${err.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    },
  });

  const handlePay = async (id: string, metodo: 'EFECTIVO' | 'QR') => {
    try {
      await registrarPago({ variables: { id, metodoPago: metodo } });
    } catch {
      // Handled by onError
    }
  };

  const parcels = data?.parcels || [];

  // Filter parcels for today or generally for transactions
  const filteredTransactions = useMemo(() => {
    return parcels.filter((p) => {
      // Search
      const matchesSearch =
        p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.recipientName.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter state
      const matchesStatus =
        pagoFilter === 'TODOS' ||
        (pagoFilter === 'PAGADO' && p.estadoPago === 'PAGADO') ||
        (pagoFilter === 'PENDIENTE' && p.estadoPago === 'PENDIENTE');

      return matchesSearch && matchesStatus;
    });
  }, [parcels, searchQuery, pagoFilter]);

  // Financial metrics
  const stats = useMemo(() => {
    let recaudado = 0;
    let pendiente = 0;
    let pagadosCount = 0;
    let totalCosto = 0;

    parcels.forEach((p) => {
      const costo = p.costoEnvio || 0;
      totalCosto += costo;
      if (p.estadoPago === 'PAGADO') {
        recaudado += costo;
        pagadosCount++;
      } else if (p.estadoPago === 'PENDIENTE') {
        pendiente += costo;
      }
    });

    return {
      recaudado,
      pendiente,
      pagadosCount,
      totalCount: parcels.length,
    };
  }, [parcels]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="panel-page">
      {/* ─── Header Bar ──────────────────────── */}
      <div className="enc-header" style={{ marginBottom: 20 }}>
        <div className="enc-header__left">
          <h2 className="enc-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={24} style={{ color: 'var(--navy)' }} /> Cobros del Día
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Monitorea los ingresos diarios de caja, registra cobros pendientes de encomiendas y visualiza las transacciones financieras.
          </p>
        </div>
      </div>

      {/* ─── Notifications ───────────────────── */}
      {successMsg && (
        <div className="taq-scan-result taq-scan-result--success animate-fade-in" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          <div>
            <strong>Pago registrado</strong>
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="taq-scan-result taq-scan-result--error animate-fade-in" style={{ marginBottom: 16 }}>
          <AlertCircle size={18} />
          <div>
            <strong>Error</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="taq-scan-result taq-scan-result--error animate-fade-in" style={{ marginBottom: 16 }}>
          <AlertCircle size={18} />
          <div>
            <strong>Error al cargar transacciones</strong>
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* ─── KPI Metrics Dashboard ───────────── */}
      <section className="dashboard__kpis" style={{ marginBottom: 24 }}>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><TrendingUp size={22} /></span>
          </div>
          <div className="kpi-card__value">
            {loading ? <Loader2 size={18} className="spin" /> : `${stats.recaudado.toFixed(2)} Bs`}
          </div>
          <div className="kpi-card__label">Recaudado Hoy</div>
        </div>
        
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><Clock size={22} /></span>
          </div>
          <div className="kpi-card__value">
            {loading ? <Loader2 size={18} className="spin" /> : `${stats.pendiente.toFixed(2)} Bs`}
          </div>
          <div className="kpi-card__label">Pendiente por Cobrar</div>
        </div>

        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__header">
            <span className="kpi-card__icon"><CreditCard size={22} /></span>
          </div>
          <div className="kpi-card__value">
            {loading ? <Loader2 size={18} className="spin" /> : `${stats.pagadosCount} / ${stats.totalCount}`}
          </div>
          <div className="kpi-card__label">Envíos Cobrados</div>
        </div>
      </section>

      {/* ─── Search & Filters Bar ────────────── */}
      <div className="enc-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="enc-search" style={{ flex: '1 1 300px' }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por código de tracking o nombre de remitente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: '0 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-input"
              style={{ width: 180, padding: '6px 12px', fontSize: 13 }}
              value={pagoFilter}
              onChange={(e) => setPagoFilter(e.target.value)}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PAGADO">Cobrado (Pagado)</option>
              <option value="PENDIENTE">Pendiente (No pagado)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Data Table ──────────────────────── */}
      <div className="dashboard-panel" style={{ animationDelay: '0.1s' }}>
        <div className="dashboard-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="dashboard-panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={16} /> Transacciones financieras
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Mostrando {filteredTransactions.length} de {parcels.length} envíos
          </span>
        </div>
        <div className="dashboard-panel__body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código Envío</th>
                <th>Remitente</th>
                <th>Monto Envío</th>
                <th>Estado de Pago</th>
                <th>Fecha Registro</th>
                <th style={{ width: 140, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <Loader2 className="spin" size={20} style={{ display: 'inline-block', marginRight: 8 }} />
                    Cargando historial financiero...
                  </td>
                </tr>
              )}

              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <AlertCircle size={24} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--text-muted)' }} />
                    No se encontraron transacciones financieras registradas hoy.
                  </td>
                </tr>
              )}

              {!loading && filteredTransactions.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="data-table__code">{p.trackingNumber}</span>
                  </td>
                  <td style={{ fontSize: 14, fontWeight: 550, color: 'var(--navy)' }}>
                    {p.senderName}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--navy)' }}>
                    {(p.costoEnvio || 0).toFixed(2)} Bs
                  </td>
                  <td>
                    {p.estadoPago === 'PAGADO' ? (
                      <span className="badge badge--green">
                        <span className="badge__dot" /> Cobrado
                      </span>
                    ) : (
                      <span className="badge badge--amber">
                        <span className="badge__dot" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {formatDate(p.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.estadoPago === 'PENDIENTE' ? (
                      <button
                        className="btn btn--primary btn--sm"
                        style={{ padding: '4px 8px', minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setSelectedParcel(p)}
                        disabled={paying}
                      >
                        <ArrowUpRight size={13} /> Cobrar
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Pago QR Simulado para Cajero ───────────── */}
      {selectedParcel && (
        <div className="modal-overlay" onClick={() => setSelectedParcel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal__header">
              <h3>Cobro de Encomienda (QR Simple)</h3>
              <button className="modal__close" onClick={() => setSelectedParcel(null)}>✕</button>
            </div>
            <div className="modal__body" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Registro de Cobro en Taquilla
                </span>
                <h4 style={{ fontSize: 15, color: 'var(--navy)', marginTop: 4 }}>Muestre el código QR al destinatario</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Encomienda: <strong>{selectedParcel.trackingNumber}</strong> <br />
                  Destinatario: <strong>{selectedParcel.recipientName}</strong> (CI: {selectedParcel.recipientCi})
                </p>
              </div>

              <div style={{ background: 'var(--bg-page)', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: '1px solid var(--border)', width: 'fit-content', margin: '0 auto' }}>
                <div style={{ background: 'white', padding: 10, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <svg width="140" height="140" viewBox="0 0 100 100" style={{ display: 'block' }}>
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <rect x="5" y="5" width="25" height="25" fill="#1e293b" />
                    <rect x="9" y="9" width="17" height="17" fill="white" />
                    <rect x="12" y="12" width="11" height="11" fill="#1e293b" />
                    
                    <rect x="70" y="5" width="25" height="25" fill="#1e293b" />
                    <rect x="74" y="9" width="17" height="17" fill="white" />
                    <rect x="77" y="12" width="11" height="11" fill="#1e293b" />
                    
                    <rect x="5" y="70" width="25" height="25" fill="#1e293b" />
                    <rect x="9" y="74" width="17" height="17" fill="white" />
                    <rect x="12" y="77" width="11" height="11" fill="#1e293b" />
                    
                    <rect x="42" y="42" width="16" height="16" fill="#1e3a8a" rx="2" />
                    <circle cx="50" cy="50" r="4" fill="#fbbf24" />
                    
                    <rect x="40" y="10" width="8" height="8" fill="#475569" />
                    <rect x="55" y="15" width="6" height="6" fill="#1e293b" />
                    <rect x="45" y="25" width="12" height="6" fill="#475569" />
                    <rect x="10" y="40" width="10" height="6" fill="#1e293b" />
                    <rect x="25" y="45" width="6" height="12" fill="#475569" />
                    <rect x="15" y="58" width="12" height="8" fill="#1e293b" />
                    <rect x="70" y="40" width="15" height="6" fill="#475569" />
                    <rect x="75" y="50" width="8" height="12" fill="#1e293b" />
                    <rect x="85" y="65" width="10" height="10" fill="#475569" />
                    <rect x="40" y="70" width="6" height="14" fill="#1e293b" />
                    <rect x="52" y="75" width="14" height="6" fill="#475569" />
                    <rect x="60" y="85" width="12" height="10" fill="#1e293b" />
                    <rect x="45" y="62" width="8" height="8" fill="#1e293b" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Monto: {selectedParcel.costoEnvio?.toFixed(2)} BOB</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Vence en: 01:59 minutos</span>
              </div>
            </div>
            <div className="modal__footer" style={{ justifyContent: 'center', gap: 12, flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button
                  className="btn btn--primary"
                  disabled={paying}
                  onClick={() => handlePay(selectedParcel.id, 'EFECTIVO')}
                  style={{ flex: 1, padding: '10px 8px', fontSize: 13, minWidth: 'auto' }}
                >
                  💵 Cobrar Efectivo
                </button>
                <button
                  className="btn btn--gold animate-pulse"
                  disabled={paying}
                  onClick={() => handlePay(selectedParcel.id, 'QR')}
                  style={{ flex: 1, padding: '10px 8px', fontSize: 13, minWidth: 'auto' }}
                >
                  📱 Cobrar QR Simple
                </button>
              </div>
              <button className="btn btn--secondary btn--full" onClick={() => setSelectedParcel(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
