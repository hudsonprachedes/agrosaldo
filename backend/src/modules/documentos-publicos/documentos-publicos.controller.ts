import { Controller, Get, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DocumentosPublicosService } from './documentos-publicos.service';

@ApiTags('documentos-publicos')
@Controller('documentos-publicos')
export class DocumentosPublicosController {
  constructor(private readonly service: DocumentosPublicosService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('espelho-oficial/emitir')
  emitirEspelhoOficial(
    @Headers('x-property-id') propertyId: string,
    @Headers('x-public-base-url') publicBaseUrlHeader?: string,
    @Query('propertyCode') propertyCode?: string,
  ) {
    const publicBaseUrl = publicBaseUrlHeader || process.env.PUBLIC_BASE_URL || 'http://localhost:8080';

    return this.service.emitirDocumentoEspelhoOficial({
      propriedadeId: propertyId,
      propertyCode: propertyCode ?? null,
      publicBaseUrl,
    });
  }

  @Get('validar')
  validar(@Query('token') token?: string) {
    return this.service.validarTokenPublico(token ?? '');
  }
}
