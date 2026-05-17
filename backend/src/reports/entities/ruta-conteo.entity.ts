import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Conteo de encomiendas por ruta' })
export class RutaConteo {
  @Field()
  routeCode!: string;

  @Field()
  routeLabel!: string;

  @Field(() => Int)
  total!: number;

  @Field(() => Float, { description: 'Porcentaje sobre el total del período (0-100)' })
  porcentaje!: number;
}
