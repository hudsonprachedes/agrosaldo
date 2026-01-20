import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Sexo = 'macho' | 'femea';

@Injectable()
export class HerdEvolutionService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly HERD_SPECIES = ['bovino', 'bubalino'] as const;

  private isHerdSpecies(
    species: unknown,
  ): species is (typeof this.HERD_SPECIES)[number] {
    return (
      typeof species === 'string' &&
      (this.HERD_SPECIES as unknown as string[]).includes(species)
    );
  }

  private readonly CANONICAL_AGE_GROUPS = [
    '0-4m',
    '5-12m',
    '13-24m',
    '25-36m',
    '36+m',
  ] as const;

  normalizeAgeGroupId(raw: unknown): string {
    if (typeof raw !== 'string' || !raw) return 'unknown';
    const value = raw.trim();
    if (value.endsWith('m')) return value;
    const directMap: Record<string, string> = {
      '0-4': '0-4m',
      '5-12': '5-12m',
      '12-24': '13-24m',
      '13-24': '13-24m',
      '24-36': '25-36m',
      '25-36': '25-36m',
      '36+': '36+m',
      '36+m': '36+m',
    };
    return directMap[value] ?? value;
  }

  private assertCanonicalAgeGroup(ageGroupId: string) {
    if (
      !(this.CANONICAL_AGE_GROUPS as unknown as string[]).includes(ageGroupId)
    ) {
      throw new BadRequestException(`Faixa etária inválida: ${ageGroupId}`);
    }
  }

  private calculateFullMonthsBetween(baseDate: Date, refDate: Date) {
    const months =
      (refDate.getFullYear() - baseDate.getFullYear()) * 12 +
      (refDate.getMonth() - baseDate.getMonth());

    const adjusted =
      refDate.getDate() < baseDate.getDate() ? months - 1 : months;
    return Math.max(0, adjusted);
  }

  private getNextAgeGroup(ageGroupId: string): string {
    switch (ageGroupId) {
      case '0-4m':
        return '5-12m';
      case '5-12m':
        return '13-24m';
      case '13-24m':
        return '25-36m';
      case '25-36m':
        return '36+m';
      default:
        return '36+m';
    }
  }

  private getAgeGroupDurationMonths(ageGroupId: string): number {
    // Duração dentro da faixa a partir de uma data-base.
    // Regra oficial: a passagem ocorre ao completar o limite superior.
    // - 0-4: 4 meses
    // - 5-12: 8 meses (do 5 ao 12)
    // - 13-24: 12 meses
    // - 25-36: 12 meses
    // - 36+: infinito
    switch (ageGroupId) {
      case '0-4m':
        return 4;
      case '5-12m':
        return 8;
      case '13-24m':
        return 12;
      case '25-36m':
        return 12;
      default:
        return Number.POSITIVE_INFINITY;
    }
  }

  calculateAgeGroupFromBatch(
    initialAgeGroup: string,
    baseDate: Date,
    refDate: Date,
  ): string {
    const start = this.normalizeAgeGroupId(initialAgeGroup);
    this.assertCanonicalAgeGroup(start);

    const elapsedMonths = this.calculateFullMonthsBetween(baseDate, refDate);
    if (!elapsedMonths) return start;

    let current = start;
    let remaining = elapsedMonths;

    while (remaining > 0 && current !== '36+m') {
      const duration = this.getAgeGroupDurationMonths(current);
      if (!Number.isFinite(duration)) {
        return '36+m';
      }

      if (remaining < duration) {
        return current;
      }

      remaining -= duration;
      current = this.getNextAgeGroup(current);
    }

    return current;
  }

  private async applyStockDelta(
    tx: PrismaService,
    params: {
      propertyId: string;
      species: string;
      sex: Sexo;
      ageGroup: string;
      delta: number;
    },
  ) {
    const { propertyId, species, sex, ageGroup, delta } = params;
    if (!delta) return;

    const existing = await tx.rebanho.findFirst({
      where: {
        propriedadeId: propertyId,
        especie: species,
        sexo: sex as any,
        faixaEtaria: ageGroup,
      },
      select: { id: true, cabecas: true },
    });

    if (!existing) {
      const headcount = Math.max(0, delta);
      if (!headcount) return;
      await tx.rebanho.create({
        data: {
          propriedadeId: propertyId,
          especie: species,
          sexo: sex as any,
          faixaEtaria: ageGroup,
          cabecas: headcount,
        },
      });
      return;
    }

    const next = Math.max(0, Number(existing.cabecas ?? 0) + delta);
    await tx.rebanho.update({
      where: { id: existing.id },
      data: { cabecas: next },
    });
  }

  private async createSystemEvolutionMovement(
    tx: PrismaService,
    params: {
      propertyId: string;
      species: string;
      now: Date;
      sex: Sexo;
      fromAgeGroup: string;
      toAgeGroup: string;
      quantity: number;
    },
  ) {
    const {
      propertyId,
      species,
      now,
      sex,
      fromAgeGroup,
      toAgeGroup,
      quantity,
    } = params;

    await tx.movimento.create({
      data: {
        propriedadeId: propertyId,
        tipo: 'ajuste' as any,
        especie: species,
        data: now,
        quantidade: quantity,
        sexo: sex as any,
        faixaEtaria: null,
        descricao: `[SISTEMA] Evolução automática de faixa etária: ${quantity} ${sex === 'macho' ? 'macho(s)' : 'fêmea(s)'} de ${fromAgeGroup} -> ${toAgeGroup}`,
        destino: null,
        valor: null,
        numeroGta: null,
        fotoUrl: null,
        causa: null,
      } as any,
    });
  }

  async evolveBatchesToDate(
    tx: PrismaService,
    propertyId: string,
    species: string,
    refDate: Date,
  ) {
    if (!this.isHerdSpecies(species)) return;
    const batches = await (tx as any).loteRebanho.findMany({
      where: {
        propriedadeId: propertyId,
        especie: species,
        quantidadeAtual: { gt: 0 },
      },
      select: {
        id: true,
        sexo: true,
        faixaInicial: true,
        faixaAtual: true,
        dataBase: true,
        quantidadeAtual: true,
      },
      orderBy: [{ dataBase: 'asc' }, { criadoEm: 'asc' }],
    });

    const grouped: Record<string, number> = {};

    for (const b of batches as any[]) {
      const qty = Number(b.quantidadeAtual ?? 0);
      if (!qty) continue;

      const sex = b.sexo as Sexo;
      const fromAgeGroup = this.normalizeAgeGroupId(b.faixaAtual);
      const toAgeGroup = this.calculateAgeGroupFromBatch(
        b.faixaInicial,
        new Date(b.dataBase),
        refDate,
      );
      if (fromAgeGroup === toAgeGroup) continue;

      this.assertCanonicalAgeGroup(fromAgeGroup);
      this.assertCanonicalAgeGroup(toAgeGroup);

      await this.applyStockDelta(tx, {
        propertyId,
        species,
        sex,
        ageGroup: fromAgeGroup,
        delta: -qty,
      });

      await this.applyStockDelta(tx, {
        propertyId,
        species,
        sex,
        ageGroup: toAgeGroup,
        delta: qty,
      });

      await (tx as any).loteRebanho.update({
        where: { id: b.id },
        data: { faixaAtual: toAgeGroup },
      });

      const key = `${sex}|${fromAgeGroup}|${toAgeGroup}`;
      grouped[key] = (grouped[key] ?? 0) + qty;
    }

    for (const [key, quantity] of Object.entries(grouped)) {
      const [sex, fromAgeGroup, toAgeGroup] = key.split('|') as [
        Sexo,
        string,
        string,
      ];
      await this.createSystemEvolutionMovement(tx, {
        propertyId,
        species,
        now: refDate,
        sex,
        fromAgeGroup,
        toAgeGroup,
        quantity,
      });
    }
  }

  async createBatchEntry(
    tx: PrismaService,
    params: {
      propertyId: string;
      species: string;
      sex: Sexo;
      initialAgeGroup: string;
      baseDate: Date;
      quantity: number;
      source: 'saldo_inicial' | 'nascimento' | 'compra' | 'ajuste';
    },
  ) {
    const initial = this.normalizeAgeGroupId(params.initialAgeGroup);
    this.assertCanonicalAgeGroup(initial);

    const qty = Math.max(0, Math.trunc(params.quantity));
    if (!qty) return;

    const currentAgeGroup = initial;

    await (tx as any).loteRebanho.create({
      data: {
        propriedadeId: params.propertyId,
        especie: params.species,
        sexo: params.sex as any,
        faixaInicial: initial,
        faixaAtual: currentAgeGroup,
        dataBase: params.baseDate,
        quantidadeAtual: qty,
        origem: params.source,
      },
    });

    await this.applyStockDelta(tx, {
      propertyId: params.propertyId,
      species: params.species,
      sex: params.sex,
      ageGroup: currentAgeGroup,
      delta: qty,
    });
  }

  async debitFromAgeGroup(
    tx: PrismaService,
    params: {
      propertyId: string;
      species: string;
      sex: Sexo;
      ageGroup: string;
      quantity: number;
      refDate: Date;
    },
  ) {
    const ageGroup = this.normalizeAgeGroupId(params.ageGroup);
    this.assertCanonicalAgeGroup(ageGroup);

    if (!this.isHerdSpecies(params.species)) return;

    const qty = Math.max(0, Math.trunc(params.quantity));
    if (!qty) return;

    await this.evolveBatchesToDate(
      tx,
      params.propertyId,
      params.species,
      params.refDate,
    );

    const batches = await (tx as any).loteRebanho.findMany({
      where: {
        propriedadeId: params.propertyId,
        especie: params.species,
        sexo: params.sex as any,
        faixaAtual: ageGroup,
        quantidadeAtual: { gt: 0 },
      },
      select: {
        id: true,
        quantidadeAtual: true,
      },
      orderBy: [{ dataBase: 'asc' }, { criadoEm: 'asc' }],
    });

    const available = (batches as any[]).reduce(
      (sum, b) => sum + Number(b.quantidadeAtual ?? 0),
      0,
    );

    if (available < qty) {
      throw new BadRequestException(
        `Saldo insuficiente na faixa ${ageGroup} (${params.sex}). Disponível: ${available}, solicitado: ${qty}`,
      );
    }

    let remaining = qty;

    for (const b of batches as any[]) {
      if (remaining <= 0) break;

      const current = Number(b.quantidadeAtual ?? 0);
      if (!current) continue;

      const take = Math.min(current, remaining);
      remaining -= take;

      await (tx as any).loteRebanho.update({
        where: { id: b.id },
        data: { quantidadeAtual: current - take },
      });

      await this.applyStockDelta(tx, {
        propertyId: params.propertyId,
        species: params.species,
        sex: params.sex,
        ageGroup,
        delta: -take,
      });
    }
  }

  async rebuildFromMovements(tx: PrismaService, propertyId: string) {
    await (tx as any).loteRebanho.deleteMany({
      where: {
        propriedadeId: propertyId,
        especie: { in: [...this.HERD_SPECIES] },
      },
    });

    await tx.rebanho.deleteMany({
      where: {
        propriedadeId: propertyId,
        especie: { in: [...this.HERD_SPECIES] },
      },
    });

    const movements = await tx.movimento.findMany({
      where: {
        propriedadeId: propertyId,
        especie: { in: [...this.HERD_SPECIES] },
      } as any,
      orderBy: { data: 'asc' },
    });

    for (const mv of movements as any[]) {
      const type = String(mv.tipo ?? '');
      const description = String(mv.descricao ?? '');
      const mvDate = new Date(mv.data);
      const speciesRaw = mv.especie;
      const species = this.isHerdSpecies(speciesRaw) ? speciesRaw : null;
      if (!species) continue;

      if (
        type === 'ajuste' &&
        description.startsWith('[SISTEMA] Evolução automática')
      ) {
        continue;
      }

      await this.evolveBatchesToDate(tx, propertyId, species, mvDate);

      const qty = Number(mv.quantidade ?? 0);
      if (!qty) continue;

      const sex = mv.sexo as Sexo | null;
      const ageGroup = this.normalizeAgeGroupId(mv.faixaEtaria);

      if (
        type === 'ajuste' &&
        description === '[SISTEMA] Saldo inicial (onboarding)'
      ) {
        if (!sex) continue;
        await this.createBatchEntry(tx, {
          propertyId,
          species,
          sex,
          initialAgeGroup: ageGroup,
          baseDate: mvDate,
          quantity: qty,
          source: 'saldo_inicial',
        });
        continue;
      }

      if (type === 'nascimento') {
        if (!sex) continue;
        await this.createBatchEntry(tx, {
          propertyId,
          species,
          sex,
          initialAgeGroup: '0-4m',
          baseDate: mvDate,
          quantity: qty,
          source: 'nascimento',
        });
        continue;
      }

      if (type === 'compra' || type === 'ajuste') {
        if (!sex) continue;
        await this.createBatchEntry(tx, {
          propertyId,
          species,
          sex,
          initialAgeGroup: ageGroup,
          baseDate: mvDate,
          quantity: qty,
          source: type === 'compra' ? 'compra' : 'ajuste',
        });
        continue;
      }

      if (type === 'venda' || type === 'morte') {
        if (!sex) continue;
        await this.debitFromAgeGroup(tx, {
          propertyId,
          species,
          sex,
          ageGroup,
          quantity: qty,
          refDate: mvDate,
        });
        continue;
      }
    }

    const now = new Date();
    for (const sp of this.HERD_SPECIES) {
      await this.evolveBatchesToDate(tx, propertyId, sp, now);
    }

    const herdAgg = await tx.rebanho.groupBy({
      by: ['propriedadeId'],
      where: {
        propriedadeId: propertyId,
        especie: { in: [...this.HERD_SPECIES] },
      },
      _sum: { cabecas: true },
    });

    const total = (herdAgg ?? []).reduce((sum: number, row: any) => {
      return sum + (row._sum?.cabecas ?? 0);
    }, 0);

    await (tx as any).propriedade.update({
      where: { id: propertyId },
      data: { quantidadeGado: total },
    });
  }
}
