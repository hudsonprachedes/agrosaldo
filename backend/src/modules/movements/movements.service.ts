import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

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
    }
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
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const dayOfWeek = now.getDay(); // 0=dom
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

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
      lastUpdatedAt: last._max?.criadoEm ? (last._max.criadoEm as Date).toISOString() : null,
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
    return this.prisma.movimento.create({
      data: {
        propriedadeId: propertyId,
        tipo: this.mapTipo(dto.type) as any,
        data: new Date(dto.date),
        quantidade: dto.quantity,
        sexo: this.mapSexo(dto.sex) as any,
        faixaEtaria: dto.ageGroup,
        descricao: dto.description,
        destino: dto.destination,
        valor: dto.value,
        numeroGta: dto.gtaNumber,
        fotoUrl: dto.photoUrl,
        causa: dto.cause,
      },
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

  update(id: string, dto: UpdateMovementDto) {
    return this.prisma.movimento.update({
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
  }

  remove(id: string) {
    return this.prisma.movimento.delete({ where: { id } });
  }

  async attachPhoto(propertyId: string, movementId: string, file: { buffer: Buffer; mimetype?: string }) {
    const movement = await this.prisma.movimento.findUnique({ where: { id: movementId } });
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
    const movement = await this.prisma.movimento.findUnique({ where: { id: movementId } });
    if (!movement) {
      throw new NotFoundException('Movimento não encontrado');
    }
    if ((movement as any).propriedadeId !== propertyId) {
      throw new ForbiddenException('Property mismatch');
    }

    const data = (movement as any).fotoData as Buffer | null | undefined;
    const mimeType = ((movement as any).fotoMimeType as string | null | undefined) ?? 'image/jpeg';

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
