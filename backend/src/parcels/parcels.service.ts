import { Injectable, NotFoundException } from '@nestjs/common';
import { Parcel, ParcelStatus } from './entities/parcel.entity';
import { CreateParcelInput } from './dto/create-parcel.input';
import { UpdateParcelStatusInput } from './dto/update-parcel-status.input';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParcelsService {
  private readonly ROUTES: Record<
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
      originAddress: 'Santa Cruz, Bolivia',
      destinationAddress: 'Puerto Quijarro, Bolivia',
      originLat: -17.786, // approx
      originLng: -63.181,
      destinationLat: -18.953,
      destinationLng: -57.771,
    },
    'SCZ-SJC': {
      originAddress: 'Santa Cruz, Bolivia',
      destinationAddress: 'San José de Chiquitos, Bolivia',
      originLat: -17.786,
      originLng: -63.181,
      destinationLat: -16.973,
      destinationLng: -60.265,
    },
    'SCZ-ROB': {
      originAddress: 'Santa Cruz, Bolivia',
      destinationAddress: 'Roboré, Bolivia',
      originLat: -17.786,
      originLng: -63.181,
      destinationLat: -18.689,
      destinationLng: -57.643,
    },
    'PQA-SCZ': {
      originAddress: 'Puerto Quijarro, Bolivia',
      destinationAddress: 'Santa Cruz, Bolivia',
      originLat: -18.953,
      originLng: -57.771,
      destinationLat: -17.786,
      destinationLng: -63.181,
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  private toGraphqlParcel(p: any): Parcel {
    return {
      ...p,
      status: p.status as unknown as ParcelStatus,
    } as Parcel;
  }

  async findAll(): Promise<Parcel[]> {
    const parcels = await this.prisma.parcel.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return parcels.map((p) => this.toGraphqlParcel(p));
  }

  async findOne(id: string): Promise<Parcel> {
    const p = await this.prisma.parcel.findUnique({ where: { id } });
    if (!p) {
      throw new NotFoundException(`Parcel with ID "${id}" not found`);
    }
    return this.toGraphqlParcel(p);
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Parcel> {
    const p = await this.prisma.parcel.findUnique({ where: { trackingNumber } });
    if (!p) {
      throw new NotFoundException(
        `Parcel with tracking number "${trackingNumber}" not found`,
      );
    }
    return this.toGraphqlParcel(p);
  }

  async create(input: CreateParcelInput): Promise<Parcel> {
    const now = new Date();

    let originAddress = input.originAddress;
    let destinationAddress = input.destinationAddress;
    let originLat = input.originLat;
    let originLng = input.originLng;
    let destinationLat = input.destinationLat;
    let destinationLng = input.destinationLng;

    if (input.routeCode) {
      const route = this.ROUTES[input.routeCode];
      if (!route)
        throw new NotFoundException(`Ruta "${input.routeCode}" no existe`);
      originAddress = route.originAddress;
      destinationAddress = route.destinationAddress;
      originLat = route.originLat;
      originLng = route.originLng;
      destinationLat = route.destinationLat;
      destinationLng = route.destinationLng;
    }

    if (
      originAddress == null ||
      destinationAddress == null ||
      originLat == null ||
      originLng == null ||
      destinationLat == null ||
      destinationLng == null
    ) {
      throw new NotFoundException(
        'Para crear un envío debes proporcionar routeCode o todos los campos de origen/destino',
      );
    }

    const year = now.getFullYear();
    const routeCode = input.routeCode ?? 'UNK';
    const rutaCode = routeCode.split('-')[0];
    const randomNum = Math.floor(Math.random() * 900000 + 100000);
    const trackingNumber = `EX-${year}-${rutaCode}-00${randomNum}`;

    const created = await this.prisma.parcel.create({
      data: {
        trackingNumber,
        senderName: input.senderName,
        recipientName: input.recipientName,
        originAddress,
        destinationAddress,
        originLng,
        originLat,
        destinationLng,
        destinationLat,
        weight: input.weight,
        status: ParcelStatus.PENDING,
        createdAt: now,
      },
    });
    return this.toGraphqlParcel(created);
  }

  async updateStatus(input: UpdateParcelStatusInput): Promise<Parcel> {
    const p = await this.findOne(input.id);
    const deliveredAt =
      input.status === ParcelStatus.DELIVERED ? new Date() : null;

    const updated = await this.prisma.parcel.update({
      where: { id: p.id },
      data: {
        status: input.status,
        deliveredAt,
      },
    });
    return this.toGraphqlParcel(updated);
  }

  async remove(id: string): Promise<boolean> {
    await this.findOne(id);
    await this.prisma.parcel.delete({ where: { id } });
    return true;
  }
}
