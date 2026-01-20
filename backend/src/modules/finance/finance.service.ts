import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Period = 'month' | 'quarter' | 'year';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOnboardingDate(propertyId: string) {
    const onboarding = await this.prisma.movimento.findFirst({
      where: {
        propriedadeId: propertyId,
        descricao: '[SISTEMA] Saldo inicial (onboarding)',
      },
      select: { data: true },
      orderBy: { data: 'asc' },
    });

    return onboarding?.data ? new Date(onboarding.data) : null;
  }

  async getPixConfig() {
    const row = await (this.prisma as any).configuracaoPix.findFirst({
      orderBy: { criadoEm: 'desc' },
    });

    if (!row) return null;

    return {
      id: row.id,
      pixKey: row.chavePix,
      pixKeyType: row.tipoChavePix,
      qrCodeImage: row.imagemQrCode ?? null,
      active: row.ativo,
      createdAt: row.criadoEm,
      updatedAt: row.atualizadoEm,
    };
  }

  private startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  private startOfQuarter(date: Date) {
    const q = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), q * 3, 1, 0, 0, 0, 0);
  }

  private startOfYear(date: Date) {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  private addMonths(date: Date, months: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private addYears(date: Date, years: number) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  private getPeriods(now: Date, period: Period) {
    if (period === 'month') {
      const periods = [] as Array<{ label: string; start: Date; end: Date }>;
      for (let i = 5; i >= 0; i--) {
        const base = this.addMonths(now, -i);
        const start = this.startOfMonth(base);
        const end = this.endOfDay(
          new Date(base.getFullYear(), base.getMonth() + 1, 0),
        );
        const label = base
          .toLocaleString('pt-BR', { month: 'short' })
          .replace('.', '');
        periods.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          start,
          end,
        });
      }
      return periods;
    }

    if (period === 'quarter') {
      const periods = [] as Array<{ label: string; start: Date; end: Date }>;
      const currentQuarterStart = this.startOfQuarter(now);
      for (let i = 5; i >= 0; i--) {
        const start = this.addMonths(currentQuarterStart, -i * 3);
        const end = this.endOfDay(this.addMonths(start, 3));
        end.setMilliseconds(end.getMilliseconds() - 1);
        const q = Math.floor(start.getMonth() / 3) + 1;
        const yy = String(start.getFullYear()).slice(-2);
        periods.push({ label: `T${q}/${yy}`, start, end });
      }
      return periods;
    }

    const periods = [] as Array<{ label: string; start: Date; end: Date }>;
    const currentYearStart = this.startOfYear(now);
    for (let i = 5; i >= 0; i--) {
      const start = this.addYears(currentYearStart, -i);
      const end = this.endOfDay(new Date(start.getFullYear(), 11, 31));
      periods.push({ label: String(start.getFullYear()), start, end });
    }
    return periods;
  }

  private getCurrentAndPreviousPeriod(now: Date, period: Period) {
    if (period === 'month') {
      const currentStart = this.startOfMonth(now);
      const previousStart = this.startOfMonth(this.addMonths(now, -1));
      const previousEnd = this.endOfDay(
        new Date(previousStart.getFullYear(), previousStart.getMonth() + 1, 0),
      );
      return {
        currentStart,
        currentEnd: this.endOfDay(now),
        previousStart,
        previousEnd,
      };
    }

    if (period === 'quarter') {
      const currentStart = this.startOfQuarter(now);
      const previousStart = this.addMonths(currentStart, -3);
      const previousEnd = this.endOfDay(this.addMonths(previousStart, 3));
      previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
      return {
        currentStart,
        currentEnd: this.endOfDay(now),
        previousStart,
        previousEnd,
      };
    }

    const currentStart = this.startOfYear(now);
    const previousStart = this.startOfYear(this.addYears(now, -1));
    const previousEnd = this.endOfDay(
      new Date(previousStart.getFullYear(), 11, 31),
    );
    return {
      currentStart,
      currentEnd: this.endOfDay(now),
      previousStart,
      previousEnd,
    };
  }

  async getSummary(propertyId: string, period: Period) {
    const now = new Date();
    const periods = this.getPeriods(now, period);

    const onboardingDate = await this.getOnboardingDate(propertyId);
    const onboardingStart = onboardingDate ? this.startOfMonth(onboardingDate) : null;

    const rangeStart =
      periods[0]?.start ?? this.startOfMonth(this.addMonths(now, -5));
    const rangeEnd = periods[periods.length - 1]?.end ?? this.endOfDay(now);

    const [sales, purchases] = await Promise.all([
      this.prisma.movimento.findMany({
        where: {
          propriedadeId: propertyId,
          tipo: 'venda' as any,
          data: { gte: rangeStart, lte: rangeEnd },
        },
        select: {
          data: true,
          quantidade: true,
          valor: true,
        },
        orderBy: { data: 'asc' },
      }),
      this.prisma.movimento.findMany({
        where: {
          propriedadeId: propertyId,
          tipo: 'compra' as any,
          data: { gte: rangeStart, lte: rangeEnd },
        },
        select: {
          data: true,
          quantidade: true,
          valor: true,
        },
        orderBy: { data: 'asc' },
      }),
    ]);

    const revenueByPeriod = new Array(periods.length).fill(0);
    const soldByPeriod = new Array(periods.length).fill(0);
    const purchasesByPeriod = new Array(periods.length).fill(0);
    const boughtByPeriod = new Array(periods.length).fill(0);

    for (const mv of sales as any[]) {
      const date = mv.data as Date;
      const idx = periods.findIndex((p) => date >= p.start && date <= p.end);
      if (idx === -1) continue;
      const qty = mv.quantidade ?? 0;
      const val = mv.valor ?? 0;
      soldByPeriod[idx] += qty;
      revenueByPeriod[idx] += val;
    }

    for (const mv of purchases as any[]) {
      const date = mv.data as Date;
      const idx = periods.findIndex((p) => date >= p.start && date <= p.end);
      if (idx === -1) continue;
      const qty = mv.quantidade ?? 0;
      const val = mv.valor ?? 0;
      boughtByPeriod[idx] += qty;
      purchasesByPeriod[idx] += val;
    }

    const avgPriceByPeriod = revenueByPeriod.map((rev, i) => {
      const qty = soldByPeriod[i] ?? 0;
      if (!qty) return 0;
      return rev / qty;
    });

    const avgPurchasePriceByPeriod = purchasesByPeriod.map((val, i) => {
      const qty = boughtByPeriod[i] ?? 0;
      if (!qty) return 0;
      return val / qty;
    });

    if (onboardingStart) {
      for (let i = 0; i < periods.length; i++) {
        if (periods[i].end < onboardingStart) {
          revenueByPeriod[i] = 0;
          soldByPeriod[i] = 0;
          purchasesByPeriod[i] = 0;
          boughtByPeriod[i] = 0;
        }
      }
    }

    const { currentStart, currentEnd, previousStart, previousEnd } =
      this.getCurrentAndPreviousPeriod(now, period);

    const [currentAgg, previousAgg, currentPurchaseAgg] = await Promise.all([
      this.prisma.movimento.aggregate({
        where: {
          propriedadeId: propertyId,
          tipo: 'venda' as any,
          data: { gte: currentStart, lte: currentEnd },
        },
        _sum: { valor: true, quantidade: true },
      }),
      this.prisma.movimento.aggregate({
        where: {
          propriedadeId: propertyId,
          tipo: 'venda' as any,
          data: { gte: previousStart, lte: previousEnd },
        },
        _sum: { valor: true, quantidade: true },
      }),
      this.prisma.movimento.aggregate({
        where: {
          propriedadeId: propertyId,
          tipo: 'compra' as any,
          data: { gte: currentStart, lte: currentEnd },
        },
        _sum: { valor: true, quantidade: true },
      }),
    ]);

    const totalRevenue = currentAgg._sum?.valor ?? 0;
    const cattleSold = currentAgg._sum?.quantidade ?? 0;
    const averagePrice = cattleSold ? totalRevenue / cattleSold : 0;

    const totalPurchase = currentPurchaseAgg._sum?.valor ?? 0;
    const cattleBought = currentPurchaseAgg._sum?.quantidade ?? 0;
    const averagePurchasePrice = cattleBought
      ? totalPurchase / cattleBought
      : 0;

    const prevRevenue = previousAgg._sum?.valor ?? 0;
    const monthlyGrowth = prevRevenue
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : 0;

    return {
      period,
      kpis: {
        totalRevenue,
        monthlyGrowth,
        cattleSold,
        averagePrice,
        totalPurchases: totalPurchase,
        cattleBought,
        averagePurchasePrice,
        netRevenue: totalRevenue - totalPurchase,
      },
      charts: {
        categories: periods.map((p) => p.label),
        revenue: revenueByPeriod,
        cattleSold: soldByPeriod,
        avgPrice: avgPriceByPeriod,
        purchases: purchasesByPeriod,
        cattleBought: boughtByPeriod,
        avgPurchasePrice: avgPurchasePriceByPeriod,
      },
      generatedAt: now.toISOString(),
    };
  }
}
