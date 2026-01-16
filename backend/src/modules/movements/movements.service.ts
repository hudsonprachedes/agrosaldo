import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

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
      orderBy: { data: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.movimento.findUnique({ where: { id } });
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

  findHistory(propertyId: string, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    return this.prisma.movimento.findMany({
      where: { propriedadeId: propertyId, data: { gte: startDate } },
      orderBy: { data: 'desc' },
    });
  }
}
