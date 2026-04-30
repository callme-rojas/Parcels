import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { ParcelsResolver } from './parcels.resolver';

@Module({
  providers: [ParcelsResolver, ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
