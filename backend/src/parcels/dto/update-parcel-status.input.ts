import { InputType, Field, ID } from '@nestjs/graphql';
import { ParcelStatus } from '../entities/parcel.entity';

@InputType()
export class UpdateParcelStatusInput {
  @Field(() => ID, { description: 'The parcel ID to update' })
  id!: string;

  @Field(() => ParcelStatus, { description: 'New status for the parcel' })
  status!: ParcelStatus;
}
