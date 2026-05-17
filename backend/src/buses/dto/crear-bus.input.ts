import { Field, InputType, Int } from '@nestjs/graphql';
import { BusEstado } from '../entities/bus-estado.enum';

@InputType()
export class CrearBusInput {
  @Field()
  placa!: string;

  @Field({ nullable: true })
  modelo?: string;

  @Field()
  flota!: string;

  @Field()
  routeCode!: string;

  @Field({ nullable: true, description: 'Etiqueta legible; si no se envía se deriva del routeCode' })
  routeLabel?: string;

  @Field(() => Int, { nullable: true })
  capacidad?: number;

  @Field(() => BusEstado, { nullable: true })
  estado?: BusEstado;

  @Field({ nullable: true })
  salidaProgramada?: string;

  @Field({ nullable: true })
  conductor?: string;
}
