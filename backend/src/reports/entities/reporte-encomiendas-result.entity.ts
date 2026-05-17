import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Parcel } from '../../parcels/entities/parcel.entity';

@ObjectType({ description: 'Resultado paginado del reporte de encomiendas' })
export class ReporteEncomiendasResult {
  @Field(() => [Parcel])
  items!: Parcel[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  pageSize!: number;

  @Field(() => Int)
  totalPages!: number;
}
