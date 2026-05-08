import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RegisterClienteInput {
  @Field()
  nombre!: string;

  @Field()
  email!: string;

  @Field()
  password!: string;
}

