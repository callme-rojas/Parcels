import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BusesService } from './buses.service';
import { Bus } from './entities/bus.entity';
import { BusLocation } from './entities/bus-location.entity';
import { CrearBusInput } from './dto/crear-bus.input';
import { RegistrarCoordenadaBusInput } from './dto/registrar-coordenada-bus.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../users/entities/rol.enum';

@Resolver(() => Bus)
export class BusesResolver {
  constructor(private readonly busesService: BusesService) {}

  @Query(() => [Bus], {
    name: 'buses',
    description: 'Listar buses de la flota (filtro opcional por ruta)',
  })
  buses(
    @Args('routeCode', { nullable: true }) routeCode?: string,
    @Args('soloActivos', { nullable: true, defaultValue: true })
    soloActivos?: boolean,
  ): Promise<Bus[]> {
    return this.busesService.findAll(routeCode, soloActivos);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.BODEGA, Rol.ADMINISTRADOR)
  @Query(() => [Bus], {
    name: 'busesDisponibles',
    description: 'Buses activos en estado cargando/listo para asignar encomiendas',
  })
  busesDisponibles(
    @Args('routeCode', { nullable: true }) routeCode?: string,
  ): Promise<Bus[]> {
    return this.busesService.findDisponibles(routeCode);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.BODEGA, Rol.ADMINISTRADOR, Rol.TAQUILLA)
  @Query(() => Bus, { name: 'bus' })
  bus(@Args('id', { type: () => ID }) id: string): Promise<Bus> {
    return this.busesService.findOne(id);
  }

  @Query(() => BusLocation, {
    name: 'ultimaUbicacionBus',
    nullable: true,
    description: 'Última coordenada GPS registrada del bus',
  })
  ultimaUbicacionBus(
    @Args('busId', { type: () => ID }) busId: string,
  ): Promise<BusLocation | null> {
    return this.busesService.ultimaUbicacion(busId);
  }

  @Query(() => BusLocation, {
    name: 'ubicacionBusPorEncomienda',
    nullable: true,
    description: 'Última ubicación del bus asignado a la encomienda (pública)',
  })
  ubicacionBusPorEncomienda(
    @Args('parcelId', { type: () => ID }) parcelId: string,
  ): Promise<BusLocation | null> {
    return this.busesService.ubicacionPorEncomienda(parcelId);
  }

  @Query(() => [BusLocation], {
    name: 'historialUbicacionesBus',
    description: 'Historial de hasta 24 posiciones GPS del bus asignado a una encomienda (pública)',
  })
  historialUbicacionesBus(
    @Args('parcelId', { type: () => ID }) parcelId: string,
  ): Promise<BusLocation[]> {
    return this.busesService.historialUbicacionesBus(parcelId);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Mutation(() => Bus, { description: 'Registrar un bus en la flota' })
  crearBus(@Args('input') input: CrearBusInput): Promise<Bus> {
    return this.busesService.crearBus(input);
  }

  @Mutation(() => BusLocation, {
    description: 'Registrar coordenada GPS del bus (simulación de rastreo)',
  })
  registrarCoordenadaBus(
    @Args('input') input: RegistrarCoordenadaBusInput,
  ): Promise<BusLocation> {
    return this.busesService.registrarCoordenada(input);
  }

  @Mutation(() => Boolean, {
    description: 'Finalizar viaje del bus y descargar encomiendas a destino automáticamente',
  })
  finalizarViaje(
    @Args('busId', { type: () => ID }) busId: string,
  ): Promise<boolean> {
    return this.busesService.finalizarViaje(busId);
  }
}
