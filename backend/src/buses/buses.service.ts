import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Bus } from './entities/bus.entity';
import { BusEstado } from './entities/bus-estado.enum';
import { BusLocation } from './entities/bus-location.entity';
import { CrearBusInput } from './dto/crear-bus.input';
import { RegistrarCoordenadaBusInput } from './dto/registrar-coordenada-bus.input';
import { ParcelStatus } from '../parcels/entities/parcel.entity';

export const ROUTE_LABELS: Record<string, string> = {
  'SCZ-PQA': 'Santa Cruz → Puerto Quijarro',
  'SCZ-SJC': 'Santa Cruz → San José de Chiquitos',
  'SCZ-ROB': 'Santa Cruz → Roboré',
  'PQA-SCZ': 'Puerto Quijarro → Santa Cruz',
};

const CARGADOS_STATUSES = [
  ParcelStatus.RECEPCIONADO,
  ParcelStatus.EN_TRANSITO,
] as const;

@Injectable()
export class BusesService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveRouteLabel(routeCode: string, override?: string): string {
    return override?.trim() || ROUTE_LABELS[routeCode] || routeCode;
  }

  private mapEstado(estado: string): BusEstado {
    return estado as BusEstado;
  }

  private async countCargados(busId: string): Promise<number> {
    return this.prisma.parcel.count({
      where: {
        assignedBusId: busId,
        status: { in: [...CARGADOS_STATUSES] },
      },
    });
  }

  private async toBusEntity(
    row: {
      id: string;
      placa: string;
      modelo: string | null;
      flota: string;
      routeCode: string;
      routeLabel: string;
      capacidad: number;
      estado: string;
      activo: boolean;
      salidaProgramada: string | null;
      conductor: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    cargados?: number,
  ): Promise<Bus> {
    return {
      ...row,
      modelo: row.modelo ?? undefined,
      estado: this.mapEstado(row.estado),
      salidaProgramada: row.salidaProgramada ?? undefined,
      conductor: row.conductor ?? undefined,
      cargados: cargados ?? (await this.countCargados(row.id)),
    };
  }

  async findAll(routeCode?: string, soloActivos = true): Promise<Bus[]> {
    const rows = await this.prisma.bus.findMany({
      where: {
        ...(soloActivos ? { activo: true } : {}),
        ...(routeCode ? { routeCode } : {}),
      },
      orderBy: [{ routeCode: 'asc' }, { flota: 'asc' }],
    });

    return Promise.all(rows.map((r) => this.toBusEntity(r)));
  }

  async findDisponibles(routeCode?: string): Promise<Bus[]> {
    const rows = await this.prisma.bus.findMany({
      where: {
        activo: true,
        estado: { in: ['CARGANDO', 'LISTO'] },
        ...(routeCode ? { routeCode } : {}),
      },
      orderBy: [{ routeCode: 'asc' }, { flota: 'asc' }],
    });

    return Promise.all(rows.map((r) => this.toBusEntity(r)));
  }

  async findOne(id: string): Promise<Bus> {
    const row = await this.prisma.bus.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Bus ${id} no encontrado`);
    return this.toBusEntity(row);
  }

  async findOneOrThrow(id: string) {
    const row = await this.prisma.bus.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Bus ${id} no encontrado`);
    if (!row.activo) {
      throw new BadRequestException('El bus no está activo');
    }
    return row;
  }

  async assertCapacity(busId: string, capacidad: number): Promise<void> {
    const cargados = await this.countCargados(busId);
    if (cargados >= capacidad) {
      throw new BadRequestException(
        `El bus ya alcanzó su capacidad (${cargados}/${capacidad} encomiendas)`,
      );
    }
  }

  async crearBus(input: CrearBusInput): Promise<Bus> {
    if (!ROUTE_LABELS[input.routeCode] && !input.routeLabel) {
      throw new BadRequestException(
        `Ruta "${input.routeCode}" no reconocida. Use routeLabel o una ruta válida: ${Object.keys(ROUTE_LABELS).join(', ')}`,
      );
    }

    const created = await this.prisma.bus.create({
      data: {
        placa: input.placa.trim(),
        modelo: input.modelo?.trim(),
        flota: input.flota.trim(),
        routeCode: input.routeCode,
        routeLabel: this.resolveRouteLabel(input.routeCode, input.routeLabel),
        capacidad: input.capacidad ?? 30,
        estado: input.estado ?? BusEstado.CARGANDO,
        salidaProgramada: input.salidaProgramada,
        conductor: input.conductor,
      },
    });

    return this.toBusEntity(created, 0);
  }

  async registrarCoordenada(
    input: RegistrarCoordenadaBusInput,
  ): Promise<BusLocation> {

    const event = await this.prisma.busTrackingEvent.create({
      data: {
        busId: input.busId,
        lat: input.lat,
        lng: input.lng,
        velocidad: input.velocidad,
        recordedAt: input.recordedAt ?? new Date(),
      },
    });

    return {
      busId: event.busId,
      lat: event.lat,
      lng: event.lng,
      velocidad: event.velocidad ?? undefined,
      recordedAt: event.recordedAt,
    };
  }

  async ultimaUbicacion(busId: string): Promise<BusLocation | null> {
    await this.findOne(busId);

    const event = await this.prisma.busTrackingEvent.findFirst({
      where: { busId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!event) return null;

    return {
      busId: event.busId,
      lat: event.lat,
      lng: event.lng,
      velocidad: event.velocidad ?? undefined,
      recordedAt: event.recordedAt,
    };
  }

  async ubicacionPorEncomienda(parcelId: string): Promise<BusLocation | null> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      select: { assignedBusId: true },
    });

    if (!parcel?.assignedBusId) return null;

    return this.ultimaUbicacion(parcel.assignedBusId);
  }

  async markAssignmentLoaded(parcelId: string): Promise<void> {
    await this.prisma.parcelBusAssignment.updateMany({
      where: { parcelId, isActive: true, loadedAt: null },
      data: { loadedAt: new Date() },
    });
  }

  async markAssignmentUnloaded(parcelId: string): Promise<void> {
    await this.prisma.parcelBusAssignment.updateMany({
      where: { parcelId, isActive: true },
      data: { unloadedAt: new Date(), isActive: false },
    });
  }
}
