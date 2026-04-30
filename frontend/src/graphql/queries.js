import { gql } from '@apollo/client/core';

export const GET_ALL_PARCELS = gql`
  query GetAllParcels {
    parcels {
      id
      trackingNumber
      senderName
      recipientName
      originAddress
      destinationAddress
      originLng
      originLat
      destinationLng
      destinationLat
      weight
      status
      createdAt
      deliveredAt
    }
  }
`;

export const GET_PARCEL_BY_ID = gql`
  query GetParcelById($id: ID!) {
    parcel(id: $id) {
      id
      trackingNumber
      senderName
      recipientName
      originAddress
      destinationAddress
      originLng
      originLat
      destinationLng
      destinationLat
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
      originLng
      originLat
      destinationLng
      destinationLat
      weight
      status
      createdAt
      deliveredAt
    }
  }
`;

export const CREATE_PARCEL = gql`
  mutation CreateParcel($input: CreateParcelInput!) {
    createParcel(input: $input) {
      id
      trackingNumber
      senderName
      recipientName
      status
      createdAt
    }
  }
`;

export const UPDATE_PARCEL_STATUS = gql`
  mutation UpdateParcelStatus($input: UpdateParcelStatusInput!) {
    updateParcelStatus(input: $input) {
      id
      trackingNumber
      status
      deliveredAt
    }
  }
`;

export const DELETE_PARCEL = gql`
  mutation RemoveParcel($id: ID!) {
    removeParcel(id: $id)
  }
`;
