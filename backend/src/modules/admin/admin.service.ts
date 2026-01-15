import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApproveUserDto } from './dto/approve-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listPendingUsers() {
    return this.prisma.user.findMany({
      where: { status: 'pending_approval' as const },
      include: { properties: { include: { property: true } } },
    });
  }

  approveUser(userId: string, dto: ApproveUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: dto.status as any,
      },
    });
  }

  listTenants() {
    return this.prisma.user.findMany({
      where: { role: { in: ['owner' as const, 'operator' as const] } },
      include: { properties: { include: { property: true } } },
    });
  }
}
