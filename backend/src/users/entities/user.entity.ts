import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Rol } from './rol.enum';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field()
  email!: string;

  @Field(() => Rol)
  rol!: Rol;

  @Field()
  activo!: boolean;
}

