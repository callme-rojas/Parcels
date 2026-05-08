import { gql } from '@apollo/client';

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

export const CREATE_PARCEL_MUTATION = gql`
  mutation CreateParcel($input: CreateParcelInput!) {
    createParcel(input: $input) {
      id
      trackingNumber
      senderName
      recipientName
      originAddress
      destinationAddress
      weight
      status
      createdAt
    }
  }
`;
