import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Parcel } from './entities/parcel.entity';
import { ParcelsService } from './parcels.service';
import { CreateParcelInput } from './dto/create-parcel.input';
import { UpdateParcelStatusInput } from './dto/update-parcel-status.input';
import { ParcelsFilterInput } from './dto/parcels-filter.input';
import { ConfirmarRetiroInput } from './dto/confirmar-retiro.input';
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

  // ─── MUTATIONS ────────────────────────────────────────────────────

  /**
   * Crear encomienda.
   * Pública: permite registro sin cuenta (senderCi, phone, email obligatorios).
   * Si hay sesión activa, el usuarioId se registra en el evento.
   */
  @Query(() => Parcel, {
    name: 'createParcelPublic',
    description: 'Crear encomienda sin autenticación (flujo público)',
  })
  // Nota: usamos Query temporalmente para exponer sin auth — luego el frontend
  // usará mutation. El guard opcional se maneja con try/catch en el servicio.
  @Mutation(() => Parcel, {
    description: 'Crear encomienda (pública o autenticada)',
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
