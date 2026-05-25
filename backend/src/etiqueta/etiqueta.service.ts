import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bwipjs from 'bwip-js';

@Injectable()
export class EtiquetaService {
  constructor(private readonly prisma: PrismaService) {}

  async generarEtiquetaBase64(parcelId: string): Promise<string> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel) {
      throw new NotFoundException(`No se encontró la encomienda con ID "${parcelId}"`);
    }

    // Construct structured compact JSON text to encode in PDF417
    const barcodeData = JSON.stringify({
      t: parcel.trackingNumber,
      r: parcel.routeCode,
      s: parcel.senderName,
      d: parcel.recipientName,
      w: parcel.weight,
      dt: parcel.createdAt.toISOString().split('T')[0],
    });

    return new Promise((resolve, reject) => {
      bwipjs.toBuffer({
        bcid: 'pdf417',
        text: barcodeData,
        scale: 3,
        height: 12,
        includetext: false,
      }, (err, png) => {
        if (err) {
          reject(err);
        } else {
          resolve(`data:image/png;base64,${png.toString('base64')}`);
        }
      });
    });
  }
}
