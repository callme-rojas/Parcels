import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Última ubicación GPS de un bus' })
export class BusLocation {
  @Field()
  busId!: string;

  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field(() => Float, { nullable: true })
  velocidad?: number;

  @Field()
  recordedAt!: Date;
}
