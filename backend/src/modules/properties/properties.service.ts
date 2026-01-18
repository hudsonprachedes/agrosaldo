import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapPropertyToDto(property: any, userId: string) {
    return {
      id: property.id,
      userId,
      name: property.nome,
      cep: property.cep ?? undefined,
      street: property.logradouro ?? undefined,
      number: property.numero ?? undefined,
      complement: property.complemento ?? undefined,
      district: property.bairro ?? undefined,
      accessRoute: property.viaAcesso ?? undefined,
      community: property.comunidade ?? undefined,
      city: property.cidade,
      state: property.estado,
      stateRegistration: property.inscricaoEstadual ?? undefined,
      propertyCode: property.codigoPropriedade ?? undefined,
      totalArea: property.areaTotal,
      cultivatedArea: property.areaCultivada,
      naturalArea: property.areaNatural,
      pastureNaturalHa: property.pastoNaturalHa ?? undefined,
      pastureCultivatedHa: property.pastoCultivadoHa ?? undefined,
      areaTotalHa: property.areaTotalHa ?? undefined,
      cattleCount: property.quantidadeGado,
      status: property.status,
      plan: property.plano,
      speciesEnabled: property.especiesHabilitadas ?? undefined,
      createdAt: property.criadoEm?.toISOString ? property.criadoEm.toISOString() : property.criadoEm,
      updatedAt: property.atualizadoEm?.toISOString ? property.atualizadoEm.toISOString() : property.atualizadoEm,
    };
  }

  private async assertUserHasProperty(userId: string, propertyId: string) {
    const link = await this.prisma.usuarioPropriedade.findFirst({
      where: { usuarioId: userId, propriedadeId: propertyId },
    });
    if (!link) {
      throw new ForbiddenException('Sem acesso à propriedade');
    }
  }

  async findMine(userId: string) {
    const rows = await this.prisma.usuarioPropriedade.findMany({
      where: { usuarioId: userId },
      include: { propriedade: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.mapPropertyToDto(r.propriedade as any, userId));
  }

  async createForUser(userId: string, dto: CreatePropertyDto) {
    const created = await this.create(dto);
    await this.prisma.usuarioPropriedade.create({
      data: {
        usuarioId: userId,
        propriedadeId: (created as any).id,
      },
    });
    return this.mapPropertyToDto(created as any, userId);
  }

  async updateForUser(userId: string, propertyId: string, dto: UpdatePropertyDto) {
    await this.assertUserHasProperty(userId, propertyId);
    const updated = await this.update(propertyId, dto);
    return this.mapPropertyToDto(updated as any, userId);
  }

  async removeForUser(userId: string, propertyId: string) {
    await this.assertUserHasProperty(userId, propertyId);

    const links = await this.prisma.usuarioPropriedade.findMany({
      where: { propriedadeId: propertyId },
      select: { id: true },
    });

    await this.prisma.usuarioPropriedade.deleteMany({ where: { propriedadeId: propertyId } });

    if (links.length > 1) {
      return { success: true };
    }

    return this.remove(propertyId);
  }

  create(dto: CreatePropertyDto) {
    const plan = dto.plan ?? (dto as any).plano;
    return this.prisma.propriedade.create({
      data: {
        nome: dto.name,
        cidade: dto.city,
        estado: dto.state,
        cep: dto.cep ?? null,
        logradouro: dto.street ?? null,
        numero: dto.number ?? null,
        complemento: dto.complement ?? null,
        bairro: dto.district ?? null,
        viaAcesso: dto.accessRoute ?? null,
        comunidade: dto.community ?? null,
        areaTotal: dto.totalArea,
        areaCultivada: dto.cultivatedArea,
        areaNatural: dto.naturalArea,
        quantidadeGado: dto.cattleCount,
        status: dto.status as any,
        plano: plan as any,
      } as any,
    });
  }

  findAll() {
    return this.prisma.propriedade.findMany();
  }

  async findOne(id: string) {
    const property = await this.prisma.propriedade.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException('Propriedade não encontrada');
    }
    return property;
  }

  update(id: string, dto: UpdatePropertyDto) {
    const plan = dto.plan ?? (dto as any).plano;
    return this.prisma.propriedade.update({
      where: { id },
      data: {
        nome: dto.name,
        cidade: dto.city,
        estado: dto.state,
        cep: dto.cep,
        logradouro: dto.street,
        numero: dto.number,
        complemento: dto.complement,
        bairro: dto.district,
        viaAcesso: dto.accessRoute,
        comunidade: dto.community,
        areaTotal: dto.totalArea,
        areaCultivada: dto.cultivatedArea,
        areaNatural: dto.naturalArea,
        quantidadeGado: dto.cattleCount,
        status: dto.status as any,
        plano: plan as any,
      } as any,
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.propriedade.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Propriedade não encontrada');
    }
  }
}
