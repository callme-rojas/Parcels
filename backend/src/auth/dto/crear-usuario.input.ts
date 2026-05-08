import { Field, InputType } from '@nestjs/graphql';
import { Rol } from '../../users/entities/rol.enum';

@InputType()
export class CrearUsuarioInput {
  @Field()
  nombre!: string;

  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field(() => Rol)
  rol!: Rol;
}

