import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateParcelInput {
  @Field({ description: 'Sender name' })
  senderName!: string;

  @Field({ description: 'Recipient name' })
  recipientName!: string;

  // Code of the route used in the frontend (e.g. "SCZ-PQA").
  // If provided, backend can infer origin/destination addresses + coordinates.
  @Field({ nullable: true, description: 'Route code (SCZ-PQA, ...)' })
  routeCode?: string;

  @Field({ nullable: true, description: 'Origin address' })
  originAddress?: string;

  @Field({ nullable: true, description: 'Destination address' })
  destinationAddress?: string;

  @Field(() => Float, { nullable: true, description: 'Origin longitude' })
  originLng?: number;

  @Field(() => Float, { nullable: true, description: 'Origin latitude' })
  originLat?: number;

  @Field(() => Float, { nullable: true, description: 'Destination longitude' })
  destinationLng?: number;

  @Field(() => Float, { nullable: true, description: 'Destination latitude' })
  destinationLat?: number;

  @Field(() => Float, { description: 'Weight in kg' })
  weight!: number;
}
