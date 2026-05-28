import { Injectable } from '@nestjs/common';
import { Rol } from './entities/rol.enum';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return await this.prisma.usuario.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return await this.prisma.usuario.findUnique({ where: { id } });
  }

  async findAll() {
    return await this.prisma.usuario.findMany({
      orderBy: { creadoEn: 'desc' },
    });
  }

  async createUser(input: {
    nombre: string;
    email: string;
    passwordHash: string;
    rol: Rol;
    telefono?: string;
  }) {
    return await this.prisma.usuario.create({
      data: {
        nombre: input.nombre,
        email: input.email,
        telefono: input.telefono,
        passwordHash: input.passwordHash,
        rol: input.rol,
        activo: true,
      },
    });
  }

  async update(id: string, input: {
    nombre?: string;
    email?: string;
    password?: string;
    telefono?: string;
    rol?: Rol;
    activo?: boolean;
  }) {
    const data: any = {};
    if (input.nombre !== undefined) data.nombre = input.nombre;
    if (input.email !== undefined) data.email = input.email;
    if (input.telefono !== undefined) data.telefono = input.telefono;
    if (input.rol !== undefined) data.rol = input.rol;
    if (input.activo !== undefined) data.activo = input.activo;

    if (input.password !== undefined && input.password !== '') {
      data.passwordHash = await bcrypt.hash(input.password, 10);
    }

    return await this.prisma.usuario.update({
      where: { id },
      data,
    });
  }
}

