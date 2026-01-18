import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionarioEpidemiologicoDto } from './dto/create-questionario-epidemiologico.dto';

@Injectable()
export class QuestionarioEpidemiologicoService {
  constructor(private readonly prisma: PrismaService) {}

  private addMonths(date: Date, months: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private mapToDto(row: any) {
    return {
      id: row.id,
      propertyId: row.propriedadeId,
      version: row.versao,
      answers: row.respostas,
      submittedAt: (row.enviadoEm as Date).toISOString(),
      nextDueAt: (row.proximoEm as Date).toISOString(),
    };
  }

  async create(propertyId: string, dto: CreateQuestionarioEpidemiologicoDto) {
    if (!propertyId) {
      throw new BadRequestException('x-property-id é obrigatório');
    }

    const submittedAt = new Date();
    const nextDueAt = this.addMonths(submittedAt, 6);

    const created = await (
      this.prisma as any
    ).questionarioEpidemiologico.create({
      data: {
        propriedadeId: propertyId,
        versao: 1,
        respostas: dto.answers,
        enviadoEm: submittedAt,
        proximoEm: nextDueAt,
      },
    });

    return this.mapToDto(created);
  }

  async findAll(propertyId: string) {
    if (!propertyId) {
      throw new BadRequestException('x-property-id é obrigatório');
    }

    const rows = await (this.prisma as any).questionarioEpidemiologico.findMany(
      {
        where: { propriedadeId: propertyId },
        orderBy: { enviadoEm: 'desc' },
      },
    );

    return rows.map((r: any) => this.mapToDto(r));
  }

  async findLatest(propertyId: string) {
    if (!propertyId) {
      throw new BadRequestException('x-property-id é obrigatório');
    }

    const row = await (this.prisma as any).questionarioEpidemiologico.findFirst(
      {
        where: { propriedadeId: propertyId },
        orderBy: { enviadoEm: 'desc' },
      },
    );

    return row ? this.mapToDto(row) : null;
  }

  async findOne(propertyId: string, id: string) {
    if (!propertyId) {
      throw new BadRequestException('x-property-id é obrigatório');
    }

    const row = await (
      this.prisma as any
    ).questionarioEpidemiologico.findUnique({
      where: { id },
    });

    if (!row) {
      throw new NotFoundException('Questionário não encontrado');
    }

    if (row.propriedadeId !== propertyId) {
      throw new ForbiddenException('Property mismatch');
    }

    return this.mapToDto(row);
  }
}
