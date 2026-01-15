import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { MovementsService } from './movements.service';

@ApiTags('movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lancamentos')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post()
  create(@Headers('x-property-id') propertyId: string, @Body() dto: CreateMovementDto) {
    return this.movementsService.create(propertyId, dto);
  }

  @Post('nascimento')
  createBirth(@Headers('x-property-id') propertyId: string, @Body() dto: CreateMovementDto) {
    return this.movementsService.create(propertyId, { ...dto, type: 'birth' });
  }

  @Post('mortalidade')
  createDeath(@Headers('x-property-id') propertyId: string, @Body() dto: CreateMovementDto) {
    return this.movementsService.create(propertyId, { ...dto, type: 'death' });
  }

  @Post('venda')
  createSale(@Headers('x-property-id') propertyId: string, @Body() dto: CreateMovementDto) {
    return this.movementsService.create(propertyId, { ...dto, type: 'sale' });
  }

  @Post('vacina')
  createVaccine(@Headers('x-property-id') propertyId: string, @Body() dto: CreateMovementDto) {
    return this.movementsService.create(propertyId, { ...dto, type: 'vaccine' });
  }

  @Get()
  findAll(@Headers('x-property-id') propertyId?: string) {
    return this.movementsService.findAll(propertyId ?? '');
  }

  @Get('historico')
  findHistory(@Headers('x-property-id') propertyId?: string, @Query('months') months?: string) {
    return this.movementsService.findHistory(propertyId ?? '', months ? Number(months) : 6);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movementsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMovementDto) {
    return this.movementsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movementsService.remove(id);
  }
}
