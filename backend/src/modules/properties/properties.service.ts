import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePropertyDto) {
    const plan = dto.plan ?? (dto as any).plano;
    return this.prisma.propriedade.create({
      data: {
        nome: dto.name,
        cidade: dto.city,
        estado: dto.state,
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
