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

  @Field(() => Int, { description: 'Cantidad de etiquetas vendidas (pagadas)' })
  totalVentaEtiquetas!: number;

  @Field(() => Float, { description: 'Monto total de dinero en encomiendas registradas' })
  montoTotalRegistrado!: number;

  @Field(() => Float, { description: 'Monto total recaudado (pagado)' })
  montoTotalPagado!: number;

  @Field(() => Float, { description: 'Monto total pendiente de cobro' })
  montoTotalPendiente!: number;

  @Field(() => [RutaConteo], { description: 'Top rutas por volumen en el período' })
  encomiendasPorRuta!: RutaConteo[];
}
