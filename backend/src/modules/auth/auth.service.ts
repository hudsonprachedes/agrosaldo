import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await (this.prisma as any).usuario.findUnique({
      where: { cpfCnpj: dto.cpfCnpj },
      include: { propriedades: { include: { propriedade: true } } },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, role: user.papel, cpfCnpj: user.cpfCnpj };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        cpfCnpj: user.cpfCnpj,
        phone: user.telefone,
        role: user.papel,
        status: user.status,
        properties: user.propriedades ? user.propriedades.map(item => item.propriedade) : [],
      },
      token,
    };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await (this.prisma as any).usuario.create({
      data: {
        nome: dto.name,
        email: dto.email,
        cpfCnpj: dto.cpfCnpj,
        telefone: dto.phone,
        senha: passwordHash,
        status: 'pendente_aprovacao',
        papel: 'operador',
      },
    });

    return {
      id: user.id,
      name: user.nome,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
      phone: user.telefone,
      role: user.papel,
      status: user.status,
    };
  }

  async me(userId: string) {
    const user = await (this.prisma as any).usuario.findUnique({
      where: { id: userId },
      include: { propriedades: { include: { propriedade: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.nome,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
      phone: user.telefone,
      role: user.papel,
      status: user.status,
      properties: user.propriedades.map(item => item.propriedade),
    };
  }
}
