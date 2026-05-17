import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AsignarBusInput {
  @Field({ description: 'ID de la encomienda' })
  parcelId!: string;

  @Field({ description: 'Placa del bus (ej. 2845-KCN)' })
  busPlaca!: string;

  @Field({ nullable: true, description: 'Identificador de flota (ej. Flota 18)' })
  busFlota?: string;

  @Field({ nullable: true, description: 'Nota adicional' })
  note?: string;
}
