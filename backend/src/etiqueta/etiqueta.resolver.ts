import { Resolver, Query, Args } from '@nestjs/graphql';
import { EtiquetaService } from './etiqueta.service';

@Resolver()
export class EtiquetaResolver {
  constructor(private readonly etiquetaService: EtiquetaService) {}

  @Query(() => String, {
    name: 'generarEtiqueta',
    description: 'Generar código de barra PDF417 en base64 para una encomienda',
  })
  async generarEtiqueta(
    @Args('parcelId') parcelId: string,
  ): Promise<string> {
    return this.etiquetaService.generarEtiquetaBase64(parcelId);
  }
}
