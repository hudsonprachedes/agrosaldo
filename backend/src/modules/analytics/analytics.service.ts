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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
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
    const purchasesByMonth: Record<string, number> = {};
    const purchaseCostByMonth: Record<string, number> = {};
    const vaccinesByMonth: Record<string, number> = {};
    const deltaByMonth: Record<string, number> = {};

    for (const mv of movements as any[]) {
      const key = monthKey(new Date(mv.data));
      if (mv.tipo === 'nascimento') {
        birthsByMonth[key] = (birthsByMonth[key] ?? 0) + (mv.quantidade ?? 0);
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) + (mv.quantidade ?? 0);
      }
      if (mv.tipo === 'morte') {
        deathsByMonth[key] = (deathsByMonth[key] ?? 0) + (mv.quantidade ?? 0);
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) - (mv.quantidade ?? 0);
      }
      if (mv.tipo === 'venda') {
        revenueByMonth[key] = (revenueByMonth[key] ?? 0) + (mv.valor ?? 0);
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) - (mv.quantidade ?? 0);
      }
      if (mv.tipo === 'compra') {
        purchasesByMonth[key] = (purchasesByMonth[key] ?? 0) + (mv.quantidade ?? 0);
        purchaseCostByMonth[key] = (purchaseCostByMonth[key] ?? 0) + (mv.valor ?? 0);
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) + (mv.quantidade ?? 0);
      }
      if (mv.tipo === 'ajuste') {
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) + (mv.quantidade ?? 0);
      }
      if (mv.tipo === 'vacina') {
        vaccinesByMonth[key] = (vaccinesByMonth[key] ?? 0) + (mv.quantidade ?? 0);
      }
    }

    const seriesMonths = months.map((m) => ({
      key: monthKey(m),
      label: monthLabelPtBr(m),
    }));

    const currentMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const totalDelta = seriesMonths.reduce((sum, m) => sum + (deltaByMonth[m.key] ?? 0), 0);
    const startTotal = Math.max(0, totalCattle - totalDelta);

    const evolution: number[] = [];
    let running = startTotal;
    for (const m of seriesMonths) {
      running = Math.max(0, running + (deltaByMonth[m.key] ?? 0));
      evolution.push(running);
    }

    const vaccinesThisMonth = vaccinesByMonth[currentMonthKey] ?? 0;
    const vaccinationCompliance = totalCattle > 0 ? Math.min(100, (vaccinesThisMonth / totalCattle) * 100) : 0;

    return {
      propertyId,
      kpis: {
        totalCattle,
        birthsThisMonth: birthsByMonth[currentMonthKey] ?? 0,
        deathsThisMonth: deathsByMonth[currentMonthKey] ?? 0,
        purchasesThisMonth: purchasesByMonth[currentMonthKey] ?? 0,
        purchaseCostThisMonth: purchaseCostByMonth[currentMonthKey] ?? 0,
      },
      compliance: {
        overall: Math.round(vaccinationCompliance),
        items: [
          {
            category: 'Vacinação',
            percentage: Math.round(vaccinationCompliance),
          },
        ],
      },
      charts: {
        months: seriesMonths.map((m) => m.label),
        births: seriesMonths.map((m) => birthsByMonth[m.key] ?? 0),
        deaths: seriesMonths.map((m) => deathsByMonth[m.key] ?? 0),
        revenue: seriesMonths.map((m) => revenueByMonth[m.key] ?? 0),
        purchases: seriesMonths.map((m) => purchasesByMonth[m.key] ?? 0),
        purchaseCost: seriesMonths.map((m) => purchaseCostByMonth[m.key] ?? 0),
        evolution,
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

  async getSummary(propertyId: string, period: 'month' | 'quarter' | 'year') {
    const now = new Date();
    const monthsCount = period === 'year' ? 12 : 6;
    const months = getLastNMonths(monthsCount, now);

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

    const totalCattle = (balance as any[]).reduce((sum, row) => sum + (row.cabecas ?? 0), 0);

    const birthsByMonth: Record<string, number> = {};
    const deathsByMonth: Record<string, number> = {};
    const salesByMonth: Record<string, number> = {};
    const revenueByMonth: Record<string, number> = {};
    const vaccinesByMonth: Record<string, number> = {};
    const deltaByMonth: Record<string, number> = {};

    for (const mv of movements as any[]) {
      const key = monthKey(new Date(mv.data));
      const qty = mv.quantidade ?? 0;
      if (mv.tipo === 'nascimento') {
        birthsByMonth[key] = (birthsByMonth[key] ?? 0) + qty;
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) + qty;
      }
      if (mv.tipo === 'morte') {
        deathsByMonth[key] = (deathsByMonth[key] ?? 0) + qty;
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) - qty;
      }
      if (mv.tipo === 'venda') {
        salesByMonth[key] = (salesByMonth[key] ?? 0) + qty;
        revenueByMonth[key] = (revenueByMonth[key] ?? 0) + (mv.valor ?? 0);
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) - qty;
      }
      if (mv.tipo === 'compra') {
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) + qty;
      }
      if (mv.tipo === 'ajuste') {
        deltaByMonth[key] = (deltaByMonth[key] ?? 0) + qty;
      }
      if (mv.tipo === 'vacina') {
        vaccinesByMonth[key] = (vaccinesByMonth[key] ?? 0) + qty;
      }
    }

    const seriesMonths = months.map((m) => ({
      key: monthKey(m),
      label: monthLabelPtBr(m).replace('.', ''),
      start: startOfMonth(m),
      end: endOfMonth(m),
    }));

    const totalDelta = seriesMonths.reduce((sum, m) => sum + (deltaByMonth[m.key] ?? 0), 0);
    const startTotal = Math.max(0, totalCattle - totalDelta);

    const evolution: number[] = [];
    let running = startTotal;
    for (const m of seriesMonths) {
      running = Math.max(0, running + (deltaByMonth[m.key] ?? 0));
      evolution.push(running);
    }

    const birthsSeries = seriesMonths.map((m) => birthsByMonth[m.key] ?? 0);
    const deathsSeries = seriesMonths.map((m) => deathsByMonth[m.key] ?? 0);
    const salesSeries = seriesMonths.map((m) => salesByMonth[m.key] ?? 0);
    const revenueSeries = seriesMonths.map((m) => revenueByMonth[m.key] ?? 0);
    const vaccinesSeries = seriesMonths.map((m) => vaccinesByMonth[m.key] ?? 0);

    const birthRateSeries = birthsSeries.map((b, i) => {
      const base = evolution[i] ?? 0;
      if (!base) return 0;
      return (b / base) * 100;
    });

    const mortalityRateSeries = deathsSeries.map((d, i) => {
      const base = evolution[i] ?? 0;
      if (!base) return 0;
      return (d / base) * 100;
    });

    const survivalRateSeries = mortalityRateSeries.map((m) => Math.max(0, 100 - m));

    const growthRateSeries = evolution.map((val, i) => {
      if (i === 0) return 0;
      const prev = evolution[i - 1] ?? 0;
      if (!prev) return 0;
      return ((val - prev) / prev) * 100;
    });

    const currentMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const birthsThisMonth = birthsByMonth[currentMonthKey] ?? 0;
    const deathsThisMonth = deathsByMonth[currentMonthKey] ?? 0;
    const salesThisMonth = salesByMonth[currentMonthKey] ?? 0;
    const revenueThisMonth = revenueByMonth[currentMonthKey] ?? 0;

    const birthRate = totalCattle > 0 ? (birthsThisMonth / totalCattle) * 100 : 0;
    const survivalRate = totalCattle > 0 ? Math.max(0, 100 - (deathsThisMonth / totalCattle) * 100) : 0;
    const herdGrowthPct = startTotal > 0 ? ((totalCattle - startTotal) / startTotal) * 100 : 0;
    const avgSalePrice = salesThisMonth > 0 ? revenueThisMonth / salesThisMonth : 0;

    const vaccinesThisMonth = vaccinesByMonth[currentMonthKey] ?? 0;
    const vaccinationCompliance = totalCattle > 0 ? Math.min(100, (vaccinesThisMonth / totalCattle) * 100) : 0;

    const agePriceGroups = ['0-4m', '5-12m', '13-24m', '25-36m', '36m+'];
    const salesByAge = await this.prisma.movimento.findMany({
      where: {
        propriedadeId: propertyId,
        tipo: 'venda' as any,
        data: { gte: months[0] },
      },
      select: { faixaEtaria: true, valor: true, quantidade: true },
    });

    const ageAgg: Record<string, { value: number; qty: number }> = {};
    for (const mv of salesByAge as any[]) {
      const age = mv.faixaEtaria ?? 'unknown';
      if (!ageAgg[age]) ageAgg[age] = { value: 0, qty: 0 };
      ageAgg[age].value += mv.valor ?? 0;
      ageAgg[age].qty += mv.quantidade ?? 0;
    }

    const avgPriceByAge = agePriceGroups.map((g) => {
      const rec = ageAgg[g];
      if (!rec?.qty) return 0;
      return rec.value / rec.qty;
    });

    const years = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()];
    const births3y = await this.prisma.movimento.findMany({
      where: {
        propriedadeId: propertyId,
        tipo: 'nascimento' as any,
        data: {
          gte: new Date(years[0], 0, 1),
          lte: new Date(years[2], 11, 31, 23, 59, 59, 999),
        },
      },
      select: { data: true, quantidade: true },
    });

    const birthsHeat: Record<number, Record<number, number>> = {};
    for (const y of years) birthsHeat[y] = {};
    for (const mv of births3y as any[]) {
      const d = new Date(mv.data);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (!birthsHeat[y]) birthsHeat[y] = {};
      birthsHeat[y][m] = (birthsHeat[y][m] ?? 0) + (mv.quantidade ?? 0);
    }

    const heatmapCategories = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const birthHeatmapSeries = years.map((y) => ({
      name: String(y),
      data: new Array(12).fill(0).map((_, idx) => birthsHeat[y]?.[idx] ?? 0),
    }));

    return {
      propertyId,
      period,
      kpis: {
        birthRate,
        survivalRate,
        herdGrowthPct,
        avgSalePrice,
      },
      charts: {
        categories: seriesMonths.map((m) => m.label.charAt(0).toUpperCase() + m.label.slice(1)),
        productivity: {
          birthRate: birthRateSeries,
          survivalRate: survivalRateSeries,
          growthRate: growthRateSeries,
        },
        yearComparison: {
          current: evolution,
          previous: evolution.map((v) => Math.max(0, v - (totalDelta / monthsCount))),
        },
        health: {
          vaccination: Math.round(vaccinationCompliance),
          deworming: Math.round(vaccinationCompliance),
          nutrition: Math.max(0, Math.min(100, Math.round(80 + herdGrowthPct))),
          welfare: Math.round(survivalRate),
          reproduction: Math.round(birthRate),
        },
        mortalityRate: mortalityRateSeries,
        avgPriceByAge: {
          categories: agePriceGroups,
          values: avgPriceByAge,
        },
        births: birthsSeries,
        deaths: deathsSeries,
        sales: salesSeries,
        revenue: revenueSeries,
        vaccines: vaccinesSeries,
        birthHeatmap: {
          categories: heatmapCategories,
          series: birthHeatmapSeries,
        },
      },
      generatedAt: now.toISOString(),
    };
  }
}
