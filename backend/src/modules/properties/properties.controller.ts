import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('propriedades')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Roles('super_admin', 'owner')
  @Post()
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Roles('super_admin', 'owner')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, dto);
  }

  @Roles('super_admin', 'owner')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
