import { InputType, Field, Float, registerEnumType } from '@nestjs/graphql';

export enum CategoriaContenidoInput {
  DOCUMENTOS   = 'DOCUMENTOS',
  ROPA         = 'ROPA',
  ELECTRONICO  = 'ELECTRONICO',
  ALIMENTOS    = 'ALIMENTOS',
  HERRAMIENTAS = 'HERRAMIENTAS',
  MEDICAMENTOS = 'MEDICAMENTOS',
  OTRO         = 'OTRO',
}

registerEnumType(CategoriaContenidoInput, {
  name: 'CategoriaContenido',
  description: 'Categoría del contenido del paquete',
});

@InputType({ description: 'Datos para crear una encomienda' })
export class CreateParcelInput {
  // Sender
  @Field({ description: 'Nombre completo del remitente' })
  senderName!: string;

  @Field({ description: 'CI del remitente' })
  senderCi!: string;

  @Field({ description: 'Teléfono del remitente' })
  senderPhone!: string;

  @Field({ description: 'Email del remitente' })
  senderEmail!: string;

  // Recipient
  @Field({ description: 'Nombre completo del destinatario' })
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

  @Field({ nullable: true, description: 'Observaciones o instrucciones especiales' })
  observations?: string;

  // Route — si se envía routeCode el backend infiere origen/destino
  @Field({ description: 'Código de ruta (ej. SCZ-PQA, PQA-SCZ, SCZ-SJC, SCZ-ROB)' })
  routeCode!: string;

  // ── Detalles extendidos del paquete (Fase 16) ────────────
  @Field(() => Float, { nullable: true, description: 'Largo del paquete en cm' })
  largoCm?: number;

  @Field(() => Float, { nullable: true, description: 'Ancho del paquete en cm' })
  anchoCm?: number;

  @Field(() => Float, { nullable: true, description: 'Alto del paquete en cm' })
  altoCm?: number;

  @Field(() => CategoriaContenidoInput, { nullable: true, description: 'Categoría del contenido' })
  categoria?: CategoriaContenidoInput;

  @Field({ nullable: true, description: '¿El paquete es frágil?' })
  esFragil?: boolean;
}
