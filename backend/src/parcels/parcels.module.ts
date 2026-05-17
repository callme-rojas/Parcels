import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { ParcelsResolver } from './parcels.resolver';
import { BusesModule } from '../buses/buses.module';

@Module({
  imports: [BusesModule],
  providers: [ParcelsResolver, ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
