import { Field, Int, ObjectType } from '@nestjs/graphql';
import { EncomiendaResumen } from './encomienda-resumen.entity';
import { RutaConteo } from './ruta-conteo.entity';

@ObjectType({ description: 'KPIs y datos rápidos del dashboard admin' })
export class ResumenDashboard {
  @Field()
  fechaReferencia!: Date;

  @Field(() => Int, { description: 'Encomiendas creadas hoy' })
  registradasHoy!: number;

  @Field(() => Int, { description: 'Entregadas hoy (deliveredAt)' })
  entregadasHoy!: number;

  @Field(() => Int, { description: 'Estado actual EN_TRANSITO' })
  enTransito!: number;

  @Field(() => Int, { description: 'Estado actual DISPONIBLE' })
  disponiblesRetiro!: number;

  @Field(() => [EncomiendaResumen], { description: 'Últimas 5 registradas' })
  ultimasEncomiendas!: EncomiendaResumen[];

  @Field(() => [RutaConteo], { description: 'Top 5 rutas (últimos 7 días)' })
  topRutas!: RutaConteo[];
}
