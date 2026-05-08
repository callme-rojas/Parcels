import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Parcel } from './entities/parcel.entity';
import { ParcelsService } from './parcels.service';
import { CreateParcelInput } from './dto/create-parcel.input';
import { UpdateParcelStatusInput } from './dto/update-parcel-status.input';

@Resolver(() => Parcel)
export class ParcelsResolver {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Query(() => [Parcel], { name: 'parcels', description: 'Get all parcels' })
  findAll(): Promise<Parcel[]> {
    return this.parcelsService.findAll();
  }

  @Query(() => Parcel, { name: 'parcel', description: 'Get a parcel by ID' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<Parcel> {
    return this.parcelsService.findOne(id);
  }

  @Query(() => Parcel, {
    name: 'parcelByTracking',
    description: 'Get a parcel by tracking number',
  })
  findByTrackingNumber(
    @Args('trackingNumber') trackingNumber: string,
  ): Promise<Parcel> {
    return this.parcelsService.findByTrackingNumber(trackingNumber);
  }

  @Mutation(() => Parcel, { description: 'Create a new parcel' })
  createParcel(@Args('input') input: CreateParcelInput): Promise<Parcel> {
    return this.parcelsService.create(input);
  }

  @Mutation(() => Parcel, { description: 'Update parcel status' })
  updateParcelStatus(
    @Args('input') input: UpdateParcelStatusInput,
  ): Promise<Parcel> {
    return this.parcelsService.updateStatus(input);
  }

  @Mutation(() => Boolean, { description: 'Delete a parcel' })
  removeParcel(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.parcelsService.remove(id);
  }
}
