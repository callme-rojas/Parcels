/**
 * useBusLocation — Hook para obtener la última ubicación GPS del bus
 * asociado a una encomienda específica.
 *
 * No requiere autenticación (la query es pública en el backend).
 * Hace polling automático cada 30 segundos si la encomienda está EN_TRANSITO.
 */
import { useQuery } from '@apollo/client/react';
import { GET_UBICACION_BUS_POR_ENCOMIENDA } from '../graphql/queries';

export interface BusLocationData {
  busId: string;
  lat: number;
  lng: number;
  velocidad?: number;
  recordedAt: string;
}

export interface UseBusLocationReturn {
  location: BusLocationData | null;
  loading: boolean;
  error?: Error;
  refetch: () => void;
}

/**
 * Hook para obtener la ubicación GPS del bus asignado a una encomienda.
 * @param parcelId  ID de la encomienda (si es undefined, no hace la query)
 * @param pollInterval  Intervalo de polling en ms (default: 30000 — 30 segundos)
 */
export function useBusLocation(
  parcelId: string | undefined,
  pollInterval = 3_000,
): UseBusLocationReturn {
  const { data, loading, error, refetch } = useQuery<{
    ubicacionBusPorEncomienda: BusLocationData | null;
  }>(GET_UBICACION_BUS_POR_ENCOMIENDA, {
    variables: { parcelId },
    skip: !parcelId,
    fetchPolicy: 'network-only',
    pollInterval,
  });

  return {
    location: data?.ubicacionBusPorEncomienda ?? null,
    loading,
    error,
    refetch,
  };
}
