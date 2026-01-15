import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        cpfCnpj: dto.cpfCnpj,
        phone: dto.phone,
        password: passwordHash,
        role: (dto.role ?? 'operator') as any,
        status: (dto.status ?? 'active') as any,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: { properties: { include: { property: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { properties: { include: { property: true } } },
    });
  }

  update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto as any,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
