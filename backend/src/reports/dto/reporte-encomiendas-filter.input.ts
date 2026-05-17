import { Field, InputType, Int } from '@nestjs/graphql';
import { ParcelStatus } from '../../parcels/entities/parcel.entity';

@InputType({ description: 'Filtros para reporte de encomiendas (admin)' })
export class ReporteEncomiendasFilterInput {
  @Field(() => ParcelStatus, { nullable: true })
  status?: ParcelStatus;

  @Field({ nullable: true, description: 'Código de ruta (ej. SCZ-PQA)' })
  routeCode?: string;

  @Field({ nullable: true, description: 'Fecha desde (inclusive, ISO)' })
  fechaDesde?: Date;

  @Field({ nullable: true, description: 'Fecha hasta (inclusive, fin del día)' })
  fechaHasta?: Date;

  @Field({ nullable: true, description: 'Buscar por código, nombre o CI' })
  search?: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  pageSize?: number;
}
