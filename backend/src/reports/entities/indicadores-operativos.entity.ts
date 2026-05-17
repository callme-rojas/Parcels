import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { RutaConteo } from './ruta-conteo.entity';

@ObjectType({ description: 'Indicadores operativos del período' })
export class IndicadoresOperativos {
  @Field()
  fechaDesde!: Date;

  @Field()
  fechaHasta!: Date;

  @Field(() => Int, { description: 'Encomiendas creadas en el período' })
  totalRegistradas!: number;

  @Field(() => Int)
  totalEntregadas!: number;

  @Field(() => Int)
  totalEnTransito!: number;

  @Field(() => Int)
  totalDisponibles!: number;

  @Field(() => Int)
  totalCanceladas!: number;

  @Field(() => Int)
  totalRecepcionadas!: number;

  @Field(() => Int)
  totalEnDestino!: number;

  @Field(() => Float, { description: 'Entregadas / registradas × 100' })
  tasaEntregaExitosa!: number;

  @Field(() => [RutaConteo], { description: 'Top rutas por volumen en el período' })
  encomiendasPorRuta!: RutaConteo[];
}
