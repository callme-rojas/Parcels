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

export const CREAR_USUARIO_MUTATION = gql`
  mutation CrearUsuario($input: CrearUsuarioInput!) {
    crearUsuario(input: $input) {
      id
      nombre
      email
      telefono
      rol
      activo
    }
  }
`;

export const ACTUALIZAR_USUARIO_MUTATION = gql`
  mutation ActualizarUsuario($input: ActualizarUsuarioInput!) {
    actualizarUsuario(input: $input) {
      id
      nombre
      email
      telefono
      rol
      activo
    }
  }
`;

export const TOGGLE_USUARIO_ACTIVO_MUTATION = gql`
  mutation ToggleUsuarioActivo($id: String!, $activo: Boolean!) {
    toggleUsuarioActivo(id: $id, activo: $activo) {
      id
      nombre
      email
      telefono
      rol
      activo
    }
  }
`;

export const CREAR_SUCURSAL_MUTATION = gql`
  mutation CrearSucursal($input: CrearSucursalInput!) {
    crearSucursal(input: $input) {
      id
      nombre
      ciudad
      direccion
      telefono
      activa
    }
  }
`;

export const ACTUALIZAR_SUCURSAL_MUTATION = gql`
  mutation ActualizarSucursal($input: ActualizarSucursalInput!) {
    actualizarSucursal(input: $input) {
      id
      nombre
      ciudad
      direccion
      telefono
      activa
    }
  }
`;

export const TOGGLE_SUCURSAL_ACTIVA_MUTATION = gql`
  mutation ToggleSucursalActiva($id: ID!, $activa: Boolean!) {
    toggleSucursalActiva(id: $id, activa: $activa) {
      id
      nombre
      ciudad
      direccion
      telefono
      activa
    }
  }
`;

export const REGISTRAR_PAGO_MUTATION = gql`
  mutation RegistrarPago($id: ID!) {
    registrarPago(id: $id) {
      id
      estadoPago
      pagadoEn
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
      largoCm
      anchoCm
      altoCm
      categoria
      esFragil
      costoEnvio
      estadoPago
      tipoPago
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
      largoCm
      anchoCm
      altoCm
      categoria
      esFragil
      costoEnvio
      estadoPago
      tipoPago
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

// ─── Bus Mutations ──────────────────────────────────────────

export const CREATE_BUS_MUTATION = gql`
  mutation CrearBus($input: CrearBusInput!) {
    crearBus(input: $input) {
      id
      placa
      flota
      routeCode
      capacidad
      estado
    }
  }
`;

// ─── Bodega Mutations (Fase 2 y 3) ──────────────────────────

export const CLASIFICAR_ENCOMIENDA = gql`
  mutation Clasificar($id: ID!) {
    clasificarEncomienda(id: $id) {
      id
      trackingNumber
      status
    }
  }
`;

export const ASIGNAR_BUS = gql`
  mutation Asignar($input: AsignarEncomiendaBusInput!) {
    asignarEncomiendaABus(input: $input) {
      id
      trackingNumber
      status
      assignedBusId
      assignedBusPlaca
      assignedBusFlota
    }
  }
`;

export const REGISTRAR_CARGA = gql`
  mutation RegistrarCarga($id: ID!) {
    registrarCarga(id: $id) {
      id
      trackingNumber
      status
    }
  }
`;

export const REGISTRAR_DESCARGA = gql`
  mutation RegistrarDescarga($id: ID!) {
    registrarDescarga(id: $id) {
      id
      trackingNumber
      status
    }
  }
`;

export const MARCAR_DISPONIBLE = gql`
  mutation MarcarDisponible($id: ID!) {
    marcarDisponible(id: $id) {
      id
      trackingNumber
      status
    }
  }
`;

export const REGISTRAR_COORDENADA_MUTATION = gql`
  mutation RegistrarCoordenadaBus($input: RegistrarCoordenadaBusInput!) {
    registrarCoordenadaBus(input: $input) {
      busId
      lat
      lng
      velocidad
      recordedAt
    }
  }
`;

