import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLivestockDto } from './dto/create-livestock.dto';
import { UpdateLivestockDto } from './dto/update-livestock.dto';

@Injectable()
export class LivestockService {
  constructor(private readonly prisma: PrismaService) {}

  private getStartDateFromMonths(months?: number) {
    const m = typeof months === 'number' && Number.isFinite(months) && months > 0 ? months : 1;
    const start = new Date();
    start.setMonth(start.getMonth() - m);
    return start;
  }

  async getBalance(propertyId: string) {
    const livestock = await this.prisma.rebanho.findMany({
      where: { propriedadeId: propertyId },
    });

    const total = livestock.reduce((sum: number, item: any) => sum + (item.cabecas ?? 0), 0);

    const byAgeGroupRaw = await this.prisma.rebanho.groupBy({
      by: ['faixaEtaria'],
      where: { propriedadeId: propertyId },
      _sum: { cabecas: true },
    });

    const byAgeGroup = (byAgeGroupRaw ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.faixaEtaria ?? 'unknown';
      acc[key] = row._sum?.cabecas ?? 0;
      return acc;
    }, {});

    const bySex = livestock.reduce((acc: Record<string, number>, item: any) => {
      const key = item.sexo ?? 'unknown';
      acc[key] = (acc[key] ?? 0) + (item.cabecas ?? 0);
      return acc;
    }, {});

    return {
      propertyId,
      livestock,
      total,
      byAgeGroup,
      bySex,
    };
  }

  async getHistory(propertyId: string, months?: number) {
    void months;
    return this.prisma.movimento.findMany({
      where: { propriedadeId: propertyId },
      orderBy: { data: 'desc' },
    });
  }

  async getMirror(propertyId: string, months?: number) {
    const startDate = this.getStartDateFromMonths(months);

    const [balance, movements] = await Promise.all([
      this.prisma.rebanho.findMany({
        where: { propriedadeId: propertyId, especie: 'bovino' },
      }),
      this.prisma.movimento.findMany({
        where: { propriedadeId: propertyId, data: { gte: startDate } },
        orderBy: { data: 'asc' },
      }),
    ]);

    const rowsByAge: Record<
      string,
      {
        ageGroupId: string;
        male: { currentBalance: number; entries: number; exits: number };
        female: { currentBalance: number; entries: number; exits: number };
      }
    > = {};

    const ensure = (ageGroupId: string) => {
      if (!rowsByAge[ageGroupId]) {
        rowsByAge[ageGroupId] = {
          ageGroupId,
          male: { currentBalance: 0, entries: 0, exits: 0 },
          female: { currentBalance: 0, entries: 0, exits: 0 },
        };
      }
      return rowsByAge[ageGroupId];
    };

    for (const item of balance as any[]) {
      const ageGroupId = item.faixaEtaria ?? 'unknown';
      const sex = item.sexo;
      const row = ensure(ageGroupId);
      if (sex === 'macho') row.male.currentBalance += item.cabecas ?? 0;
      if (sex === 'femea') row.female.currentBalance += item.cabecas ?? 0;
    }

    const entryTypes = new Set(['nascimento', 'compra', 'ajuste']);
    const exitTypes = new Set(['morte', 'venda']);

    for (const mv of movements as any[]) {
      const ageGroupId = mv.faixaEtaria ?? 'unknown';
      const sex = mv.sexo;
      const qty = mv.quantidade ?? 0;
      if (!qty || !sex) continue;

      const row = ensure(ageGroupId);
      const bucket = sex === 'macho' ? row.male : sex === 'femea' ? row.female : null;
      if (!bucket) continue;

      if (entryTypes.has(mv.tipo)) bucket.entries += qty;
      if (exitTypes.has(mv.tipo)) bucket.exits += qty;
    }

    const balances = Object.values(rowsByAge)
      .map((r) => {
        const malePrevious = Math.max(0, r.male.currentBalance - r.male.entries + r.male.exits);
        const femalePrevious = Math.max(0, r.female.currentBalance - r.female.entries + r.female.exits);
        return {
          ageGroupId: r.ageGroupId,
          male: {
            previousBalance: malePrevious,
            entries: r.male.entries,
            exits: r.male.exits,
            currentBalance: r.male.currentBalance,
          },
          female: {
            previousBalance: femalePrevious,
            entries: r.female.entries,
            exits: r.female.exits,
            currentBalance: r.female.currentBalance,
          },
        };
      })
      .sort((a, b) => a.ageGroupId.localeCompare(b.ageGroupId));

    const totals = balances.reduce(
      (acc: any, b: any) => {
        acc.total += (b.male.currentBalance ?? 0) + (b.female.currentBalance ?? 0);
        acc.male += b.male.currentBalance ?? 0;
        acc.female += b.female.currentBalance ?? 0;
        return acc;
      },
      { total: 0, male: 0, female: 0 },
    );

    return {
      propertyId,
      months: typeof months === 'number' ? months : 1,
      balances,
      totals,
    };
  }

  async getOtherSpeciesMirror(propertyId: string, months?: number) {
    const startDate = this.getStartDateFromMonths(months);

    const [balanceAgg, movements] = await Promise.all([
      this.prisma.rebanho.groupBy({
        by: ['especie'],
        where: { propriedadeId: propertyId, especie: { not: 'bovino' } },
        _sum: { cabecas: true },
      }),
      this.prisma.movimento.findMany({
        where: {
          propriedadeId: propertyId,
          data: { gte: startDate },
          especie: { not: 'bovino' },
        },
        orderBy: { data: 'asc' },
      }),
    ]);

    const entryTypes = new Set(['nascimento', 'compra', 'ajuste']);
    const exitTypes = new Set(['morte', 'venda']);

    const bySpecies: Record<
      string,
      {
        speciesId: string;
        speciesName: string;
        currentBalance: number;
        entries: number;
        exits: number;
        unit: 'cabeças' | 'unidades';
      }
    > = {};

    const getUnit = (speciesId: string): 'cabeças' | 'unidades' => {
      const key = (speciesId ?? '').toLowerCase();
      if (key.includes('ave')) return 'unidades';
      return 'cabeças';
    };

    const ensure = (speciesId: string) => {
      const id = speciesId || 'unknown';
      if (!bySpecies[id]) {
        bySpecies[id] = {
          speciesId: id,
          speciesName: id,
          currentBalance: 0,
          entries: 0,
          exits: 0,
          unit: getUnit(id),
        };
      }
      return bySpecies[id];
    };

    for (const row of balanceAgg as any[]) {
      const id = row.especie ?? 'unknown';
      const rec = ensure(id);
      rec.currentBalance += row._sum?.cabecas ?? 0;
    }

    for (const mv of movements as any[]) {
      const id = mv.especie ?? 'unknown';
      const qty = mv.quantidade ?? 0;
      if (!qty) continue;
      const rec = ensure(id);
      if (entryTypes.has(mv.tipo)) rec.entries += qty;
      if (exitTypes.has(mv.tipo)) rec.exits += qty;
    }

    const balances = Object.values(bySpecies)
      .map((r) => {
        const previousBalance = Math.max(0, r.currentBalance - r.entries + r.exits);
        return {
          speciesId: r.speciesId,
          speciesName: r.speciesName,
          previousBalance,
          entries: r.entries,
          exits: r.exits,
          currentBalance: r.currentBalance,
          unit: r.unit,
        };
      })
      .sort((a, b) => a.speciesName.localeCompare(b.speciesName));

    const total = balances.reduce((sum, r) => sum + (r.currentBalance ?? 0), 0);

    return {
      propertyId,
      months: typeof months === 'number' ? months : 1,
      balances,
      total,
    };
  }

  async getSummary(propertyId: string) {
    const balance = await this.getBalance(propertyId);
    return {
      total: balance.total,
      byAgeGroup: balance.byAgeGroup,
      bySex: balance.bySex,
    };
  }

  async recalculateAgeGroups(propertyId: string) {
    const result = await (this.prisma.rebanho as any).updateMany({
      where: { propriedadeId: propertyId },
      data: {},
    });
    return { updated: result?.count ?? 0 };
  }

  create(propertyId: string, dto: CreateLivestockDto) {
    return this.prisma.rebanho.create({
      data: {
        propriedadeId: propertyId,
        especie: dto.species,
        faixaEtaria: dto.ageGroup,
        sexo: dto.sex as any,
        cabecas: dto.headcount,
      },
    });
  }

  findAll(propertyId: string) {
    return this.prisma.rebanho.findMany({
      where: { propriedadeId: propertyId },
    });
  }

  update(id: string, dto: UpdateLivestockDto) {
    return this.prisma.rebanho.update({
      where: { id },
      data: dto as any,
    });
  }

  remove(id: string) {
    return this.prisma.rebanho.delete({ where: { id } });
  }
}
