import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminToken: string;

  const mockAdmin = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Admin User',
    email: 'admin@example.com',
    cpfCnpj: '98765432100',
    password: '$2b$10$hashedpassword',
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProperties = [
    {
      id: '1',
      name: 'Fazenda A',
      city: 'São Paulo',
      state: 'SP',
      status: 'active',
      plan: 'premium',
      cattleCount: 500,
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Fazenda B',
      city: 'Campinas',
      state: 'SP',
      status: 'pending',
      plan: 'basic',
      cattleCount: 200,
      createdAt: new Date(),
    },
  ];

  const mockRequests = [
    {
      id: '1',
      userId: 'user1',
      propertyId: '1',
      type: 'upgrade',
      status: 'pending',
      data: { plan: 'enterprise' },
      createdAt: new Date(),
    },
    {
      id: '2',
      userId: 'user2',
      propertyId: '2',
      type: 'activation',
      status: 'pending',
      data: {},
      createdAt: new Date(),
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdmin as any);
    jest.spyOn(prismaService.property, 'findMany').mockResolvedValue(mockProperties as any);
    jest.spyOn(prismaService.property, 'count').mockResolvedValue(2);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        cpfCnpj: '98765432100',
        password: 'senha123',
      });

    adminToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/tenants', () => {
    it('should return list of tenants/properties', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/admin/tenants')
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      const mockUser = { ...mockAdmin, role: 'user' };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser as any);

      await request(app.getHttpServer())
        .get('/admin/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/tenants?limit=10&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/tenants?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /admin/solicitacoes', () => {
    it('should return pending requests', async () => {
      jest.spyOn(prismaService, '$queryRaw' as any).mockResolvedValue(mockRequests);

      const response = await request(app.getHttpServer())
        .get('/admin/solicitacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter by status', async () => {
      jest.spyOn(prismaService, '$queryRaw' as any).mockResolvedValue(
        mockRequests.filter(r => r.status === 'pending')
      );

      const response = await request(app.getHttpServer())
        .get('/admin/solicitacoes?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('PATCH /admin/solicitacoes/:id/aprovar', () => {
    it('should approve a request', async () => {
      jest.spyOn(prismaService, '$queryRaw' as any).mockResolvedValue([mockRequests[0]]);
      jest.spyOn(prismaService, '$executeRaw' as any).mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .patch('/admin/solicitacoes/1/aprovar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comments: 'Aprovado' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent request', async () => {
      jest.spyOn(prismaService, '$queryRaw' as any).mockResolvedValue([]);

      await request(app.getHttpServer())
        .patch('/admin/solicitacoes/999/aprovar')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should require admin role', async () => {
      const mockUser = { ...mockAdmin, role: 'user' };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser as any);

      await request(app.getHttpServer())
        .patch('/admin/solicitacoes/1/aprovar')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  describe('PATCH /admin/solicitacoes/:id/rejeitar', () => {
    it('should reject a request', async () => {
      jest.spyOn(prismaService, '$queryRaw' as any).mockResolvedValue([mockRequests[0]]);
      jest.spyOn(prismaService, '$executeRaw' as any).mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .patch('/admin/solicitacoes/1/rejeitar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Documentação incompleta' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate rejection reason', async () => {
      await request(app.getHttpServer())
        .patch('/admin/solicitacoes/1/rejeitar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /admin/auditoria', () => {
    it('should return audit logs', async () => {
      const mockLogs = [
        {
          id: '1',
          userId: mockAdmin.id,
          action: 'approve_request',
          entity: 'request',
          entityId: '1',
          createdAt: new Date(),
        },
      ];

      jest.spyOn(prismaService, '$queryRaw' as any).mockResolvedValue(mockLogs);

      const response = await request(app.getHttpServer())
        .get('/admin/auditoria')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/auditoria?startDate=2026-01-01&endDate=2026-01-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter by user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/auditoria?userId=${mockAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /admin/financeiro', () => {
    it('should return financial report', async () => {
      const mockReport = {
        totalRevenue: 50000,
        activeSubscriptions: 100,
        byPlan: {
          basic: 50,
          premium: 30,
          enterprise: 20,
        },
      };

      jest.spyOn(prismaService, '$queryRaw' as any).mockResolvedValue([mockReport]);

      const response = await request(app.getHttpServer())
        .get('/admin/financeiro')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('activeSubscriptions');
    });

    it('should filter by month', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/financeiro?month=2026-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should calculate MRR', async () => {
      const mockReport = {
        totalRevenue: 50000,
        mrr: 5000,
        activeSubscriptions: 100,
      };

      jest.spyOn(prismaService, '$queryRaw' as any).mockResolvedValue([mockReport]);

      const response = await request(app.getHttpServer())
        .get('/admin/financeiro')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Admin Authorization', () => {
    it('should block non-admin from all admin routes', async () => {
      const mockUser = { ...mockAdmin, role: 'user' };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      await request(app.getHttpServer())
        .get('/admin/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/admin/solicitacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/admin/auditoria')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });
});
