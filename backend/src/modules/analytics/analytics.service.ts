import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelPtBr(date: Date): string {
  return date.toLocaleString('pt-BR', { month: 'short' });
}

function getLastNMonths(n: number, now: Date): Date[] {
  const months: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  return months;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(propertyId: string) {
    const now = new Date();
    const months = getLastNMonths(6, now);

    const [balance, movements] = await Promise.all([
      this.prisma.rebanho.findMany({ where: { propriedadeId: propertyId } }),
      this.prisma.movimento.findMany({
        where: {
          propriedadeId: propertyId,
          data: { gte: months[0] },
        },
        orderBy: { data: 'asc' },
      }),
    ]);

    const totalCattle = balance.reduce((sum, row: any) => sum + (row.cabecas ?? 0), 0);

    const byAgeGroup = balance.reduce((acc: Record<string, number>, row: any) => {
      const key = row.faixaEtaria ?? 'unknown';
      acc[key] = (acc[key] ?? 0) + (row.cabecas ?? 0);
      return acc;
    }, {});

    const bySex = balance.reduce((acc: Record<string, number>, row: any) => {
      const key = row.sexo ?? 'unknown';
      acc[key] = (acc[key] ?? 0) + (row.cabecas ?? 0);
      return acc;
    }, {});

    const birthsByMonth: Record<string, number> = {};
    const deathsByMonth: Record<string, number> = {};
    const revenueByMonth: Record<string, number> = {};

    for (const mv of movements as any[]) {
      const key = monthKey(new Date(mv.data));
      if (mv.tipo === 'nascimento') {
        birthsByMonth[key] = (birthsByMonth[key] ?? 0) + (mv.quantidade ?? 0);
      }
      if (mv.tipo === 'morte') {
        deathsByMonth[key] = (deathsByMonth[key] ?? 0) + (mv.quantidade ?? 0);
      }
      if (mv.tipo === 'venda') {
        revenueByMonth[key] = (revenueByMonth[key] ?? 0) + (mv.valor ?? 0);
      }
    }

    const seriesMonths = months.map((m) => ({
      key: monthKey(m),
      label: monthLabelPtBr(m),
    }));

    return {
      propertyId,
      kpis: {
        totalCattle,
        birthsThisMonth: birthsByMonth[monthKey(new Date(now.getFullYear(), now.getMonth(), 1))] ?? 0,
        deathsThisMonth: deathsByMonth[monthKey(new Date(now.getFullYear(), now.getMonth(), 1))] ?? 0,
      },
      charts: {
        months: seriesMonths.map((m) => m.label),
        births: seriesMonths.map((m) => birthsByMonth[m.key] ?? 0),
        deaths: seriesMonths.map((m) => deathsByMonth[m.key] ?? 0),
        revenue: seriesMonths.map((m) => revenueByMonth[m.key] ?? 0),
        ageDistribution: byAgeGroup,
        bySex,
      },
    };
  }

  async getPeriod(propertyId: string, startDate: Date, endDate: Date) {
    const movements = await this.prisma.movimento.findMany({
      where: { propriedadeId: propertyId, data: { gte: startDate, lte: endDate } },
      orderBy: { data: 'asc' },
    });

    const totals = (movements as any[]).reduce(
      (acc, mv) => {
        if (mv.tipo === 'nascimento') acc.births += mv.quantidade ?? 0;
        if (mv.tipo === 'morte') acc.deaths += mv.quantidade ?? 0;
        if (mv.tipo === 'venda') acc.sales += mv.quantidade ?? 0;
        if (mv.tipo === 'venda') acc.revenue += mv.valor ?? 0;
        if (mv.tipo === 'vacina') acc.vaccines += mv.quantidade ?? 0;
        return acc;
      },
      { births: 0, deaths: 0, sales: 0, revenue: 0, vaccines: 0 },
    );

    return {
      propertyId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totals,
    };
  }

  async getMortality(propertyId: string, months = 12) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const [balance, deaths] = await Promise.all([
      this.prisma.rebanho.aggregate({
        where: { propriedadeId: propertyId },
        _sum: { cabecas: true },
      }),
      this.prisma.movimento.aggregate({
        where: { propriedadeId: propertyId, tipo: 'morte' as any, data: { gte: start } },
        _sum: { quantidade: true },
      }),
    ]);

    const total = balance._sum?.cabecas ?? 0;
    const deathCount = deaths._sum?.quantidade ?? 0;
    const rate = total > 0 ? (deathCount / total) * 100 : 0;

    return {
      propertyId,
      months,
      total,
      deaths: deathCount,
      rate,
    };
  }

  async getRevenue(propertyId: string, months = 12) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const movements = await this.prisma.movimento.findMany({
      where: { propriedadeId: propertyId, tipo: 'venda' as any, data: { gte: start } },
      orderBy: { data: 'asc' },
    });

    const monthsList = getLastNMonths(months, now);
    const byMonth: Record<string, number> = {};

    for (const mv of movements as any[]) {
      const key = monthKey(new Date(mv.data));
      byMonth[key] = (byMonth[key] ?? 0) + (mv.valor ?? 0);
    }

    return {
      propertyId,
      months: monthsList.map((m) => monthLabelPtBr(m)),
      revenue: monthsList.map((m) => byMonth[monthKey(m)] ?? 0),
    };
  }
}
