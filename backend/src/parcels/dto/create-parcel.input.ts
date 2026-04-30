import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateParcelInput {
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
}
