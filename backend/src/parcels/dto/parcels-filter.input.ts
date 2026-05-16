import { InputType, Field, Int } from '@nestjs/graphql';
import { ParcelStatus } from '../entities/parcel.entity';

@InputType({ description: 'Filtros para listar encomiendas' })
export class ParcelsFilterInput {
  @Field(() => ParcelStatus, { nullable: true })
  status?: ParcelStatus;

  @Field({ nullable: true, description: 'Código de ruta (ej. SCZ-PQA)' })
  routeCode?: string;

  @Field({ nullable: true, description: 'Buscar por nombre de remitente, destinatario o código' })
  search?: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  pageSize?: number;
}
