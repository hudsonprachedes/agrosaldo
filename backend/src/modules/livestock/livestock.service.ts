import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLivestockDto } from './dto/create-livestock.dto';
import { UpdateLivestockDto } from './dto/update-livestock.dto';

@Injectable()
export class LivestockService {
  constructor(private readonly prisma: PrismaService) {}

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
