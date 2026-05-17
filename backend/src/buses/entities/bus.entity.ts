import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BusEstado } from './bus-estado.enum';

@ObjectType({ description: 'Bus de la flota Travell' })
export class Bus {
  @Field(() => ID)
  id!: string;

  @Field()
  placa!: string;

  @Field({ nullable: true })
  modelo?: string;

  @Field()
  flota!: string;

  @Field()
  routeCode!: string;

  @Field()
  routeLabel!: string;

  @Field(() => Int)
  capacidad!: number;

  @Field(() => BusEstado)
  estado!: BusEstado;

  @Field()
  activo!: boolean;

  @Field({ nullable: true })
  salidaProgramada?: string;

  @Field({ nullable: true })
  conductor?: string;

  @Field(() => Int, {
    description: 'Encomiendas asignadas o en tránsito en este bus',
  })
  cargados!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
