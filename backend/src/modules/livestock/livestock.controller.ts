import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PropertyAccessGuard } from '../../common/guards/property-access.guard';
import { CreateLivestockDto } from './dto/create-livestock.dto';
import { UpdateLivestockDto } from './dto/update-livestock.dto';
import { LivestockService } from './livestock.service';

@ApiTags('livestock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PropertyAccessGuard)
@Controller('rebanho')
export class LivestockController {
  constructor(private readonly livestockService: LivestockService) {}

  private assertPropertyHeader(
    propertyIdParam: string,
    propertyIdHeader?: string,
  ) {
    if (!propertyIdHeader) {
      throw new ForbiddenException('Property header required');
    }
    if (propertyIdHeader !== propertyIdParam) {
      throw new ForbiddenException('Property mismatch');
    }
  }

  @Get()
  findAll(@Headers('x-property-id') propertyId: string) {
    return this.livestockService.findAll(propertyId);
  }

  @Get(':propertyId')
  getBalance(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.livestockService.getBalance(propertyId);
  }

  @Get(':propertyId/historico')
  getHistory(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
    @Query('months') months?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.livestockService.getHistory(
      propertyId,
      months ? Number(months) : undefined,
    );
  }

  @Get(':propertyId/resumo')
  getSummary(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.livestockService.getSummary(propertyId);
  }

  @Get(':propertyId/espelho')
  getMirror(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
    @Query('months') months?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.livestockService.getMirror(
      propertyId,
      months ? Number(months) : undefined,
    );
  }

  @Get(':propertyId/outras-especies')
  getOtherSpeciesMirror(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
    @Query('months') months?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.livestockService.getOtherSpeciesMirror(
      propertyId,
      months ? Number(months) : undefined,
    );
  }

  @Post(':propertyId/recalcular-faixas')
  @HttpCode(200)
  recalculateAgeGroups(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.livestockService.recalculateAgeGroups(propertyId);
  }

  @Post()
  create(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: CreateLivestockDto,
  ) {
    return this.livestockService.create(propertyId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-property-id') propertyId: string,
    @Body() dto: UpdateLivestockDto,
  ) {
    return this.livestockService.update(propertyId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-property-id') propertyId: string) {
    return this.livestockService.remove(propertyId, id);
  }
}
