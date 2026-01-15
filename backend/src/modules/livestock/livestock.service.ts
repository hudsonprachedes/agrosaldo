import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLivestockDto } from './dto/create-livestock.dto';
import { UpdateLivestockDto } from './dto/update-livestock.dto';

@Injectable()
export class LivestockService {
  constructor(private readonly prisma: PrismaService) {}

  create(propertyId: string, dto: CreateLivestockDto) {
    return this.prisma.livestock.create({
      data: {
        propertyId,
        species: dto.species,
        ageGroup: dto.ageGroup,
        sex: dto.sex as any,
        headcount: dto.headcount,
      },
    });
  }

  findAll(propertyId: string) {
    return this.prisma.livestock.findMany({
      where: { propertyId },
    });
  }

  update(id: string, dto: UpdateLivestockDto) {
    return this.prisma.livestock.update({
      where: { id },
      data: dto as any,
    });
  }

  remove(id: string) {
    return this.prisma.livestock.delete({ where: { id } });
  }
}
