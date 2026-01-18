import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private calculateAgeGroupFromBirthDate(birthDate: Date, now: Date) {
    const ageInMonths = this.calculateAgeInMonths(birthDate, now);
    for (const bracket of this.AGE_GROUP_BRACKETS) {
      if (ageInMonths >= bracket.minMonths && ageInMonths <= bracket.maxMonths) {
        return bracket.id;
      }
    }
    return '36+m';
  }

  private async ensureAgeGroupEvolution(
    tx: PrismaService,
    propertyId: string,
  ) {
    const now = new Date();

    const births = await tx.movimento.findMany({
      where: {
        propriedadeId: propertyId,
        tipo: 'nascimento' as any,
        especie: 'bovino',
        sexo: { not: null },
        faixaEtaria: { not: null },
      },
      select: {
        id: true,
        data: true,
        quantidade: true,
        sexo: true,
        faixaEtaria: true,
        descricao: true,
      } as any,
      orderBy: { data: 'asc' },
      take: 500,
    });

    for (const b of births as any[]) {
      const qty = Number(b.quantidade) || 0;
      if (!qty) continue;
      const birthDate = new Date(b.data);
      const fromAgeGroup = String(b.faixaEtaria ?? '');
      const toAgeGroup = this.calculateAgeGroupFromBirthDate(birthDate, now);
      if (!fromAgeGroup || fromAgeGroup === toAgeGroup) continue;

      const sex = b.sexo as 'macho' | 'femea' | null;
      if (!sex) continue;

      await this.applyStockDelta(tx as any, {
        propertyId,
        species: 'bovino',
        sex,
        ageGroup: fromAgeGroup,
        delta: -qty,
      });

      await this.applyStockDelta(tx as any, {
        propertyId,
        species: 'bovino',
        sex,
        ageGroup: toAgeGroup,
        delta: qty,
      });

      await tx.movimento.update({
        where: { id: b.id },
        data: { faixaEtaria: toAgeGroup } as any,
      });

      await tx.movimento.create({
        data: {
          propriedadeId: propertyId,
          tipo: 'ajuste' as any,
          especie: 'bovino',
          data: now,
          quantidade: qty,
          sexo: sex as any,
          faixaEtaria: null,
          descricao: `[SISTEMA] Evolução automática de faixa etária: ${qty} ${sex === 'macho' ? 'macho(s)' : 'fêmea(s)'} de ${fromAgeGroup} -> ${toAgeGroup} (nasc. ${birthDate.toISOString().slice(0, 10)})`,
          destino: null,
          valor: null,
          numeroGta: null,
          fotoUrl: null,
          causa: null,
        } as any,
      });
    }
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
    if (tipo === 'nascimento' || tipo === 'compra' || tipo === 'ajuste') return q;
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
    const especie = 'bovino';

    return this.prisma.$transaction(async (tx) => {
      await this.ensureAgeGroupEvolution(tx as any, propertyId);

      const created = await tx.movimento.create({
        data: {
          propriedadeId: propertyId,
          tipo,
          especie,
          data: new Date(dto.date),
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

      const impacts = this.impactsStock(created.tipo as any);
      const delta = this.getStockDelta(created.tipo as any, (created as any).quantidade);
      if (
        impacts &&
        delta &&
        (created as any).sexo &&
        (created as any).faixaEtaria &&
        (created as any).especie
      ) {
        await this.applyStockDelta(tx as any, {
          propertyId,
          species: (created as any).especie,
          sex: (created as any).sexo,
          ageGroup: (created as any).faixaEtaria,
          delta,
        });
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

  findOne(id: string) {
    return this.prisma.movimento.findUnique({
      where: { id },
      select: this.selectPublicMovement() as any,
    });
  }

  async update(id: string, dto: UpdateMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.movimento.findUnique({ where: { id } });
      if (!before) {
        throw new NotFoundException('Movimento não encontrado');
      }

      await this.ensureAgeGroupEvolution(tx as any, (before as any).propriedadeId);

      const updated = await tx.movimento.update({
        where: { id },
        data: {
          tipo: this.mapTipo(dto.type) as any,
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

      const beforeImpacts = this.impactsStock(before.tipo as any);
      const afterImpacts = this.impactsStock(updated.tipo as any);

      if (beforeImpacts && (before as any).sexo && (before as any).faixaEtaria && (before as any).especie) {
        const delta = this.getStockDelta(before.tipo as any, (before as any).quantidade);
        if (delta) {
          await this.applyStockDelta(tx as any, {
            propertyId: (before as any).propriedadeId,
            species: (before as any).especie,
            sex: (before as any).sexo,
            ageGroup: (before as any).faixaEtaria,
            delta: -delta,
          });
        }
      }

      if (afterImpacts && (updated as any).sexo && (updated as any).faixaEtaria && (updated as any).especie) {
        const delta = this.getStockDelta(updated.tipo as any, (updated as any).quantidade);
        if (delta) {
          await this.applyStockDelta(tx as any, {
            propertyId: (updated as any).propriedadeId,
            species: (updated as any).especie,
            sex: (updated as any).sexo,
            ageGroup: (updated as any).faixaEtaria,
            delta,
          });
        }
      }

      void afterImpacts;
      return updated;
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.movimento.findUnique({ where: { id } });
      if (!before) {
        throw new NotFoundException('Movimento não encontrado');
      }

      await this.ensureAgeGroupEvolution(tx as any, (before as any).propriedadeId);

      const removed = await tx.movimento.delete({ where: { id } });

      const impacts = this.impactsStock(before.tipo as any);
      if (impacts && (before as any).sexo && (before as any).faixaEtaria && (before as any).especie) {
        const delta = this.getStockDelta(before.tipo as any, (before as any).quantidade);
        if (delta) {
          await this.applyStockDelta(tx as any, {
            propertyId: (before as any).propriedadeId,
            species: (before as any).especie,
            sex: (before as any).sexo,
            ageGroup: (before as any).faixaEtaria,
            delta: -delta,
          });
        }
      }

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
