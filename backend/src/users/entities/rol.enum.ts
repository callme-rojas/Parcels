import { registerEnumType } from '@nestjs/graphql';

export enum Rol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  TAQUILLA = 'TAQUILLA',
  BODEGA = 'BODEGA',
  CLIENTE = 'CLIENTE',
}

registerEnumType(Rol, {
  name: 'Rol',
});

