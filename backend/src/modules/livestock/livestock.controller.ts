import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateLivestockDto } from './dto/create-livestock.dto';
import { UpdateLivestockDto } from './dto/update-livestock.dto';
import { LivestockService } from './livestock.service';

@ApiTags('livestock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rebanho')
export class LivestockController {
  constructor(private readonly livestockService: LivestockService) {}

  @Get()
  findAll(@Headers('x-property-id') propertyId?: string) {
    return this.livestockService.findAll(propertyId ?? '');
  }

  @Post()
  create(@Headers('x-property-id') propertyId: string, @Body() dto: CreateLivestockDto) {
    return this.livestockService.create(propertyId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLivestockDto) {
    return this.livestockService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.livestockService.remove(id);
  }
}
