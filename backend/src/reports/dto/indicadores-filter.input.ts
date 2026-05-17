import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'Rango de fechas para indicadores operativos' })
export class IndicadoresFilterInput {
  @Field({ nullable: true, description: 'Fecha desde (inclusive). Por defecto: hace 30 días' })
  fechaDesde?: Date;

  @Field({ nullable: true, description: 'Fecha hasta (inclusive). Por defecto: hoy' })
  fechaHasta?: Date;
}
