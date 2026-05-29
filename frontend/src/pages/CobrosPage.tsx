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

  // Query parcels
  const { data, loading, error, refetch } = useQuery<{ parcels: Parcel[] }>(GET_PARCELS, {
    fetchPolicy: 'cache-and-network',
  });

  // Mutation: Register Payment
  const [registrarPago, { loading: paying }] = useMutation(REGISTRAR_PAGO_MUTATION, {
    onCompleted: (data) => {
      setSuccessMsg(`Pago de encomienda registrado con éxito.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      refetch();
    },
    onError: (err) => {
      setErrorMsg(`Error al registrar el pago: ${err.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    },
  });

  const handlePay = async (id: string) => {
    try {
      await registrarPago({ variables: { id } });
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
                        onClick={() => handlePay(p.id)}
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
    </div>
  );
}
