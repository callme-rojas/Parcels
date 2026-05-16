import { InputType, Field } from '@nestjs/graphql';
import { ParcelStatus } from '../entities/parcel.entity';

@InputType({ description: 'Actualizar estado de una encomienda' })
export class UpdateParcelStatusInput {
  @Field({ description: 'ID de la encomienda a actualizar' })
  id!: string;

  @Field(() => ParcelStatus, { description: 'Nuevo estado' })
  status!: ParcelStatus;

  @Field({ nullable: true, description: 'Observación o nota del cambio de estado' })
  note?: string;
}
