import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Rol } from './entities/rol.enum';
import { ActualizarUsuarioInput } from './dto/actualizar-usuario.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  private toGraphqlUser(user: any): User {
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono ?? undefined,
      rol: user.rol,
      activo: user.activo,
    };
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Query(() => [User], { name: 'users', description: 'Listar todos los usuarios (solo Admin)' })
  async users(): Promise<User[]> {
    const list = await this.usersService.findAll();
    return list.map((u) => this.toGraphqlUser(u));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Mutation(() => User, { name: 'actualizarUsuario', description: 'Actualizar datos de un usuario (solo Admin)' })
  async actualizarUsuario(
    @Args('input') input: ActualizarUsuarioInput,
  ): Promise<User> {
    const updated = await this.usersService.update(input.id, input);
    return this.toGraphqlUser(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Mutation(() => User, { name: 'toggleUsuarioActivo', description: 'Activar/Desactivar un usuario (solo Admin)' })
  async toggleUsuarioActivo(
    @Args('id') id: string,
    @Args('activo') activo: boolean,
  ): Promise<User> {
    const updated = await this.usersService.update(id, { activo });
    return this.toGraphqlUser(updated);
  }
}
