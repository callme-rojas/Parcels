import { Module } from '@nestjs/common';
import { BusesService } from './buses.service';
import { BusesResolver } from './buses.resolver';

@Module({
  providers: [BusesService, BusesResolver],
  exports: [BusesService],
})
export class BusesModule {}
