import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import crypto from 'crypto';

type TipoDocumentoPublico = 'espelho_oficial_rebanho';

@Injectable()
export class DocumentosPublicosService {
  constructor(private readonly prisma: PrismaService) {}

  private sha256(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private generateToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateDocumentNumber(propertyCode?: string | null) {
    const prefix = (propertyCode || 'DOC').toUpperCase().slice(0, 3);
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const seq = crypto.randomInt(1000, 9999);
    return `${prefix}-${year}${month}-${seq}`;
  }

  async emitirDocumentoEspelhoOficial(params: {
    propriedadeId: string;
    propertyCode?: string | null;
    expiresInHours?: number;
    publicBaseUrl: string;
  }) {
    const expiresInHours =
      typeof params.expiresInHours === 'number' && params.expiresInHours > 0
        ? params.expiresInHours
        : 24 * 30; // 30 dias

    const token = this.generateToken();
    const tokenHash = this.sha256(token);

    const documentNumber = this.generateDocumentNumber(params.propertyCode);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    await (this.prisma as any).validacaoDocumentoPublico.create({
      data: {
        tokenHash,
        propriedadeId: params.propriedadeId,
        tipoDocumento: 'espelho_oficial_rebanho' satisfies TipoDocumentoPublico,
        numeroDocumento: documentNumber,
        expiraEm: expiresAt,
      } as any,
    });

    const validationUrl = `${params.publicBaseUrl.replace(/\/$/, '')}/public/validar?token=${encodeURIComponent(token)}`;

    return {
      documentNumber,
      validationUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async validarTokenPublico(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Token inválido');
    }

    const tokenHash = this.sha256(token);

    const now = new Date();
    const record = await (
      this.prisma as any
    ).validacaoDocumentoPublico.findUnique({
      where: { tokenHash },
      select: {
        numeroDocumento: true,
        expiraEm: true,
        revogadoEm: true,
      } as any,
    });

    if (!record) {
      return { valid: false, documentNumber: null };
    }

    const expired = record.expiraEm ? new Date(record.expiraEm) < now : true;
    const revoked = Boolean(record.revogadoEm);

    if (expired || revoked) {
      return {
        valid: false,
        documentNumber: record.numeroDocumento ?? null,
      };
    }

    return {
      valid: true,
      documentNumber: record.numeroDocumento ?? null,
    };
  }
}
