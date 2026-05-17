import { Field, ObjectType } from '@nestjs/graphql';
import { ParcelStatus } from '../../parcels/entities/parcel.entity';

@ObjectType({ description: 'Resumen breve de encomienda para listados admin' })
export class EncomiendaResumen {
  @Field()
  id!: string;

  @Field()
  trackingNumber!: string;

  @Field()
  senderName!: string;

  @Field()
  recipientName!: string;

  @Field()
  routeCode!: string;

  @Field()
  routeLabel!: string;

  @Field(() => ParcelStatus)
  status!: ParcelStatus;

  @Field()
  createdAt!: Date;
}
