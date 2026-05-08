import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthPayload } from './entities/auth-payload.entity';
import { LoginInput } from './dto/login.input';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RegisterClienteInput } from './dto/register-cliente.input';
import { CrearUsuarioInput } from './dto/crear-usuario.input';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Rol } from '../users/entities/rol.enum';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return await this.authService.login(input.email, input.password);
  }

  @Mutation(() => AuthPayload)
  async registerCliente(
    @Args('input') input: RegisterClienteInput,
  ): Promise<AuthPayload> {
    return await this.authService.registerCliente(input);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  async me(@CurrentUser() user: { userId: string }): Promise<User> {
    return await this.authService.me(user.userId);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Mutation(() => User)
  async crearUsuario(@Args('input') input: CrearUsuarioInput): Promise<User> {
    return await this.authService.crearUsuarioPorAdmin(input);
  }
}

