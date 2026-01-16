import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApproveUserDto } from './dto/approve-user.dto';
import { AdminService } from './admin.service';
import { CreateRegulationDto, UpdateRegulationDto } from './dto/regulation.dto';
import { CreatePaymentDto } from './dto/payment.dto';
import { UpdatePixConfigDto } from './dto/pix-config.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Dashboard ---

  @Roles('super_admin')
  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Roles('super_admin')
  @Get('dashboard/mrr-series')
  getMrrSeries(@Query('months') months?: string) {
    const parsed = months ? Number(months) : undefined;
    return this.adminService.getMrrSeries(parsed);
  }

  // --- User Management ---

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

  // --- Regulations ---

  @Roles('super_admin')
  @Get('regulamentacoes')
  listRegulations() {
    return this.adminService.listRegulations();
  }

  @Roles('super_admin')
  @Post('regulamentacoes')
  createRegulation(@Body() dto: CreateRegulationDto, @Req() req: any) {
    return this.adminService.createRegulation(dto, req.user?.name || 'Admin');
  }

  @Roles('super_admin')
  @Patch('regulamentacoes/:id')
  updateRegulation(@Param('id') id: string, @Body() dto: UpdateRegulationDto, @Req() req: any) {
    return this.adminService.updateRegulation(id, dto, req.user?.name || 'Admin');
  }

  @Roles('super_admin')
  @Delete('regulamentacoes/:id')
  deleteRegulation(@Param('id') id: string) {
    return this.adminService.deleteRegulation(id);
  }

  // --- Financial ---

  @Roles('super_admin')
  @Get('financeiro/pagamentos')
  listPayments() {
    return this.adminService.listPayments();
  }

  @Roles('super_admin')
  @Post('financeiro/pagamentos')
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.adminService.createPayment(dto);
  }

  @Roles('super_admin')
  @Get('financeiro/pix-config')
  getPixConfig() {
    return this.adminService.getPixConfig();
  }

  @Roles('super_admin')
  @Post('financeiro/pix-config')
  updatePixConfig(@Body() dto: UpdatePixConfigDto) {
    return this.adminService.updatePixConfig(dto);
  }

  @Roles('super_admin')
  @Get('financeiro')
  getFinancialReport() {
    return this.adminService.getFinancialReport();
  }

  @Roles('super_admin')
  @Get('planos')
  listPlans() {
    return this.adminService.listPlans();
  }

  @Roles('super_admin')
  @Post('planos')
  createPlan(@Body() dto: any) {
    return this.adminService.createPlan(dto);
  }

  @Roles('super_admin')
  @Patch('planos/:id')
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updatePlan(id, dto);
  }

  @Roles('super_admin')
  @Delete('planos/:id')
  deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  @Roles('super_admin')
  @Get('indicacao/cupons')
  listCoupons() {
    return this.adminService.listCoupons();
  }

  @Roles('super_admin')
  @Post('indicacao/cupons')
  createCoupon(@Body() dto: any, @Req() req: any) {
    return this.adminService.createCoupon({
      ...dto,
      createdBy: dto?.createdBy ?? req.user?.name ?? 'Admin',
    });
  }

  @Roles('super_admin')
  @Get('indicacao/indicadores')
  listReferrers() {
    return this.adminService.listReferrers();
  }

  @Roles('super_admin')
  @Get('comunicacao')
  listCommunications() {
    return this.adminService.listCommunications();
  }

  @Roles('super_admin')
  @Post('comunicacao')
  createCommunication(@Body() dto: any) {
    return this.adminService.createCommunication(dto);
  }

  @Roles('super_admin')
  @Patch('comunicacao/:id')
  updateCommunication(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateCommunication(id, dto);
  }

  @Roles('super_admin')
  @Delete('comunicacao/:id')
  deleteCommunication(@Param('id') id: string) {
    return this.adminService.deleteCommunication(id);
  }

  // --- Audit Logs ---

  @Roles('super_admin')
  @Get('auditoria')
  listAuditLogs() {
    return this.adminService.listAuditLogs();
  }

  @Roles('super_admin')
  @Get('solicitacoes')
  listRequests() {
    return this.adminService.listRequests();
  }

  @Roles('super_admin')
  @Patch('solicitacoes/:id/aprovar')
  approveRequest(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.approveRequest(id, dto);
  }

  @Roles('super_admin')
  @Patch('solicitacoes/:id/rejeitar')
  rejectRequest(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.rejectRequest(id, dto);
  }
}
