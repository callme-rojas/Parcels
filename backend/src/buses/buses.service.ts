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
    // Actualizar el estado del bus a EN_RUTA al recibir coordenadas GPS (inicio de viaje)
    await this.prisma.bus.update({
      where: { id: input.busId },
      data: { estado: 'EN_RUTA' },
    });

    // Transicionar automáticamente a EN_TRANSITO las encomiendas asociadas que estén en RECEPCIONADO
    const pendingParcels = await this.prisma.parcel.findMany({
      where: {
        assignedBusId: input.busId,
        status: 'RECEPCIONADO',
      },
    });

    for (const parcel of pendingParcels) {
      await this.prisma.parcel.update({
        where: { id: parcel.id },
        data: { status: 'EN_TRANSITO' },
      });

      await this.prisma.parcelEvent.create({
        data: {
          parcelId: parcel.id,
          status: 'EN_TRANSITO',
          note: 'Encomienda en tránsito automáticamente tras inicio de viaje del bus',
        },
      });

      await this.markAssignmentLoaded(parcel.id);
    }

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

  /** Returns up to 24 GPS snapshots for the bus assigned to a parcel (oldest first). */
  async historialUbicacionesBus(parcelId: string): Promise<BusLocation[]> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      select: { assignedBusId: true },
    });

    if (!parcel?.assignedBusId) return [];

    const events = await this.prisma.busTrackingEvent.findMany({
      where: { busId: parcel.assignedBusId },
      orderBy: { recordedAt: 'asc' },
      take: 24,
    });

    return events.map((e) => ({
      busId: e.busId,
      lat: e.lat,
      lng: e.lng,
      velocidad: e.velocidad ?? undefined,
      recordedAt: e.recordedAt,
    }));
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

  async finalizarViaje(busId: string): Promise<boolean> {
    // 1. Cambiar el estado del bus a LISTO
    await this.prisma.bus.update({
      where: { id: busId },
      data: { estado: 'LISTO' },
    });

    // 2. Obtener todas las encomiendas asociadas a este bus que están RECEPCIONADO o EN_TRANSITO
    const parcels = await this.prisma.parcel.findMany({
      where: {
        assignedBusId: busId,
        status: { in: ['RECEPCIONADO', 'EN_TRANSITO'] },
      },
    });

    // 3. Cambiar su estado a EN_DESTINO, desasociar del bus y registrar el evento
    for (const parcel of parcels) {
      await this.prisma.parcel.update({
        where: { id: parcel.id },
        data: {
          status: 'EN_DESTINO',
          assignedBusId: null,
        },
      });

      await this.prisma.parcelEvent.create({
        data: {
          parcelId: parcel.id,
          status: 'EN_DESTINO',
          note: 'Encomienda arribada a destino automáticamente tras completar viaje del bus',
        },
      });

      // Marcar asignación de bus como inactiva/descargada
      await this.markAssignmentUnloaded(parcel.id);
    }

    return true;
  }
}
