import { gql } from '@apollo/client';

// ─── Auth Mutations ────────────────────────────────────────────

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        nombre
        email
        rol
        activo
      }
    }
  }
`;

export const REGISTER_CLIENT_MUTATION = gql`
  mutation RegisterCliente($input: RegisterClienteInput!) {
    registerCliente(input: $input) {
      accessToken
      user {
        id
        nombre
        email
        rol
        activo
      }
    }
  }
`;

// ─── Parcel Mutations ──────────────────────────────────────────

/** Crear encomienda (sin auth — flujo público o con cuenta) */
export const CREATE_PARCEL_MUTATION = gql`
  mutation CreateParcel($input: CreateParcelInput!) {
    createParcel(input: $input) {
      id
      trackingNumber
      senderName
      recipientName
      routeCode
      originAddress
      destinationAddress
      content
      weight
      status
      createdAt
    }
  }
`;

/** Crear encomienda autenticado (registra usuarioId en el evento) */
export const CREATE_PARCEL_AUTH_MUTATION = gql`
  mutation CreateParcelAuth($input: CreateParcelInput!) {
    createParcelAuth(input: $input) {
      id
      trackingNumber
      senderName
      recipientName
      routeCode
      originAddress
      destinationAddress
      content
      weight
      status
      createdAt
    }
  }
`;

/** Actualizar estado (TAQUILLA / BODEGA / ADMIN) */
export const UPDATE_PARCEL_STATUS_MUTATION = gql`
  mutation UpdateParcelStatus($input: UpdateParcelStatusInput!) {
    updateParcelStatus(input: $input) {
      id
      trackingNumber
      status
      updatedAt
      events {
        id
        status
        note
        createdAt
      }
    }
  }
`;

/** Confirmar retiro con verificación de CI (TAQUILLA / ADMIN) */
export const CONFIRMAR_RETIRO_MUTATION = gql`
  mutation ConfirmarRetiro($input: ConfirmarRetiroInput!) {
    confirmarRetiro(input: $input) {
      id
      trackingNumber
      status
      deliveredAt
      events {
        id
        status
        note
        createdAt
      }
    }
  }
`;
