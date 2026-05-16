import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Datos para confirmar retiro de encomienda' })
export class ConfirmarRetiroInput {
  @Field({ description: 'ID de la encomienda a entregar' })
  parcelId!: string;

  @Field({ description: 'CI del destinatario presentado en ventanilla' })
  recipientCi!: string;
}
