import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CrearSucursalInput {
  @Field()
  nombre!: string;

  @Field()
  ciudad!: string;

  @Field()
  direccion!: string;

  @Field({ nullable: true })
  telefono?: string;
}
