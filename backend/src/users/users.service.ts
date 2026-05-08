import { Injectable } from '@nestjs/common';
import { Rol } from './entities/rol.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return await this.prisma.usuario.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return await this.prisma.usuario.findUnique({ where: { id } });
  }

  async createUser(input: {
    nombre: string;
    email: string;
    passwordHash: string;
    rol: Rol;
  }) {
    return await this.prisma.usuario.create({
      data: {
        nombre: input.nombre,
        email: input.email,
        passwordHash: input.passwordHash,
        rol: input.rol,
        activo: true,
      },
    });
  }
}

