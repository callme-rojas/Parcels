/**
 * useParcel — Hook centralizado para operaciones de encomiendas.
 *
 * Encapsula todas las queries/mutations de Apollo relacionadas a parcels
 * para que los componentes no dependan directamente de Apollo.
 */
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { GET_PARCELS, GET_PARCEL, GET_PARCEL_BY_TRACKING } from '../graphql/queries';
import {
  CREATE_PARCEL_MUTATION,
  CREATE_PARCEL_AUTH_MUTATION,
  UPDATE_PARCEL_STATUS_MUTATION,
  CONFIRMAR_RETIRO_MUTATION,
} from '../graphql/mutations';
import type {
  Parcel,
  CreateParcelInput,
  UpdateParcelStatusInput,
  ConfirmarRetiroInput,
  ParcelsFilter,
} from '../types';
import { useAuthStore } from '../stores/authStore';

// ─── Tipos de retorno ──────────────────────────────────────────

export interface UseParcelsReturn {
  parcels: Parcel[];
  loading: boolean;
  error?: ApolloError;
  refetch: () => void;
}

export interface UseParcelReturn {
  parcel: Parcel | null;
  loading: boolean;
  error?: ApolloError;
  refetch: () => void;
}

// ─── Listar encomiendas con filtros ───────────────────────────

export function useParcels(filter?: ParcelsFilter): UseParcelsReturn {
  const { data, loading, error, refetch } = useQuery<{ parcels: Parcel[] }>(
    GET_PARCELS,
    {
      variables: { filter },
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    parcels: data?.parcels ?? [],
    loading,
    error,
    refetch,
  };
}

// ─── Detalle de encomienda por ID ─────────────────────────────

export function useParcel(id: string | undefined): UseParcelReturn {
  const { data, loading, error, refetch } = useQuery<{ parcel: Parcel }>(
    GET_PARCEL,
    {
      variables: { id },
      skip: !id,
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    parcel: data?.parcel ?? null,
    loading,
    error,
    refetch,
  };
}

// ─── Rastreo público por tracking number ─────────────────────

export function useParcelByTracking(trackingNumber: string | undefined): UseParcelReturn {
  const { data, loading, error, refetch } = useQuery<{ parcelByTracking: Parcel }>(
    GET_PARCEL_BY_TRACKING,
    {
      variables: { trackingNumber },
      skip: !trackingNumber,
      fetchPolicy: 'network-only',
    }
  );

  return {
    parcel: data?.parcelByTracking ?? null,
    loading,
    error,
    refetch,
  };
}

// ─── Crear encomienda ─────────────────────────────────────────

export function useCreateParcel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Usar la mutation autenticada si hay sesión activa (registra el creador)
  const mutation = isAuthenticated
    ? CREATE_PARCEL_AUTH_MUTATION
    : CREATE_PARCEL_MUTATION;

  const [mutate, { loading, error }] = useMutation<
    { createParcel: Parcel } | { createParcelAuth: Parcel }
  >(mutation);

  const createParcel = async (input: CreateParcelInput): Promise<Parcel> => {
    const { data } = await mutate({ variables: { input } });
    if (!data) throw new Error('Sin respuesta del servidor');
    // Extraer el resultado sin importar qué clave tiene
    return ('createParcelAuth' in data ? data.createParcelAuth : data.createParcel) as Parcel;
  };

  return { createParcel, loading, error };
}

// ─── Actualizar estado ────────────────────────────────────────

export function useUpdateParcelStatus() {
  const [mutate, { loading, error }] = useMutation<{ updateParcelStatus: Parcel }>(
    UPDATE_PARCEL_STATUS_MUTATION,
    { refetchQueries: ['GetParcels'] }
  );

  const updateStatus = async (input: UpdateParcelStatusInput): Promise<Parcel> => {
    const { data } = await mutate({ variables: { input } });
    if (!data) throw new Error('Sin respuesta del servidor');
    return data.updateParcelStatus;
  };

  return { updateStatus, loading, error };
}

// ─── Confirmar retiro ─────────────────────────────────────────

export function useConfirmarRetiro() {
  const [mutate, { loading, error }] = useMutation<{ confirmarRetiro: Parcel }>(
    CONFIRMAR_RETIRO_MUTATION,
    { refetchQueries: ['GetParcels'] }
  );

  const confirmarRetiro = async (input: ConfirmarRetiroInput): Promise<Parcel> => {
    const { data } = await mutate({ variables: { input } });
    if (!data) throw new Error('Sin respuesta del servidor');
    return data.confirmarRetiro;
  };

  return { confirmarRetiro, loading, error };
}
