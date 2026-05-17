import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class RegistrarCoordenadaBusInput {
  @Field()
  busId!: string;

  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field(() => Float, { nullable: true })
  velocidad?: number;
}
