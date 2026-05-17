import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReporteEncomiendasResult } from './entities/reporte-encomiendas-result.entity';
import { IndicadoresOperativos } from './entities/indicadores-operativos.entity';
import { ResumenDashboard } from './entities/resumen-dashboard.entity';
import { ReporteEncomiendasFilterInput } from './dto/reporte-encomiendas-filter.input';
import { IndicadoresFilterInput } from './dto/indicadores-filter.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../users/entities/rol.enum';

@Resolver()
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Query(() => ReporteEncomiendasResult, {
    name: 'reporteEncomiendas',
    description:
      'Listado paginado de encomiendas con filtros (ruta, estado, fechas, búsqueda)',
  })
  reporteEncomiendas(
    @Args('filter', { nullable: true }) filter?: ReporteEncomiendasFilterInput,
  ): Promise<ReporteEncomiendasResult> {
    return this.reportsService.reporteEncomiendas(filter);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Query(() => IndicadoresOperativos, {
    name: 'indicadoresOperativos',
    description: 'KPIs agregados por período (default últimos 30 días)',
  })
  indicadoresOperativos(
    @Args('filter', { nullable: true }) filter?: IndicadoresFilterInput,
  ): Promise<IndicadoresOperativos> {
    return this.reportsService.indicadoresOperativos(filter);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Query(() => ResumenDashboard, {
    name: 'resumenDashboard',
    description: 'KPIs del día y últimas encomiendas (panel admin)',
  })
  resumenDashboard(): Promise<ResumenDashboard> {
    return this.reportsService.resumenDashboard();
  }
}
