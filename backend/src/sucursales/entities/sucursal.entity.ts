import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Sucursal {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field()
  ciudad!: string;

  @Field()
  direccion!: string;

  @Field({ nullable: true })
  telefono?: string;

  @Field()
  activa!: boolean;
}
