import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROUTE_LABELS } from '../buses/buses.service';
import { Parcel, ParcelStatus } from '../parcels/entities/parcel.entity';
import { ReporteEncomiendasFilterInput } from './dto/reporte-encomiendas-filter.input';
import { IndicadoresFilterInput } from './dto/indicadores-filter.input';
import { ReporteEncomiendasResult } from './entities/reporte-encomiendas-result.entity';
import { IndicadoresOperativos } from './entities/indicadores-operativos.entity';
import { ResumenDashboard } from './entities/resumen-dashboard.entity';
import { RutaConteo } from './entities/ruta-conteo.entity';
import { EncomiendaResumen } from './entities/encomienda-resumen.entity';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private routeLabel(routeCode: string): string {
    return ROUTE_LABELS[routeCode] ?? routeCode;
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private resolvePeriod(filter?: IndicadoresFilterInput): {
    fechaDesde: Date;
    fechaHasta: Date;
  } {
    const now = new Date();
    const fechaHasta = filter?.fechaHasta
      ? this.endOfDay(filter.fechaHasta)
      : this.endOfDay(now);
    const fechaDesde = filter?.fechaDesde
      ? this.startOfDay(filter.fechaDesde)
      : new Date(0); // Representa "Todo el tiempo" (1970-01-01) si no se especifica

    return { fechaDesde, fechaHasta };
  }

  private buildWhereFromReportFilter(
    filter?: ReporteEncomiendasFilterInput,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.routeCode) {
      where.routeCode = filter.routeCode;
    }
    if (filter?.search) {
      const s = filter.search;
      where.OR = [
        { trackingNumber: { contains: s, mode: 'insensitive' } },
        { senderName: { contains: s, mode: 'insensitive' } },
        { recipientName: { contains: s, mode: 'insensitive' } },
        { senderCi: { contains: s, mode: 'insensitive' } },
        { recipientCi: { contains: s, mode: 'insensitive' } },
      ];
    }

    const createdAt: Record<string, Date> = {};
    if (filter?.fechaDesde) {
      createdAt.gte = this.startOfDay(filter.fechaDesde);
    }
    if (filter?.fechaHasta) {
      createdAt.lte = this.endOfDay(filter.fechaHasta);
    }
    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }

    return where;
  }

  private toParcelEntity(p: {
    events?: { status: string }[];
    status: string;
    [key: string]: unknown;
  }): Parcel {
    return {
      ...p,
      status: p.status as ParcelStatus,
      events: p.events?.map((e) => ({
        ...e,
        status: e.status as ParcelStatus,
      })),
    } as Parcel;
  }

  private async buildRutaConteos(
    where: Record<string, unknown>,
    limit = 5,
  ): Promise<RutaConteo[]> {
    const grouped = await this.prisma.parcel.groupBy({
      by: ['routeCode'],
      where,
      _count: { _all: true },
    });

    const sorted = grouped
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, limit);

    const total = sorted.reduce((sum, g) => sum + g._count._all, 0);

    return sorted.map((g) => ({
      routeCode: g.routeCode,
      routeLabel: this.routeLabel(g.routeCode),
      total: g._count._all,
      porcentaje:
        total > 0
          ? Math.round((g._count._all / total) * 1000) / 10
          : 0,
    }));
  }

  async reporteEncomiendas(
    filter?: ReporteEncomiendasFilterInput,
  ): Promise<ReporteEncomiendasResult> {
    const page = filter?.page ?? 1;
    const pageSize = Math.min(filter?.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;
    const where = this.buildWhereFromReportFilter(filter);

    const [total, rows] = await Promise.all([
      this.prisma.parcel.count({ where }),
      this.prisma.parcel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { events: { orderBy: { createdAt: 'asc' } } },
      }),
    ]);

    return {
      items: rows.map((r) => this.toParcelEntity(r)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async indicadoresOperativos(
    filter?: IndicadoresFilterInput,
  ): Promise<IndicadoresOperativos> {
    const { fechaDesde, fechaHasta } = this.resolvePeriod(filter);
    const where = {
      createdAt: { gte: fechaDesde, lte: fechaHasta },
    };

    const [
      totalRegistradas,
      totalEntregadas,
      totalEnTransito,
      totalDisponibles,
      totalCanceladas,
      totalRecepcionadas,
      totalEnDestino,
      encomiendasPorRuta,
    ] = await Promise.all([
      this.prisma.parcel.count({ where }),
      this.prisma.parcel.count({
        where: { ...where, status: ParcelStatus.ENTREGADO },
      }),
      this.prisma.parcel.count({
        where: { ...where, status: ParcelStatus.EN_TRANSITO },
      }),
      this.prisma.parcel.count({
        where: { ...where, status: ParcelStatus.DISPONIBLE },
      }),
      this.prisma.parcel.count({
        where: { ...where, status: ParcelStatus.CANCELADO },
      }),
      this.prisma.parcel.count({
        where: { ...where, status: ParcelStatus.RECEPCIONADO },
      }),
      this.prisma.parcel.count({
        where: { ...where, status: ParcelStatus.EN_DESTINO },
      }),
      this.buildRutaConteos(where, 10),
    ]);

    // Calcular agregados de dinero
    const pagosSum = await this.prisma.parcel.aggregate({
      where,
      _sum: { costoEnvio: true },
    });
    const montoTotalRegistrado = Math.round((pagosSum._sum.costoEnvio || 0) * 100) / 100;

    const pagosAgrupados = await this.prisma.parcel.groupBy({
      by: ['estadoPago'],
      where,
      _count: { id: true },
      _sum: { costoEnvio: true },
    });

    let totalVentaEtiquetas = 0;
    let montoTotalPagado = 0;
    let montoTotalPendiente = 0;

    for (const group of pagosAgrupados) {
      if (group.estadoPago === 'PAGADO') {
        totalVentaEtiquetas = group._count.id;
        montoTotalPagado = Math.round((group._sum.costoEnvio || 0) * 100) / 100;
      } else if (group.estadoPago === 'PENDIENTE') {
        montoTotalPendiente = Math.round((group._sum.costoEnvio || 0) * 100) / 100;
      }
    }

    const tasaEntregaExitosa =
      totalRegistradas > 0
        ? Math.round((totalEntregadas / totalRegistradas) * 1000) / 10
        : 0;

    return {
      fechaDesde,
      fechaHasta,
      totalRegistradas,
      totalEntregadas,
      totalEnTransito,
      totalDisponibles,
      totalCanceladas,
      totalRecepcionadas,
      totalEnDestino,
      tasaEntregaExitosa,
      totalVentaEtiquetas,
      montoTotalRegistrado,
      montoTotalPagado,
      montoTotalPendiente,
      encomiendasPorRuta,
    };
  }

  async resumenDashboard(): Promise<ResumenDashboard> {
    const now = new Date();
    const hoyInicio = this.startOfDay(now);
    const hoyFin = this.endOfDay(now);
    const sieteDiasAtras = this.startOfDay(
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    );

    const [
      registradasHoy,
      entregadasHoy,
      enTransito,
      disponiblesRetiro,
      ultimasRows,
      topRutas,
    ] = await Promise.all([
      this.prisma.parcel.count({
        where: { createdAt: { gte: hoyInicio, lte: hoyFin } },
      }),
      this.prisma.parcel.count({
        where: { deliveredAt: { gte: hoyInicio, lte: hoyFin } },
      }),
      this.prisma.parcel.count({
        where: { status: ParcelStatus.EN_TRANSITO },
      }),
      this.prisma.parcel.count({
        where: { status: ParcelStatus.DISPONIBLE },
      }),
      this.prisma.parcel.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          trackingNumber: true,
          senderName: true,
          recipientName: true,
          routeCode: true,
          status: true,
          createdAt: true,
        },
      }),
      this.buildRutaConteos(
        { createdAt: { gte: sieteDiasAtras, lte: hoyFin } },
        5,
      ),
    ]);

    const ultimasEncomiendas: EncomiendaResumen[] = ultimasRows.map((p) => ({
      id: p.id,
      trackingNumber: p.trackingNumber,
      senderName: p.senderName,
      recipientName: p.recipientName,
      routeCode: p.routeCode,
      routeLabel: this.routeLabel(p.routeCode),
      status: p.status as ParcelStatus,
      createdAt: p.createdAt,
    }));

    return {
      fechaReferencia: now,
      registradasHoy,
      entregadasHoy,
      enTransito,
      disponiblesRetiro,
      ultimasEncomiendas,
      topRutas,
    };
  }
}
