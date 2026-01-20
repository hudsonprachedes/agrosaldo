import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PropertyAccessGuard } from '../../common/guards/property-access.guard';
import { CreateMovementDto } from './dto/create-movement.dto';
import { OtherSpeciesAdjustmentDto } from './dto/other-species-adjustment.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { MovementsService } from './movements.service';
import { memoryStorage } from 'multer';
import type { Response } from 'express';

@ApiTags('movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PropertyAccessGuard)
@Controller('lancamentos')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post(':id/foto')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @Headers('x-property-id') propertyId: string,
    @UploadedFile() file?: { buffer?: Buffer; mimetype?: string },
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Arquivo não enviado');
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const mimeType = typeof file.mimetype === 'string' ? file.mimetype : '';
    if (!allowedMimeTypes.has(mimeType)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }
    return this.movementsService.attachPhoto(propertyId, id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
  }

  @Get(':id/foto')
  async getPhoto(
    @Param('id') id: string,
    @Headers('x-property-id') propertyId: string,
    @Res() res: Response,
  ) {
    const photo = await this.movementsService.getPhoto(propertyId, id);
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const mimeType =
      typeof photo.mimeType === 'string' && allowedMimeTypes.has(photo.mimeType)
        ? photo.mimeType
        : 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    return res.send(photo.data);
  }

  @Get('resumo')
  getSummary(@Headers('x-property-id') propertyId: string) {
    return this.movementsService.getSummary(propertyId);
  }

  @Get('extrato')
  getExtract(
    @Headers('x-property-id') propertyId: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.movementsService.getExtract(propertyId, {
      type,
      dateFrom,
      dateTo,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('fotos/limpeza')
  cleanupPhotos(
    @Headers('x-property-id') propertyId: string,
    @Query('days') days?: string,
  ) {
    return this.movementsService.cleanupOldPhotos(
      propertyId,
      days ? Number(days) : 180,
    );
  }

  @Post()
  create(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.create(propertyId, dto);
  }

  @Post('outras-especies')
  adjustOtherSpecies(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: OtherSpeciesAdjustmentDto,
  ) {
    return this.movementsService.adjustOtherSpeciesBalances(propertyId, dto);
  }

  @Post('nascimento')
  createBirth(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.create(propertyId, {
      ...dto,
      type: 'nascimento',
    });
  }

  @Post('mortalidade')
  createDeath(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.create(propertyId, { ...dto, type: 'morte' });
  }

  @Post('venda')
  createSale(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.create(propertyId, { ...dto, type: 'venda' });
  }

  @Post('vacina')
  createVaccine(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.create(propertyId, { ...dto, type: 'vacina' });
  }

  @Post('compra')
  createPurchase(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.create(propertyId, { ...dto, type: 'compra' });
  }

  @Get()
  findAll(@Headers('x-property-id') propertyId: string) {
    return this.movementsService.findAll(propertyId);
  }

  @Get('historico')
  findHistory(
    @Headers('x-property-id') propertyId: string,
    @Query('months') months?: string,
  ) {
    return this.movementsService.findHistory(
      propertyId,
      months ? Number(months) : 6,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-property-id') propertyId: string) {
    return this.movementsService.findOne(propertyId, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-property-id') propertyId: string,
    @Body() dto: UpdateMovementDto,
  ) {
    return this.movementsService.update(propertyId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-property-id') propertyId: string) {
    return this.movementsService.remove(propertyId, id);
  }
}
