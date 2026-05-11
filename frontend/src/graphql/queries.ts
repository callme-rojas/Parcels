import { gql } from '@apollo/client';

// ─── Parcel Queries ────────────────────────────────────────────

export const GET_PARCELS = gql`
  query GetParcels {
    parcels {
      id
      trackingNumber
      senderName
      recipientName
      originAddress
      destinationAddress
      weight
      status
      createdAt
      deliveredAt
    }
  }
`;

export const GET_PARCEL = gql`
  query GetParcel($id: ID!) {
    parcel(id: $id) {
      id
      trackingNumber
      senderName
      recipientName
      originAddress
      destinationAddress
      originLat
      originLng
      destinationLat
      destinationLng
      weight
      status
      createdAt
      deliveredAt
    }
  }
`;

export const GET_PARCEL_BY_TRACKING = gql`
  query GetParcelByTracking($trackingNumber: String!) {
    parcelByTracking(trackingNumber: $trackingNumber) {
      id
      trackingNumber
      senderName
      recipientName
      originAddress
      destinationAddress
      originLat
      originLng
      destinationLat
      destinationLng
      weight
      status
      createdAt
      deliveredAt
    }
  }
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
