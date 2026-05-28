import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearSucursalInput } from './dto/crear-sucursal.input';
import { ActualizarSucursalInput } from './dto/actualizar-sucursal.input';

@Injectable()
export class SucursalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.sucursal.findMany({
      orderBy: { creadoEn: 'desc' },
    });
  }

  async findOne(id: string) {
    const sucursal = await this.prisma.sucursal.findUnique({ where: { id } });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }
    return sucursal;
  }

  async create(input: CrearSucursalInput) {
    return await this.prisma.sucursal.create({
      data: {
        nombre: input.nombre,
        ciudad: input.ciudad,
        direccion: input.direccion,
        telefono: input.telefono,
        activa: true,
      },
    });
  }

  async update(id: string, input: Omit<ActualizarSucursalInput, 'id'>) {
    await this.findOne(id); // Throws if not exists

    const data: any = {};
    if (input.nombre !== undefined) data.nombre = input.nombre;
    if (input.ciudad !== undefined) data.ciudad = input.ciudad;
    if (input.direccion !== undefined) data.direccion = input.direccion;
    if (input.telefono !== undefined) data.telefono = input.telefono;
    if (input.activa !== undefined) data.activa = input.activa;

    return await this.prisma.sucursal.update({
      where: { id },
      data,
    });
  }
}
