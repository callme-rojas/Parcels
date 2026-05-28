import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ActualizarSucursalInput {
  @Field()
  id!: string;

  @Field({ nullable: true })
  nombre?: string;

  @Field({ nullable: true })
  ciudad?: string;

  @Field({ nullable: true })
  direccion?: string;

  @Field({ nullable: true })
  telefono?: string;

  @Field({ nullable: true })
  activa?: boolean;
}
