import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ParcelActionInput {
  @Field({ description: 'ID de la encomienda' })
  parcelId!: string;

  @Field({ nullable: true, description: 'Nota u observación del evento' })
  note?: string;
}
