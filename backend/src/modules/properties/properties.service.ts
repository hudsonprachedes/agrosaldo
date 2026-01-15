import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePropertyDto) {
    return this.prisma.property.create({ data: dto as any });
  }

  findAll() {
    return this.prisma.property.findMany();
  }

  findOne(id: string) {
    return this.prisma.property.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdatePropertyDto) {
    return this.prisma.property.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.property.delete({ where: { id } });
  }
}
