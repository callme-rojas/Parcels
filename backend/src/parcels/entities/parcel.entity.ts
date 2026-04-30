import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';

export enum ParcelStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(ParcelStatus, {
  name: 'ParcelStatus',
  description: 'The current status of a parcel',
});

@ObjectType({ description: 'A parcel/encomienda being shipped' })
export class Parcel {
  @Field(() => ID)
  id!: string;

  @Field({ description: 'Tracking number' })
  trackingNumber!: string;

  @Field({ description: 'Sender name' })
  senderName!: string;

  @Field({ description: 'Recipient name' })
  recipientName!: string;

  @Field({ description: 'Origin address' })
  originAddress!: string;

  @Field({ description: 'Destination address' })
  destinationAddress!: string;

  @Field(() => Float, { description: 'Origin longitude' })
  originLng!: number;

  @Field(() => Float, { description: 'Origin latitude' })
  originLat!: number;

  @Field(() => Float, { description: 'Destination longitude' })
  destinationLng!: number;

  @Field(() => Float, { description: 'Destination latitude' })
  destinationLat!: number;

  @Field(() => Float, { description: 'Weight in kg' })
  weight!: number;

  @Field(() => ParcelStatus, { description: 'Current parcel status' })
  status!: ParcelStatus;

  @Field({ description: 'Date the parcel was created' })
  createdAt!: Date;

  @Field({ nullable: true, description: 'Date the parcel was delivered' })
  deliveredAt?: Date;
}
