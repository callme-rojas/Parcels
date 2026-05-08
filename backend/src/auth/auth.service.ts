import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Rol } from '../users/entities/rol.enum';

export type JwtPayload = {
  sub: string;
  rol: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    if (!user.activo) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    return user;
  }

  toGraphqlUser(user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    activo: boolean;
  }): User {
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol as any,
      activo: user.activo,
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const payload: JwtPayload = { sub: user.id, rol: user.rol };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.toGraphqlUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    if (!user.activo) throw new UnauthorizedException('Usuario inactivo');
    return this.toGraphqlUser(user);
  }

  private async assertEmailNotUsed(email: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }
  }

  async registerCliente(input: {
    nombre: string;
    email: string;
    password: string;
  }) {
    await this.assertEmailNotUsed(input.email);

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersService.createUser({
      nombre: input.nombre,
      email: input.email,
      passwordHash,
      rol: Rol.CLIENTE,
    });

    const payload: JwtPayload = { sub: user.id, rol: user.rol };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.toGraphqlUser(user),
    };
  }

  async crearUsuarioPorAdmin(input: {
    nombre: string;
    email: string;
    password: string;
    rol: Rol;
  }) {
    if (input.rol === Rol.CLIENTE) {
      throw new BadRequestException(
        'Para clientes usa registerCliente; crearUsuario es para personal',
      );
    }

    await this.assertEmailNotUsed(input.email);

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersService.createUser({
      nombre: input.nombre,
      email: input.email,
      passwordHash,
      rol: input.rol,
    });

    return this.toGraphqlUser(user);
  }
}

