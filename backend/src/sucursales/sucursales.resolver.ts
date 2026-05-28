import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { Sucursal } from './entities/sucursal.entity';
import { CrearSucursalInput } from './dto/crear-sucursal.input';
import { ActualizarSucursalInput } from './dto/actualizar-sucursal.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../users/entities/rol.enum';

@Resolver(() => Sucursal)
export class SucursalesResolver {
  constructor(private readonly sucursalesService: SucursalesService) {}

  private toGraphqlSucursal(s: any): Sucursal {
    return {
      id: s.id,
      nombre: s.nombre,
      ciudad: s.ciudad,
      direccion: s.direccion,
      telefono: s.telefono ?? undefined,
      activa: s.activa,
    };
  }

  @Query(() => [Sucursal], { name: 'sucursales', description: 'Listar todas las sucursales' })
  async sucursales(): Promise<Sucursal[]> {
    const list = await this.sucursalesService.findAll();
    return list.map((s) => this.toGraphqlSucursal(s));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Mutation(() => Sucursal, { name: 'crearSucursal', description: 'Registrar una nueva sucursal (solo Admin)' })
  async crearSucursal(
    @Args('input') input: CrearSucursalInput,
  ): Promise<Sucursal> {
    const created = await this.sucursalesService.create(input);
    return this.toGraphqlSucursal(created);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Mutation(() => Sucursal, { name: 'actualizarSucursal', description: 'Actualizar una sucursal existente (solo Admin)' })
  async actualizarSucursal(
    @Args('input') input: ActualizarSucursalInput,
  ): Promise<Sucursal> {
    const { id, ...data } = input;
    const updated = await this.sucursalesService.update(id, data);
    return this.toGraphqlSucursal(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Mutation(() => Sucursal, { name: 'toggleSucursalActiva', description: 'Activar/Desactivar una sucursal (solo Admin)' })
  async toggleSucursalActiva(
    @Args('id', { type: () => ID }) id: string,
    @Args('activa') activa: boolean,
  ): Promise<Sucursal> {
    const updated = await this.sucursalesService.update(id, { activa });
    return this.toGraphqlSucursal(updated);
  }
}
