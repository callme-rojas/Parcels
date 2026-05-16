import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
} from '@nestjs/graphql';

export enum ParcelStatus {
  REGISTRADO = 'REGISTRADO',
  RECEPCIONADO = 'RECEPCIONADO',
  EN_TRANSITO = 'EN_TRANSITO',
  EN_DESTINO = 'EN_DESTINO',
  DISPONIBLE = 'DISPONIBLE',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

registerEnumType(ParcelStatus, {
  name: 'ParcelStatus',
  description: 'Estado operativo de la encomienda',
});

@ObjectType({ description: 'Evento de estado de una encomienda' })
export class ParcelEvent {
  @Field(() => ID)
  id!: string;

  @Field()
  parcelId!: string;

  @Field(() => ParcelStatus)
  status!: ParcelStatus;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  usuarioId?: string;

  @Field()
  createdAt!: Date;
}

@ObjectType({ description: 'Encomienda / paquete en tránsito' })
export class Parcel {
  @Field(() => ID)
  id!: string;

  @Field({ description: 'Número de rastreo único' })
  trackingNumber!: string;

  // Sender
  @Field({ description: 'Nombre del remitente' })
  senderName!: string;

  @Field({ description: 'CI del remitente' })
  senderCi!: string;

  @Field({ description: 'Teléfono del remitente' })
  senderPhone!: string;

  @Field({ description: 'Email del remitente' })
  senderEmail!: string;

  // Recipient
  @Field({ description: 'Nombre del destinatario' })
  recipientName!: string;

  @Field({ description: 'CI del destinatario (para verificar entrega)' })
  recipientCi!: string;

  @Field({ description: 'Teléfono del destinatario' })
  recipientPhone!: string;

  @Field({ nullable: true, description: 'Email del destinatario (opcional)' })
  recipientEmail?: string;

  // Package
  @Field({ description: 'Descripción / contenido del paquete' })
  content!: string;

  @Field(() => Float, { description: 'Peso declarado en kg' })
  weight!: number;

  @Field({ nullable: true, description: 'Observaciones adicionales' })
  observations?: string;

  // Route
  @Field({ description: 'Código de ruta (ej. SCZ-PQA)' })
  routeCode!: string;

  @Field({ description: 'Ciudad / dirección de origen' })
  originAddress!: string;

  @Field({ description: 'Ciudad / dirección de destino' })
  destinationAddress!: string;

  @Field(() => Float)
  originLat!: number;

  @Field(() => Float)
  originLng!: number;

  @Field(() => Float)
  destinationLat!: number;

  @Field(() => Float)
  destinationLng!: number;

  // Status
  @Field(() => ParcelStatus)
  status!: ParcelStatus;

  // Timestamps
  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  // Events
  @Field(() => [ParcelEvent], { nullable: true })
  events?: ParcelEvent[];
}
