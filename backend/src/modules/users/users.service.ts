import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapRole(role?: string) {
    switch (role) {
      case 'owner':
        return 'proprietario';
      case 'manager':
        return 'gerente';
      case 'operator':
        return 'operador';
      case 'super_admin':
        return 'super_admin';
      default:
        return 'operador';
    }
  }

  private mapStatus(status?: string) {
    switch (status) {
      case 'active':
        return 'ativo';
      case 'pending_approval':
        return 'pendente_aprovacao';
      case 'suspended':
        return 'suspenso';
      default:
        return status;
    }
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.usuario.create({
      data: {
        nome: dto.name,
        email: dto.email,
        cpfCnpj: dto.cpfCnpj,
        telefone: dto.phone,
        senha: passwordHash,
        papel: this.mapRole(dto.role) as any,
        status: (this.mapStatus(dto.status) ?? 'ativo') as any,
      },
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({
      include: { propriedades: { include: { propriedade: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
      include: { propriedades: { include: { propriedade: true } } },
    });
  }

  update(id: string, dto: UpdateUserDto) {
    return this.prisma.usuario.update({
      where: { id },
      data: dto as any,
    });
  }

  remove(id: string) {
    return this.prisma.usuario.delete({ where: { id } });
  }
}
