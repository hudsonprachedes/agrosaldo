import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HerdEvolutionService } from '../../common/herd-evolution.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { OtherSpeciesAdjustmentDto } from './dto/other-species-adjustment.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';

@Injectable()
export class MovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly herdEvolution: HerdEvolutionService,
  ) {}

  private readonly HERD_SPECIES = ['bovino', 'bubalino'] as const;

  private normalizeSpecies(raw: unknown): string {
    if (typeof raw !== 'string' || !raw.trim()) return 'bovino';
    return raw.trim().toLowerCase();
  }

  private isHerdSpecies(species: string) {
    return (this.HERD_SPECIES as unknown as string[]).includes(species);
  }

  private readonly AGE_GROUP_BRACKETS = [
    { id: '0-4m', minMonths: 0, maxMonths: 4 },
    { id: '5-12m', minMonths: 5, maxMonths: 12 },
    { id: '13-24m', minMonths: 13, maxMonths: 24 },
    { id: '25-36m', minMonths: 25, maxMonths: 36 },
    { id: '36+m', minMonths: 36, maxMonths: Infinity },
  ] as const;

  private calculateAgeInMonths(birthDate: Date, now: Date) {
    const months =
      (now.getFullYear() - birthDate.getFullYear()) * 12 +
      (now.getMonth() - birthDate.getMonth());
    if (now.getDate() < birthDate.getDate()) {
      return Math.max(0, months - 1);
    }
    return Math.max(0, months);
  }

  async adjustOtherSpeciesBalances(
    propertyId: string,
    dto: OtherSpeciesAdjustmentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const date = new Date(dto.date);
      const notes = dto.notes ? String(dto.notes) : '';

      for (const item of dto.balances ?? []) {
        const speciesId = String((item as any).speciesId ?? '').trim();
        if (!speciesId) continue;

        const normalizedSpecies = this.normalizeSpecies(speciesId);
        if (this.isHerdSpecies(normalizedSpecies)) continue;

        const target = Math.max(0, Number((item as any).count) || 0);

        const existing = await (tx as any).saldoOutrasEspecies.findUnique({
          where: {
            propriedadeId_especie: {
              propriedadeId: propertyId,
              especie: normalizedSpecies,
            },
          },
          select: { id: true, cabecas: true },
        });

        const current = Number(existing?.cabecas ?? 0);
        const delta = target - current;

        await (tx as any).saldoOutrasEspecies.upsert({
          where: {
            propriedadeId_especie: {
              propriedadeId: propertyId,
              especie: normalizedSpecies,
            },
          },
          update: {
            cabecas: target,
            snapshotEm: date,
          },
          create: {
            propriedadeId: propertyId,
            especie: normalizedSpecies,
            cabecas: target,
            snapshotEm: date,
          },
        });

        if (delta !== 0) {
          await tx.movimento.create({
            data: {
              propriedadeId: propertyId,
              tipo: 'ajuste' as any,
              especie: normalizedSpecies,
              data: date,
              quantidade: Math.abs(delta),
              sexo: null,
              faixaEtaria: null,
              descricao:
                `[SISTEMA] Ajuste de saldo - Outras espécies (${normalizedSpecies}): ${current} -> ${target}. delta:${delta}. ${notes}`.trim(),
              destino: null,
              valor: null,
              numeroGta: null,
              fotoUrl: null,
              causa: null,
            } as any,
          });
        }
      }

      return { success: true };
    });
  }

  private calculateAgeGroupFromBirthDate(birthDate: Date, now: Date) {
    const ageInMonths = this.calculateAgeInMonths(birthDate, now);
    for (const bracket of this.AGE_GROUP_BRACKETS) {
      if (
        ageInMonths >= bracket.minMonths &&
        ageInMonths <= bracket.maxMonths
      ) {
        return bracket.id;
      }
    }
    return '36+m';
  }

  private isSystemMovement(description?: string | null) {
    const d = String(description ?? '');
    return d.startsWith('[SISTEMA]');
  }

  private impactsStock(tipo?: string) {
    return (
      tipo === 'nascimento' ||
      tipo === 'compra' ||
      tipo === 'ajuste' ||
      tipo === 'morte' ||
      tipo === 'venda'
    );
  }

  private getStockDelta(tipo?: string, qty?: number) {
    const q = typeof qty === 'number' && Number.isFinite(qty) ? qty : 0;
    if (!q) return 0;
    if (tipo === 'morte' || tipo === 'venda') return -q;
    if (tipo === 'nascimento' || tipo === 'compra' || tipo === 'ajuste')
      return q;
    return 0;
  }

  private async applyStockDelta(
    prisma: PrismaService,
    params: {
      propertyId: string;
      species: string;
      sex: 'macho' | 'femea';
      ageGroup: string;
      delta: number;
    },
  ) {
    const { propertyId, species, sex, ageGroup, delta } = params;
    if (!delta) return;

    const existing = await prisma.rebanho.findFirst({
      where: {
        propriedadeId: propertyId,
        especie: species,
        sexo: sex as any,
        faixaEtaria: ageGroup,
      },
    });

    if (!existing) {
      const headcount = Math.max(0, delta);
      if (!headcount) return;
      await prisma.rebanho.create({
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

    const next = Math.max(0, (existing as any).cabecas + delta);
    await prisma.rebanho.update({
      where: { id: (existing as any).id },
      data: { cabecas: next },
    });
  }

  private mapTipoToFrontend(tipo?: string) {
    switch (tipo) {
      case 'nascimento':
        return 'birth';
      case 'morte':
        return 'death';
      case 'venda':
        return 'sale';
      case 'compra':
        return 'purchase';
      case 'vacina':
        return 'vaccine';
      case 'ajuste':
        return 'adjustment';
      default:
        return (tipo as any) ?? 'adjustment';
    }
  }

  private mapSexoToFrontend(sexo?: string | null) {
    switch (sexo) {
      case 'macho':
        return 'male';
      case 'femea':
        return 'female';
      default:
        return undefined;
    }
  }

  private selectPublicMovement() {
    return {
      id: true,
      propriedadeId: true,
      tipo: true,
      especie: true,
      data: true,
      quantidade: true,
      sexo: true,
      faixaEtaria: true,
      descricao: true,
      destino: true,
      valor: true,
      numeroGta: true,
      fotoUrl: true,
      causa: true,
      criadoEm: true,
    } as const;
  }

  async getExtract(
    propertyId: string,
    params: {
      type?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      propriedadeId: propertyId,
    };

    if (params.type && params.type !== 'all') {
      where.tipo = this.mapTipo(params.type);
    }

    if (params.dateFrom || params.dateTo) {
      where.data = {};
      if (params.dateFrom) where.data.gte = new Date(params.dateFrom);
      if (params.dateTo) where.data.lte = new Date(params.dateTo);
    }

    const [total, items] = await Promise.all([
      this.prisma.movimento.count({ where }),
      this.prisma.movimento.findMany({
        where,
        select: this.selectPublicMovement() as any,
        orderBy: { data: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const data = (items as any[]).map((m) => ({
      id: m.id,
      type: this.mapTipoToFrontend(m.tipo),
      date: (m.data as Date).toISOString().slice(0, 10),
      quantity: m.quantidade,
      sex: this.mapSexoToFrontend(m.sexo),
      ageGroupId: m.faixaEtaria ?? undefined,
      description: m.descricao,
      destination: m.destino ?? undefined,
      value: m.valor ?? undefined,
      gtaNumber: m.numeroGta ?? undefined,
      photoUrl: m.fotoUrl ?? undefined,
      cause: m.causa ?? undefined,
      propertyId: m.propriedadeId,
      createdAt: (m.criadoEm as Date).toISOString(),
    }));

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSummary(propertyId: string) {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const dayOfWeek = now.getDay(); // 0=dom
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const [todayCount, weekCount, monthCount, last] = await Promise.all([
      this.prisma.movimento.count({
        where: { propriedadeId: propertyId, criadoEm: { gte: startOfDay } },
      }),
      this.prisma.movimento.count({
        where: { propriedadeId: propertyId, criadoEm: { gte: startOfWeek } },
      }),
      this.prisma.movimento.count({
        where: { propriedadeId: propertyId, criadoEm: { gte: startOfMonth } },
      }),
      this.prisma.movimento.aggregate({
        where: { propriedadeId: propertyId },
        _max: { criadoEm: true },
      }),
    ]);

    return {
      propertyId,
      today: todayCount,
      week: weekCount,
      month: monthCount,
      lastUpdatedAt: last._max?.criadoEm
        ? last._max.criadoEm.toISOString()
        : null,
      serverTime: now.toISOString(),
    };
  }

  private mapTipo(tipo?: string) {
    switch (tipo) {
      case 'birth':
        return 'nascimento';
      case 'death':
        return 'morte';
      case 'sale':
        return 'venda';
      case 'purchase':
        return 'compra';
      case 'vaccine':
        return 'vacina';
      case 'adjustment':
        return 'ajuste';
      default:
        return tipo;
    }
  }

  private mapSexo(sexo?: string) {
    switch (sexo) {
      case 'male':
        return 'macho';
      case 'female':
        return 'femea';
      default:
        return sexo;
    }
  }

  create(propertyId: string, dto: CreateMovementDto) {
    const tipo = this.mapTipo(dto.type) as any;
    const sexo = this.mapSexo(dto.sex) as any;
    const faixaEtaria = dto.ageGroup;
    const especie = this.normalizeSpecies((dto as any).species);

    return this.prisma.$transaction(async (tx) => {
      const eventDate = new Date(dto.date);
      if (this.isHerdSpecies(especie)) {
        await this.herdEvolution.evolveBatchesToDate(
          tx as any,
          propertyId,
          especie,
          eventDate,
        );
      }

      const created = await tx.movimento.create({
        data: {
          propriedadeId: propertyId,
          tipo,
          especie,
          data: eventDate,
          quantidade: dto.quantity,
          sexo,
          faixaEtaria,
          descricao: dto.description,
          destino: dto.destination,
          valor: dto.value,
          numeroGta: dto.gtaNumber,
          fotoUrl: dto.photoUrl,
          causa: dto.cause,
        },
      });

      const createdType = created.tipo as any;
      const createdDesc = (created as any).descricao as string;
      const createdSex = (created as any).sexo as 'macho' | 'femea' | null;
      const createdSpecies = this.normalizeSpecies((created as any).especie);
      const createdAgeGroup = this.herdEvolution.normalizeAgeGroupId(
        (created as any).faixaEtaria,
      );
      const qty = Number((created as any).quantidade ?? 0);

      if (
        !this.isSystemMovement(createdDesc) &&
        this.isHerdSpecies(createdSpecies) &&
        createdSex &&
        qty > 0
      ) {
        if (createdType === 'nascimento') {
          await this.herdEvolution.createBatchEntry(tx as any, {
            propertyId,
            species: createdSpecies,
            sex: createdSex,
            initialAgeGroup: '0-4m',
            baseDate: eventDate,
            quantity: qty,
            source: 'nascimento',
          });
        }

        if (createdType === 'compra') {
          await this.herdEvolution.createBatchEntry(tx as any, {
            propertyId,
            species: createdSpecies,
            sex: createdSex,
            initialAgeGroup: createdAgeGroup,
            baseDate: eventDate,
            quantity: qty,
            source: 'compra',
          });
        }

        if (createdType === 'ajuste') {
          await this.herdEvolution.createBatchEntry(tx as any, {
            propertyId,
            species: createdSpecies,
            sex: createdSex,
            initialAgeGroup: createdAgeGroup,
            baseDate: eventDate,
            quantity: qty,
            source: 'ajuste',
          });
        }

        if (createdType === 'venda' || createdType === 'morte') {
          await this.herdEvolution.debitFromAgeGroup(tx as any, {
            propertyId,
            species: createdSpecies,
            sex: createdSex,
            ageGroup: createdAgeGroup,
            quantity: qty,
            refDate: eventDate,
          });
        }
      }

      return created;
    });
  }

  findAll(propertyId: string) {
    return this.prisma.movimento.findMany({
      where: { propriedadeId: propertyId },
      select: this.selectPublicMovement() as any,
      orderBy: { data: 'desc' },
    });
  }

  async findOne(propertyId: string, id: string) {
    const row = await this.prisma.movimento.findUnique({
      where: { id },
      select: this.selectPublicMovement() as any,
    });

    if (!row) {
      throw new NotFoundException('Movimento não encontrado');
    }

    if ((row as any).propriedadeId !== propertyId) {
      throw new ForbiddenException('Property mismatch');
    }

    return row;
  }

  async update(propertyId: string, id: string, dto: UpdateMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.movimento.findUnique({ where: { id } });
      if (!before) {
        throw new NotFoundException('Movimento não encontrado');
      }

      if ((before as any).propriedadeId !== propertyId) {
        throw new ForbiddenException('Property mismatch');
      }

      const updated = await tx.movimento.update({
        where: { id },
        data: {
          tipo: this.mapTipo(dto.type) as any,
          especie: dto.species ? this.normalizeSpecies(dto.species) : undefined,
          data: dto.date ? new Date(dto.date) : undefined,
          quantidade: dto.quantity,
          sexo: this.mapSexo(dto.sex) as any,
          faixaEtaria: dto.ageGroup,
          descricao: dto.description,
          destino: dto.destination,
          valor: dto.value,
          numeroGta: dto.gtaNumber,
          fotoUrl: dto.photoUrl,
          causa: dto.cause,
        } as any,
      });

      await this.herdEvolution.rebuildFromMovements(tx as any, propertyId);

      return updated;
    });
  }

  async remove(propertyId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.movimento.findUnique({ where: { id } });
      if (!before) {
        throw new NotFoundException('Movimento não encontrado');
      }

      if ((before as any).propriedadeId !== propertyId) {
        throw new ForbiddenException('Property mismatch');
      }

      const removed = await tx.movimento.delete({ where: { id } });

      await this.herdEvolution.rebuildFromMovements(tx as any, propertyId);

      return removed;
    });
  }

  async attachPhoto(
    propertyId: string,
    movementId: string,
    file: { buffer: Buffer; mimetype?: string },
  ) {
    const movement = await this.prisma.movimento.findUnique({
      where: { id: movementId },
    });
    if (!movement) {
      throw new NotFoundException('Movimento não encontrado');
    }
    if ((movement as any).propriedadeId !== propertyId) {
      throw new ForbiddenException('Property mismatch');
    }

    return this.prisma.movimento.update({
      where: { id: movementId },
      data: {
        fotoUrl: `/api/lancamentos/${movementId}/foto`,
        fotoData: file.buffer,
        fotoMimeType: file.mimetype ?? 'image/jpeg',
      } as any,
    });
  }

  async getPhoto(propertyId: string, movementId: string) {
    const movement = await this.prisma.movimento.findUnique({
      where: { id: movementId },
    });
    if (!movement) {
      throw new NotFoundException('Movimento não encontrado');
    }
    if ((movement as any).propriedadeId !== propertyId) {
      throw new ForbiddenException('Property mismatch');
    }

    const data = (movement as any).fotoData as Buffer | null | undefined;
    const mimeType =
      ((movement as any).fotoMimeType as string | null | undefined) ??
      'image/jpeg';

    if (!data) {
      throw new NotFoundException('Foto não encontrada');
    }

    return { data, mimeType };
  }

  findHistory(propertyId: string, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    return this.prisma.movimento.findMany({
      where: { propriedadeId: propertyId, data: { gte: startDate } },
      select: this.selectPublicMovement() as any,
      orderBy: { data: 'desc' },
    });
  }

  async cleanupOldPhotos(propertyId: string, days = 180) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.prisma.movimento.updateMany({
      where: {
        propriedadeId: propertyId,
        criadoEm: { lt: cutoff },
        fotoData: { not: null },
      } as any,
      data: {
        fotoData: null,
        fotoMimeType: null,
        fotoUrl: null,
      } as any,
    });

    return {
      propertyId,
      days,
      removed: result.count,
      cutoff: cutoff.toISOString(),
    };
  }
}
