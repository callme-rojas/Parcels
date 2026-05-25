import { Module } from '@nestjs/common';
import { EtiquetaService } from './etiqueta.service';
import { EtiquetaResolver } from './etiqueta.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EtiquetaService, EtiquetaResolver],
  exports: [EtiquetaService],
})
export class EtiquetaModule {}
