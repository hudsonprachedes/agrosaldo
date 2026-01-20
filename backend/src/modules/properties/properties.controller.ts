import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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

  @Get('minhas')
  findMine(@CurrentUser() user: { id: string }) {
    return this.propertiesService.findMine(user.id);
  }

  @Post('minhas')
  createMine(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.createForUser(user.id, dto);
  }

  @Patch('minhas/:id')
  updateMine(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateForUser(user.id, id, dto);
  }

  @Delete('minhas/:id')
  removeMine(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.propertiesService.removeForUser(user.id, id);
  }

  @Roles('super_admin', 'proprietario')
  @Post()
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  @Roles('super_admin')
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  @Roles('super_admin')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Roles('super_admin', 'proprietario')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, dto);
  }

  @Roles('super_admin', 'proprietario')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
