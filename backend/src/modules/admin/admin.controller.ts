import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApproveUserDto } from './dto/approve-user.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles('super_admin')
  @Get('pendencias')
  listPendingUsers() {
    return this.adminService.listPendingUsers();
  }

  @Roles('super_admin')
  @Get('tenants')
  listTenants() {
    return this.adminService.listTenants();
  }

  @Roles('super_admin')
  @Patch('usuarios/:id/aprovar')
  approveUser(@Param('id') id: string, @Body() dto: ApproveUserDto) {
    return this.adminService.approveUser(id, dto);
  }
}
