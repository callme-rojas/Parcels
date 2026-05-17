import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AsignarEncomiendaBusInput {
  @Field({ description: 'ID de la encomienda' })
  parcelId!: string;

  @Field({ description: 'ID del bus en la flota' })
  busId!: string;

  @Field({ nullable: true })
  note?: string;
}
