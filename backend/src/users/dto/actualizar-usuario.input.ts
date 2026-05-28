import { Field, InputType } from '@nestjs/graphql';
import { Rol } from '../entities/rol.enum';

@InputType()
export class ActualizarUsuarioInput {
  @Field()
  id!: string;

  @Field({ nullable: true })
  nombre?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  telefono?: string;

  @Field(() => Rol, { nullable: true })
  rol?: Rol;

  @Field({ nullable: true })
  activo?: boolean;
}
