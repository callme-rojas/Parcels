import { Resolver, Query, Mutation, Args, ID, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Parcel } from './entities/parcel.entity';
import { ParcelsService } from './parcels.service';
import { CreateParcelInput } from './dto/create-parcel.input';
import { UpdateParcelStatusInput } from './dto/update-parcel-status.input';
import { ParcelsFilterInput } from './dto/parcels-filter.input';
import { ConfirmarRetiroInput } from './dto/confirmar-retiro.input';
import { ParcelActionInput } from './dto/parcel-action.input';
import { AsignarBusInput } from './dto/asignar-bus.input';
import { AsignarEncomiendaBusInput } from '../buses/dto/asignar-encomienda-bus.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { Rol } from '../users/entities/rol.enum';

@Resolver(() => Parcel)
export class ParcelsResolver {
  constructor(private readonly parcelsService: ParcelsService) {}

  // ─── QUERIES ──────────────────────────────────────────────────────

  /**
   * Listar encomiendas con filtros opcionales.
   * Requiere autenticación (personal interno).
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => [Parcel], {
    name: 'parcels',
    description: 'Listar encomiendas con filtros (requiere auth)',
  })
  findAll(
    @Args('filter', { nullable: true }) filter?: ParcelsFilterInput,
  ): Promise<Parcel[]> {
    return this.parcelsService.findAll(filter);
  }

  /**
   * Obtener encomienda por ID.
   * Requiere autenticación.
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => Parcel, {
    name: 'parcel',
    description: 'Obtener encomienda por ID (requiere auth)',
  })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<Parcel> {
    return this.parcelsService.findOne(id);
  }

  /**
   * Rastreo público por número de tracking — NO requiere auth.
   * Usado por destinatarios para consultar su envío.
   */
  @Query(() => Parcel, {
    name: 'parcelByTracking',
    description: 'Rastrear encomienda por código (pública, sin auth)',
  })
  findByTrackingNumber(
    @Args('trackingNumber') trackingNumber: string,
  ): Promise<Parcel> {
    return this.parcelsService.findByTrackingNumber(trackingNumber);
  }

  @Query(() => Float, {
    name: 'calcularCostoEnvio',
    description: 'Calcular costo estimado de envío según dimensiones, peso y ruta',
  })
  calcularCostoEnvio(
    @Args('routeCode') routeCode: string,
    @Args('weight') weight: number,
    @Args('largoCm', { type: () => Float, nullable: true }) largoCm?: number,
    @Args('anchoCm', { type: () => Float, nullable: true }) anchoCm?: number,
    @Args('altoCm', { type: () => Float, nullable: true }) altoCm?: number,
    @Args('esFragil', { type: () => Boolean, nullable: true }) esFragil?: boolean,
  ): number {
    return this.parcelsService.calcularCostoEnvioInterno(
      routeCode,
      weight,
      largoCm,
      anchoCm,
      altoCm,
      esFragil,
    );
  }

  // ─── MUTATIONS ────────────────────────────────────────────────────

  /**
   * Crear encomienda (pública, sin auth).
   */
  @Mutation(() => Parcel, {
    description: 'Crear encomienda (pública, sin auth)',
  })
  createParcel(
    @Args('input') input: CreateParcelInput,
  ): Promise<Parcel> {
    // Sin usuarioId — flujo público sin cuenta
    return this.parcelsService.create(input);
  }

  /**
   * Crear encomienda autenticado — registra el usuario que creó el envío.
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Parcel, {
    description: 'Crear encomienda (autenticado — registra usuario creador)',
  })
  createParcelAuth(
    @Args('input') input: CreateParcelInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.create(input, user.sub);
  }

  /**
   * Actualizar estado — TAQUILLA y BODEGA.
   */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.TAQUILLA, Rol.BODEGA, Rol.ADMINISTRADOR)
  @Mutation(() => Parcel, {
    description: 'Actualizar estado de encomienda (TAQUILLA / BODEGA)',
  })
  updateParcelStatus(
    @Args('input') input: UpdateParcelStatusInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.updateStatus(input, user.sub);
  }

  // ─── Bodega (Fase 2) ─────────────────────────────────────────────

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.BODEGA, Rol.ADMINISTRADOR)
  @Mutation(() => Parcel, {
    description: 'Clasificar encomienda en bodega (RECEPCIONADO)',
  })
  clasificarEncomienda(
    @Args('input') input: ParcelActionInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.clasificarEncomienda(
      input.parcelId,
      user.sub,
      input.note,
    );
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.BODEGA, Rol.ADMINISTRADOR)
  @Mutation(() => Parcel, {
    description:
      'Asignar encomienda a bus por ID (RECEPCIONADO, valida ruta y capacidad)',
  })
  asignarEncomiendaABus(
    @Args('input') input: AsignarEncomiendaBusInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.asignarEncomiendaABus(input, user.sub);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.BODEGA, Rol.ADMINISTRADOR)
  @Mutation(() => Parcel, {
    description:
      'Asignar por placa/flota (legacy; usa bus en BD si la placa existe)',
  })
  asignarBus(
    @Args('input') input: AsignarBusInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.asignarBus(input, user.sub);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.BODEGA, Rol.ADMINISTRADOR)
  @Mutation(() => Parcel, {
    description: 'Registrar carga en bus → EN_TRANSITO',
  })
  registrarCarga(
    @Args('input') input: ParcelActionInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.registrarCarga(
      input.parcelId,
      user.sub,
      input.note,
    );
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.BODEGA, Rol.ADMINISTRADOR)
  @Mutation(() => Parcel, {
    description: 'Registrar descarga en destino → EN_DESTINO',
  })
  registrarDescarga(
    @Args('input') input: ParcelActionInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.registrarDescarga(
      input.parcelId,
      user.sub,
      input.note,
    );
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.BODEGA, Rol.ADMINISTRADOR)
  @Mutation(() => Parcel, {
    description: 'Marcar disponible para retiro → DISPONIBLE',
  })
  marcarDisponible(
    @Args('input') input: ParcelActionInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.marcarDisponible(
      input.parcelId,
      user.sub,
      input.note,
    );
  }

  /**
   * Confirmar retiro — solo TAQUILLA.
   * Valida CI del destinatario y pasa a ENTREGADO.
   */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.TAQUILLA, Rol.ADMINISTRADOR)
  @Mutation(() => Parcel, {
    description: 'Confirmar retiro de encomienda con verificación de CI (TAQUILLA)',
  })
  confirmarRetiro(
    @Args('input') input: ConfirmarRetiroInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Parcel> {
    return this.parcelsService.confirmarRetiro(input, user.sub);
  }

  /**
   * Eliminar encomienda — solo ADMINISTRADOR.
   */
  @Mutation(() => Parcel, {
    description: 'Registrar/simular pago de una encomienda (Público para Simulación QR)',
  })
  registrarPago(
    @Args('id', { type: () => ID }) id: string,
    @Args('metodoPago', { type: () => String, nullable: true }) metodoPago?: string,
  ): Promise<Parcel> {
    return this.parcelsService.registrarPago(id, metodoPago);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Mutation(() => Boolean, {
    description: 'Eliminar encomienda (solo ADMINISTRADOR)',
  })
  removeParcel(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.parcelsService.remove(id);
  }
}
