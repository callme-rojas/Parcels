import { registerEnumType } from '@nestjs/graphql';

export enum BusEstado {
  CARGANDO = 'CARGANDO',
  LISTO = 'LISTO',
  EN_RUTA = 'EN_RUTA',
  INACTIVO = 'INACTIVO',
}

registerEnumType(BusEstado, {
  name: 'BusEstado',
  description: 'Estado operativo del bus',
});
