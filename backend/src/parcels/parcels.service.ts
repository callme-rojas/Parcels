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
  constructor(private readonly prisma: PrismaService) {}

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

  async updateStatus(
    input: UpdateParcelStatusInput,
    usuarioId?: string,
  ): Promise<Parcel> {
    const parcel = await this.findOne(input.id);

    const allowed = VALID_TRANSITIONS[parcel.status];
    if (!allowed.includes(input.status)) {
      throw new BadRequestException(
        `No se puede pasar de "${parcel.status}" a "${input.status}". ` +
          `Transiciones válidas: ${allowed.join(', ') || 'ninguna'}`,
      );
    }

    const deliveredAt =
      input.status === ParcelStatus.ENTREGADO ? new Date() : undefined;

    const updated = await this.prisma.parcel.update({
      where: { id: parcel.id },
      data: {
        status: input.status,
        ...(deliveredAt ? { deliveredAt } : {}),
        events: {
          create: {
            status: input.status,
            note: input.note,
            usuarioId: usuarioId ?? null,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    return this.toEntity(updated);
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

  async remove(id: string): Promise<boolean> {
    await this.findOne(id);
    await this.prisma.parcel.delete({ where: { id } });
    return true;
  }
}
