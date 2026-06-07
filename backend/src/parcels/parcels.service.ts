import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Parcel, ParcelStatus } from './entities/parcel.entity';
import { CreateParcelInput } from './dto/create-parcel.input';
import { UpdateParcelStatusInput } from './dto/update-parcel-status.input';
import { ParcelsFilterInput } from './dto/parcels-filter.input';
import { ConfirmarRetiroInput } from './dto/confirmar-retiro.input';
import { AsignarBusInput } from './dto/asignar-bus.input';
import { AsignarEncomiendaBusInput } from '../buses/dto/asignar-encomienda-bus.input';
import { BusesService } from '../buses/buses.service';
import { PrismaService } from '../prisma/prisma.service';

// Transiciones de estado permitidas
const VALID_TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> = {
  [ParcelStatus.REGISTRADO]: [ParcelStatus.RECEPCIONADO, ParcelStatus.CANCELADO],
  [ParcelStatus.RECEPCIONADO]: [ParcelStatus.EN_TRANSITO, ParcelStatus.CANCELADO],
  [ParcelStatus.EN_TRANSITO]: [ParcelStatus.EN_DESTINO, ParcelStatus.CANCELADO],
  [ParcelStatus.EN_DESTINO]: [ParcelStatus.DISPONIBLE],
  [ParcelStatus.DISPONIBLE]: [ParcelStatus.ENTREGADO],
  [ParcelStatus.ENTREGADO]: [],
  [ParcelStatus.CANCELADO]: [],
};

// Rutas disponibles con coordenadas
const ROUTES: Record<
  string,
  {
    originAddress: string;
    destinationAddress: string;
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
  }
> = {
  'SCZ-PQA': {
    originAddress: 'Santa Cruz de la Sierra, Bolivia',
    destinationAddress: 'Puerto Quijarro, Bolivia',
    originLat: -17.786,
    originLng: -63.181,
    destinationLat: -18.953,
    destinationLng: -57.771,
  },
  'SCZ-SJC': {
    originAddress: 'Santa Cruz de la Sierra, Bolivia',
    destinationAddress: 'San José de Chiquitos, Bolivia',
    originLat: -17.786,
    originLng: -63.181,
    destinationLat: -16.973,
    destinationLng: -60.265,
  },
  'SCZ-ROB': {
    originAddress: 'Santa Cruz de la Sierra, Bolivia',
    destinationAddress: 'Roboré, Bolivia',
    originLat: -17.786,
    originLng: -63.181,
    destinationLat: -18.689,
    destinationLng: -57.643,
  },
  'PQA-SCZ': {
    originAddress: 'Puerto Quijarro, Bolivia',
    destinationAddress: 'Santa Cruz de la Sierra, Bolivia',
    originLat: -18.953,
    originLng: -57.771,
    destinationLat: -17.786,
    destinationLng: -63.181,
  },
};

@Injectable()
export class ParcelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly busesService: BusesService,
  ) {}

  private toEntity(p: any): Parcel {
    return {
      ...p,
      status: p.status as ParcelStatus,
      events: p.events?.map((e: any) => ({
        ...e,
        status: e.status as ParcelStatus,
      })),
    } as Parcel;
  }

  // ─── Queries ────────────────────────────────────────────

  async findAll(filter?: ParcelsFilterInput): Promise<Parcel[]> {
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.routeCode) {
      where.routeCode = filter.routeCode;
    }
    if (filter?.search) {
      const s = filter.search;
      where.OR = [
        { trackingNumber: { contains: s, mode: 'insensitive' } },
        { senderName: { contains: s, mode: 'insensitive' } },
        { recipientName: { contains: s, mode: 'insensitive' } },
        { senderCi: { contains: s, mode: 'insensitive' } },
        { recipientCi: { contains: s, mode: 'insensitive' } },
      ];
    }

    const parcels = await this.prisma.parcel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    return parcels.map((p) => this.toEntity(p));
  }

  async findOne(id: string): Promise<Parcel> {
    const p = await this.prisma.parcel.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!p) throw new NotFoundException(`Encomienda con ID "${id}" no encontrada`);
    return this.toEntity(p);
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Parcel> {
    const p = await this.prisma.parcel.findUnique({
      where: { trackingNumber },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!p)
      throw new NotFoundException(
        `No existe encomienda con código "${trackingNumber}"`,
      );
    return this.toEntity(p);
  }

  // ─── Mutations ──────────────────────────────────────────

  calcularCostoEnvioInterno(
    routeCode: string,
    weight: number,
    largoCm?: number,
    anchoCm?: number,
    altoCm?: number,
    esFragil?: boolean,
  ): number {
    let basePrice = 30;
    let ratePerKg = 3;

    if (routeCode === 'SCZ-PQA' || routeCode === 'PQA-SCZ') {
      basePrice = 50;
      ratePerKg = 4;
    } else if (routeCode === 'SCZ-SJC') {
      basePrice = 30;
      ratePerKg = 3;
    } else if (routeCode === 'SCZ-ROB') {
      basePrice = 40;
      ratePerKg = 3.5;
    }

    const volWeight =
      largoCm && anchoCm && altoCm
        ? (largoCm * anchoCm * altoCm) / 5000
        : 0;

    const chargeableWeight = Math.max(weight, volWeight);
    let total = basePrice + chargeableWeight * ratePerKg;

    if (esFragil) {
      total = total * 1.2; // +20% para artículos frágiles
    }

    return Math.round(total * 100) / 100;
  }

  async create(input: CreateParcelInput, usuarioId?: string): Promise<Parcel> {
    const route = ROUTES[input.routeCode];
    if (!route)
      throw new NotFoundException(
        `Ruta "${input.routeCode}" no existe. Rutas válidas: ${Object.keys(ROUTES).join(', ')}`,
      );

    const now = new Date();
    const year = now.getFullYear();
    const prefix = input.routeCode.split('-')[0];
    const randomNum = Math.floor(Math.random() * 900000 + 100000);
    const trackingNumber = `EX-${year}-${prefix}-00${randomNum}`;

    const costoEnvio = this.calcularCostoEnvioInterno(
      input.routeCode,
      input.weight,
      input.largoCm,
      input.anchoCm,
      input.altoCm,
      input.esFragil,
    );

    const created = await this.prisma.parcel.create({
      data: {
        trackingNumber,
        senderName: input.senderName,
        senderCi: input.senderCi,
        senderPhone: input.senderPhone,
        senderEmail: input.senderEmail,
        recipientName: input.recipientName,
        recipientCi: input.recipientCi,
        recipientPhone: input.recipientPhone,
        recipientEmail: input.recipientEmail,
        content: input.content,
        weight: input.weight,
        observations: input.observations,
        routeCode: input.routeCode,
        originAddress: route.originAddress,
        destinationAddress: route.destinationAddress,
        originLat: route.originLat,
        originLng: route.originLng,
        destinationLat: route.destinationLat,
        destinationLng: route.destinationLng,
        status: ParcelStatus.REGISTRADO,
        largoCm: input.largoCm ?? null,
        anchoCm: input.anchoCm ?? null,
        altoCm: input.altoCm ?? null,
        categoria: input.categoria ? (input.categoria as any) : null,
        esFragil: input.esFragil ?? false,
        costoEnvio,
        estadoPago: 'PENDIENTE',
        tipoPago: input.tipoPago ?? 'REMITENTE',
        metodoPago: input.metodoPago ?? null,
        events: {
          create: {
            status: ParcelStatus.REGISTRADO,
            note: 'Encomienda registrada en el sistema',
            usuarioId: usuarioId ?? null,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    return this.toEntity(created);
  }

  private assertTransition(current: ParcelStatus, next: ParcelStatus) {
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `No se puede pasar de "${current}" a "${next}". ` +
          `Transiciones válidas: ${allowed.join(', ') || 'ninguna'}`,
      );
    }
  }

  private async transitionTo(
    parcelId: string,
    newStatus: ParcelStatus,
    usuarioId: string | undefined,
    note?: string,
    extraData: Record<string, unknown> = {},
  ): Promise<Parcel> {
    const parcel = await this.findOne(parcelId);
    this.assertTransition(parcel.status, newStatus);

    const deliveredAt =
      newStatus === ParcelStatus.ENTREGADO ? new Date() : undefined;

    const updated = await this.prisma.parcel.update({
      where: { id: parcel.id },
      data: {
        status: newStatus,
        ...(deliveredAt ? { deliveredAt } : {}),
        ...extraData,
        events: {
          create: {
            status: newStatus,
            note: note ?? null,
            usuarioId: usuarioId ?? null,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    return this.toEntity(updated);
  }

  private async appendOperationalEvent(
    parcelId: string,
    currentStatus: ParcelStatus,
    usuarioId: string | undefined,
    note: string,
    extraData: Record<string, unknown> = {},
  ): Promise<Parcel> {
    await this.findOne(parcelId);

    const updated = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        ...extraData,
        events: {
          create: {
            status: currentStatus,
            note,
            usuarioId: usuarioId ?? null,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    return this.toEntity(updated);
  }

  async updateStatus(
    input: UpdateParcelStatusInput,
    usuarioId?: string,
  ): Promise<Parcel> {
    return this.transitionTo(
      input.id,
      input.status,
      usuarioId,
      input.note,
    );
  }

  // ─── Bodega (Fase 2 / 3) ─────────────────────────────────

  /** Marca encomienda como clasificada (sigue en RECEPCIONADO). */
  async clasificarEncomienda(
    parcelId: string,
    usuarioId?: string,
    note?: string,
  ): Promise<Parcel> {
    const parcel = await this.findOne(parcelId);
    if (parcel.status !== ParcelStatus.RECEPCIONADO) {
      throw new BadRequestException(
        `Solo se pueden clasificar encomiendas en RECEPCIONADO. Estado actual: "${parcel.status}"`,
      );
    }

    return this.appendOperationalEvent(
      parcelId,
      ParcelStatus.RECEPCIONADO,
      usuarioId,
      note ?? 'Clasificada en bodega',
    );
  }

  /**
   * Asigna encomienda a un bus registrado (Fase 3).
   * Valida ruta, capacidad y crea registro en parcel_bus_assignments.
   */
  async asignarEncomiendaABus(
    input: AsignarEncomiendaBusInput,
    usuarioId?: string,
  ): Promise<Parcel> {
    const parcel = await this.findOne(input.parcelId);
    if (parcel.status !== ParcelStatus.RECEPCIONADO) {
      throw new BadRequestException(
        `Solo se puede asignar bus en RECEPCIONADO. Estado actual: "${parcel.status}"`,
      );
    }

    const bus = await this.busesService.findOneOrThrow(input.busId);
    if (bus.routeCode !== parcel.routeCode) {
      throw new BadRequestException(
        `La ruta del bus (${bus.routeCode}) no coincide con la de la encomienda (${parcel.routeCode})`,
      );
    }

    await this.busesService.assertCapacity(bus.id, bus.capacidad);

    await this.prisma.parcelBusAssignment.updateMany({
      where: { parcelId: input.parcelId, isActive: true },
      data: { isActive: false },
    });

    await this.prisma.parcelBusAssignment.create({
      data: { parcelId: input.parcelId, busId: bus.id },
    });

    const note =
      input.note ?? `Asignada a ${bus.flota} · placa ${bus.placa}`;

    return this.appendOperationalEvent(
      input.parcelId,
      ParcelStatus.RECEPCIONADO,
      usuarioId,
      note,
      {
        assignedBusId: bus.id,
        assignedBusPlaca: bus.placa,
        assignedBusFlota: bus.flota,
      },
    );
  }

  /**
   * Asignación manual por placa (compat. Fase 2).
   * Si la placa existe en BD, delega a asignarEncomiendaABus.
   */
  async asignarBus(input: AsignarBusInput, usuarioId?: string): Promise<Parcel> {
    const busRow = await this.prisma.bus.findUnique({
      where: { placa: input.busPlaca.trim() },
    });

    if (busRow) {
      return this.asignarEncomiendaABus(
        {
          parcelId: input.parcelId,
          busId: busRow.id,
          note: input.note,
        },
        usuarioId,
      );
    }

    const parcel = await this.findOne(input.parcelId);
    if (parcel.status !== ParcelStatus.RECEPCIONADO) {
      throw new BadRequestException(
        `Solo se puede asignar bus en RECEPCIONADO. Estado actual: "${parcel.status}"`,
      );
    }

    const flota = input.busFlota?.trim() || 'Sin flota';
    const note =
      input.note ??
      `Asignada a ${flota} · placa ${input.busPlaca}`;

    return this.appendOperationalEvent(
      input.parcelId,
      ParcelStatus.RECEPCIONADO,
      usuarioId,
      note,
      {
        assignedBusPlaca: input.busPlaca,
        assignedBusFlota: flota,
      },
    );
  }

  /** Carga en bus → EN_TRANSITO (requiere bus asignado). */
  async registrarCarga(
    parcelId: string,
    usuarioId?: string,
    note?: string,
  ): Promise<Parcel> {
    const parcel = await this.findOne(parcelId);

    if (!parcel.assignedBusId && !parcel.assignedBusPlaca) {
      throw new BadRequestException(
        'Debe asignar un bus a la encomienda antes de registrar la carga',
      );
    }

    const busLabel =
      parcel.assignedBusFlota && parcel.assignedBusPlaca
        ? `${parcel.assignedBusFlota} · ${parcel.assignedBusPlaca}`
        : 'bus no especificado';

    const updated = await this.transitionTo(
      parcelId,
      ParcelStatus.EN_TRANSITO,
      usuarioId,
      note ?? `Cargada en ${busLabel}`,
    );

    await this.busesService.markAssignmentLoaded(parcelId);
    return updated;
  }

  /** Descarga en destino → EN_DESTINO */
  async registrarDescarga(
    parcelId: string,
    usuarioId?: string,
    note?: string,
  ): Promise<Parcel> {
    const updated = await this.transitionTo(
      parcelId,
      ParcelStatus.EN_DESTINO,
      usuarioId,
      note ?? 'Descargada en terminal de destino',
    );

    await this.busesService.markAssignmentUnloaded(parcelId);
    return updated;
  }

  /** Disponible para retiro en ventanilla → DISPONIBLE */
  async marcarDisponible(
    parcelId: string,
    usuarioId?: string,
    note?: string,
  ): Promise<Parcel> {
    return this.transitionTo(
      parcelId,
      ParcelStatus.DISPONIBLE,
      usuarioId,
      note ?? 'Disponible para retiro en ventanilla',
    );
  }

  async confirmarRetiro(
    input: ConfirmarRetiroInput,
    usuarioId?: string,
  ): Promise<Parcel> {
    const parcel = await this.findOne(input.parcelId);

    if (parcel.status !== ParcelStatus.DISPONIBLE) {
      throw new BadRequestException(
        `La encomienda no está disponible para retiro. Estado actual: "${parcel.status}"`,
      );
    }

    // Normalize CI for comparison (remove spaces and uppercase)
    const normalize = (ci: string) => ci.replace(/\s/g, '').toUpperCase();
    if (normalize(parcel.recipientCi) !== normalize(input.recipientCi)) {
      throw new BadRequestException(
        'El CI ingresado no coincide con el del destinatario registrado.',
      );
    }

    const updated = await this.prisma.parcel.update({
      where: { id: parcel.id },
      data: {
        status: ParcelStatus.ENTREGADO,
        deliveredAt: new Date(),
        events: {
          create: {
            status: ParcelStatus.ENTREGADO,
            note: `Entregada al destinatario. CI verificado: ${input.recipientCi}`,
            usuarioId: usuarioId ?? null,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    return this.toEntity(updated);
  }

  async registrarPago(id: string, metodoPago?: string) {
    await this.findOne(id);
    const updated = await this.prisma.parcel.update({
      where: { id },
      data: {
        estadoPago: 'PAGADO',
        pagadoEn: new Date(),
        metodoPago: metodoPago || null,
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return this.toEntity(updated);
  }

  async remove(id: string): Promise<boolean> {
    await this.findOne(id);
    await this.prisma.parcel.delete({ where: { id } });
    return true;
  }
}
