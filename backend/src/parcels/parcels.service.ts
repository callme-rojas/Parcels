import { Injectable, NotFoundException } from '@nestjs/common';
import { Parcel, ParcelStatus } from './entities/parcel.entity';
import { CreateParcelInput } from './dto/create-parcel.input';
import { UpdateParcelStatusInput } from './dto/update-parcel-status.input';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ParcelsService {
  // In-memory store (replace with a real DB later)
  private parcels: Parcel[] = [
    {
      id: '1',
      trackingNumber: 'TRV-2026-0001',
      senderName: 'Juan Pérez',
      recipientName: 'María García',
      originAddress: 'Caracas, Venezuela',
      destinationAddress: 'Miami, FL, USA',
      originLng: -66.9036,
      originLat: 10.4806,
      destinationLng: -80.1918,
      destinationLat: 25.7617,
      weight: 2.5,
      status: ParcelStatus.IN_TRANSIT,
      createdAt: new Date('2026-04-28'),
    },
    {
      id: '2',
      trackingNumber: 'TRV-2026-0002',
      senderName: 'Carlos López',
      recipientName: 'Ana Rodríguez',
      originAddress: 'Bogotá, Colombia',
      destinationAddress: 'Madrid, España',
      originLng: -74.0721,
      originLat: 4.711,
      destinationLng: -3.7038,
      destinationLat: 40.4168,
      weight: 5.0,
      status: ParcelStatus.PENDING,
      createdAt: new Date('2026-04-30'),
    },
    {
      id: '3',
      trackingNumber: 'TRV-2026-0003',
      senderName: 'Pedro Martínez',
      recipientName: 'Lucía Fernández',
      originAddress: 'Lima, Perú',
      destinationAddress: 'Buenos Aires, Argentina',
      originLng: -77.0428,
      originLat: -12.0464,
      destinationLng: -58.3816,
      destinationLat: -34.6037,
      weight: 1.2,
      status: ParcelStatus.DELIVERED,
      createdAt: new Date('2026-04-20'),
      deliveredAt: new Date('2026-04-27'),
    },
  ];

  findAll(): Parcel[] {
    return this.parcels;
  }

  findOne(id: string): Parcel {
    const parcel = this.parcels.find((p) => p.id === id);
    if (!parcel) {
      throw new NotFoundException(`Parcel with ID "${id}" not found`);
    }
    return parcel;
  }

  findByTrackingNumber(trackingNumber: string): Parcel {
    const parcel = this.parcels.find(
      (p) => p.trackingNumber === trackingNumber,
    );
    if (!parcel) {
      throw new NotFoundException(
        `Parcel with tracking number "${trackingNumber}" not found`,
      );
    }
    return parcel;
  }

  create(input: CreateParcelInput): Parcel {
    const newParcel: Parcel = {
      id: uuidv4(),
      trackingNumber: `TRV-2026-${String(this.parcels.length + 1).padStart(4, '0')}`,
      ...input,
      status: ParcelStatus.PENDING,
      createdAt: new Date(),
    };
    this.parcels.push(newParcel);
    return newParcel;
  }

  updateStatus(input: UpdateParcelStatusInput): Parcel {
    const parcel = this.findOne(input.id);
    parcel.status = input.status;
    if (input.status === ParcelStatus.DELIVERED) {
      parcel.deliveredAt = new Date();
    }
    return parcel;
  }

  remove(id: string): boolean {
    const index = this.parcels.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Parcel with ID "${id}" not found`);
    }
    this.parcels.splice(index, 1);
    return true;
  }
}
