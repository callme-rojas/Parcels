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
    assignedBusId
    assignedBusPlaca
    assignedBusFlota
    largoCm
    anchoCm
    altoCm
    categoria
    esFragil
    costoEnvio
    estadoPago
    pagadoEn
    tipoPago
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

/** Calcular costo estimado de envío */
export const CALCULAR_COSTO_ENVIO = gql`
  query CalcularCostoEnvio(
    $routeCode: String!
    $weight: Float!
    $largoCm: Float
    $anchoCm: Float
    $altoCm: Float
    $esFragil: Boolean
  ) {
    calcularCostoEnvio(
      routeCode: $routeCode
      weight: $weight
      largoCm: $largoCm
      anchoCm: $anchoCm
      altoCm: $altoCm
      esFragil: $esFragil
    )
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

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      nombre
      email
      telefono
      rol
      activo
    }
  }
`;

export const GET_SUCURSALES = gql`
  query GetSucursales {
    sucursales {
      id
      nombre
      ciudad
      direccion
      telefono
      activa
    }
  }
`;

// ─── Buses Queries ──────────────────────────────────────────

export const GET_BUSES = gql`
  query GetBuses {
    buses {
      id
      placa
      flota
      routeCode
      capacidad
      cargados
      estado
      activo
    }
  }
`;

export const GET_BUSES_DISPONIBLES = gql`
  query GetBusesDisponibles($routeCode: String) {
    busesDisponibles(routeCode: $routeCode) {
      id
      placa
      flota
      routeCode
      routeLabel
      capacidad
      cargados
      estado
      salidaProgramada
      conductor
    }
  }
`;

export const GET_BUS = gql`
  query GetBus($id: ID!) {
    bus(id: $id) {
      id
      placa
      flota
      modelo
      conductor
      capacidad
      cargados
      estado
      routeCode
    }
  }
`;

export const GET_ULTIMA_UBICACION_BUS = gql`
  query UltimaUbicacionBus($busId: ID!) {
    ultimaUbicacionBus(busId: $busId) {
      lat
      lng
      recordedAt
    }
  }
`;

export const GET_UBICACION_BUS_POR_ENCOMIENDA = gql`
  query UbicacionBusPorEncomienda($parcelId: ID!) {
    ubicacionBusPorEncomienda(parcelId: $parcelId) {
      busId
      lat
      lng
      velocidad
      recordedAt
    }
  }
`;

export const GET_RESUMEN_DASHBOARD = gql`
  query ResumenDashboard {
    resumenDashboard {
      fechaReferencia
      registradasHoy
      entregadasHoy
      enTransito
      disponiblesRetiro
      ultimasEncomiendas {
        id
        trackingNumber
        senderName
        recipientName
        routeCode
        routeLabel
        status
        createdAt
      }
      topRutas {
        routeCode
        routeLabel
        total
        porcentaje
      }
    }
  }
`;

export const GET_INDICADORES_OPERATIVOS = gql`
  query IndicadoresOperativos($filter: IndicadoresFilterInput) {
    indicadoresOperativos(filter: $filter) {
      fechaDesde
      fechaHasta
      totalRegistradas
      totalEntregadas
      totalEnTransito
      totalDisponibles
      totalCanceladas
      totalRecepcionadas
      totalEnDestino
      tasaEntregaExitosa
      totalVentaEtiquetas
      montoTotalRegistrado
      montoTotalPagado
      montoTotalPendiente
      encomiendasPorRuta {
        routeCode
        routeLabel
        total
        porcentaje
      }
    }
  }
`;

export const GET_REPORTE_ENCOMIENDAS = gql`
  query ReporteEncomiendas($filter: ReporteEncomiendasFilterInput) {
    reporteEncomiendas(filter: $filter) {
      total
      page
      pageSize
      totalPages
      items {
        id
        trackingNumber
        senderName
        recipientName
        routeCode
        status
        createdAt
        weight
        senderCi
        recipientCi
      }
    }
  }
`;

export const GENERAR_ETIQUETA = gql`
  query GenerarEtiqueta($parcelId: String!) {
    generarEtiqueta(parcelId: $parcelId)
  }
`;

