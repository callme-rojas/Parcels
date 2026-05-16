import { gql } from '@apollo/client';

// ─── Fragment reutilizable ─────────────────────────────────────

export const PARCEL_BASE_FIELDS = gql`
  fragment ParcelBaseFields on Parcel {
    id
    trackingNumber
    senderName
    senderCi
    senderPhone
    senderEmail
    recipientName
    recipientCi
    recipientPhone
    recipientEmail
    content
    weight
    observations
    routeCode
    originAddress
    destinationAddress
    originLat
    originLng
    destinationLat
    destinationLng
    status
    createdAt
    updatedAt
    deliveredAt
  }
`;

export const PARCEL_WITH_EVENTS = gql`
  fragment ParcelWithEvents on Parcel {
    ...ParcelBaseFields
    events {
      id
      parcelId
      status
      note
      usuarioId
      createdAt
    }
  }
  ${PARCEL_BASE_FIELDS}
`;

// ─── Parcel Queries ────────────────────────────────────────────

/** Lista de encomiendas con filtros opcionales (requiere auth) */
export const GET_PARCELS = gql`
  query GetParcels($filter: ParcelsFilterInput) {
    parcels(filter: $filter) {
      ...ParcelBaseFields
    }
  }
  ${PARCEL_BASE_FIELDS}
`;

/** Detalle completo de encomienda por ID con historial (requiere auth) */
export const GET_PARCEL = gql`
  query GetParcel($id: ID!) {
    parcel(id: $id) {
      ...ParcelWithEvents
    }
  }
  ${PARCEL_WITH_EVENTS}
`;

/** Rastreo público por número de tracking — sin auth */
export const GET_PARCEL_BY_TRACKING = gql`
  query GetParcelByTracking($trackingNumber: String!) {
    parcelByTracking(trackingNumber: $trackingNumber) {
      ...ParcelWithEvents
    }
  }
  ${PARCEL_WITH_EVENTS}
`;

// ─── User Queries ──────────────────────────────────────────────

export const GET_ME = gql`
  query Me {
    me {
      id
      nombre
      email
      rol
      activo
    }
  }
`;
