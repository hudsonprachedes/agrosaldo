import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  create(propertyId: string, dto: CreateMovementDto) {
    return this.prisma.movement.create({
      data: {
        propertyId,
        type: dto.type as any,
        date: new Date(dto.date),
        quantity: dto.quantity,
        sex: dto.sex as any,
        ageGroup: dto.ageGroup,
        description: dto.description,
        destination: dto.destination,
        value: dto.value,
        gtaNumber: dto.gtaNumber,
        photoUrl: dto.photoUrl,
        cause: dto.cause,
      },
    });
  }

  findAll(propertyId: string) {
    return this.prisma.movement.findMany({
      where: { propertyId },
      orderBy: { date: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.movement.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateMovementDto) {
    return this.prisma.movement.update({
      where: { id },
      data: {
        ...dto,
        type: dto.type as any,
        sex: dto.sex as any,
        date: dto.date ? new Date(dto.date) : undefined,
      } as any,
    });
  }

  remove(id: string) {
    return this.prisma.movement.delete({ where: { id } });
  }

  findHistory(propertyId: string, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    return this.prisma.movement.findMany({
      where: { propertyId, date: { gte: startDate } },
      orderBy: { date: 'desc' },
    });
  }
}
