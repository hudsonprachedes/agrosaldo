import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminToken: string;
  let jwtService: JwtService;

  const mockAdmin = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    nome: 'Admin User',
    email: 'admin@example.com',
    cpfCnpj: '98765432100',
    senha: '$2b$10$q/.GykwS6X6A1ZFTSPAWneDIhOePOCCM6dOOdAoN/v.lJpflVUkjG',
    papel: 'super_admin',
    status: 'ativo',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  const mockProperties = [
    {
      id: '1',
      nome: 'Fazenda A',
      cidade: 'São Paulo',
      estado: 'SP',
      status: 'ativa',
      plano: 'porteira',
      quantidadeGado: 500,
      criadoEm: new Date(),
    },
    {
      id: '2',
      nome: 'Fazenda B',
      cidade: 'Campinas',
      estado: 'SP',
      status: 'pendente',
      plano: 'porteira',
      quantidadeGado: 200,
      criadoEm: new Date(),
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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    jwtService = app.get(JwtService);

    // Mock Prisma methods
    (prismaService as any).usuario = {
      findFirst: jest.fn().mockImplementation(async (args: any) => {
        const cpfCnpj = args?.where?.OR?.[0]?.cpfCnpj;
        if (cpfCnpj === mockAdmin.cpfCnpj) {
          return mockAdmin;
        }
        return null;
      }),
      findUnique: jest.fn().mockResolvedValue(mockAdmin),
      findMany: jest.fn().mockResolvedValue([mockAdmin]),
      count: jest.fn().mockResolvedValue(1),
    };
    (prismaService as any).propriedade = {
      findMany: jest.fn().mockResolvedValue(mockProperties),
      count: jest.fn().mockResolvedValue(2),
    };

    (prismaService as any).pagamentoFinanceiro = {
      findMany: jest.fn().mockResolvedValue([]),
    };

    (prismaService as any).logAuditoria = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    (prismaService as any).logAtividade = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    };

    (prismaService as any).solicitacaoPendente = {
      findMany: jest.fn().mockResolvedValue(mockRequests),
      findUnique: jest.fn().mockImplementation(async (args: any) => {
        const id = args?.where?.id;
        return mockRequests.find((r) => r.id === id) ?? null;
      }),
      update: jest.fn().mockImplementation(async (args: any) => {
        const id = args?.where?.id;
        const current = mockRequests.find((r) => r.id === id);
        if (!current) {
          throw new Error('Solicitação não encontrada');
        }
        return { ...current, ...(args?.data ?? {}) };
      }),
    };

    adminToken = await jwtService.signAsync({
      sub: mockAdmin.id,
      role: 'super_admin',
      cpfCnpj: mockAdmin.cpfCnpj,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/tenants', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/admin/tenants').expect(401);
    });

    it('should return list of tenants with authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /admin/solicitacoes', () => {
    it('should return pending requests', async () => {
      (prismaService as any).$queryRaw = jest
        .fn()
        .mockResolvedValue(mockRequests);

      const response = await request(app.getHttpServer())
        .get('/admin/solicitacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter by status', async () => {
      jest
        .spyOn(prismaService, '$queryRaw' as any)
        .mockResolvedValue(mockRequests.filter((r) => r.status === 'pending'));

      const response = await request(app.getHttpServer())
        .get('/admin/solicitacoes?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('PATCH /admin/solicitacoes/:id/aprovar', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/admin/solicitacoes/1/aprovar')
        .send({ comments: 'Aprovado' })
        .expect(401);
    });

    it('should approve a request with authentication', async () => {
      const response = await request(app.getHttpServer())
        .patch('/admin/solicitacoes/1/aprovar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comments: 'Aprovado' })
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('PATCH /admin/solicitacoes/:id/rejeitar', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/admin/solicitacoes/1/rejeitar')
        .send({ reason: 'Documentação incompleta' })
        .expect(401);
    });

    it('should reject a request with authentication', async () => {
      const response = await request(app.getHttpServer())
        .patch('/admin/solicitacoes/1/rejeitar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Documentação incompleta' })
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /admin/auditoria', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/admin/auditoria').expect(401);
    });

    it('should return audit logs with authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/auditoria')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.items).toBeInstanceOf(Array);
    });
  });

  describe('GET /admin/atividade', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/admin/atividade').expect(401);
    });

    it('should return activity logs with authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/atividade')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.items).toBeInstanceOf(Array);
    });
  });

  describe('POST /admin/atividade/arquivar', () => {
    it('should archive activity logs in bulk', async () => {
      (prismaService as any).logAtividade.updateMany = jest
        .fn()
        .mockResolvedValue({ count: 2 });

      const response = await request(app.getHttpServer())
        .post('/admin/atividade/arquivar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: ['a', 'b'] })
        .expect(201);

      expect(response.body).toHaveProperty('updated', 2);
    });
  });

  describe('POST /admin/atividade/desarquivar', () => {
    it('should unarchive activity logs in bulk', async () => {
      (prismaService as any).logAtividade.updateMany = jest
        .fn()
        .mockResolvedValue({ count: 1 });

      const response = await request(app.getHttpServer())
        .post('/admin/atividade/desarquivar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: ['a'] })
        .expect(201);

      expect(response.body).toHaveProperty('updated', 1);
    });
  });

  describe('POST /admin/atividade/deletar', () => {
    it('should delete activity logs in bulk', async () => {
      (prismaService as any).logAtividade.deleteMany = jest
        .fn()
        .mockResolvedValue({ count: 3 });

      const response = await request(app.getHttpServer())
        .post('/admin/atividade/deletar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: ['a', 'b', 'c'] })
        .expect(201);

      expect(response.body).toHaveProperty('deleted', 3);
    });
  });

  describe('GET /admin/financeiro', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/admin/financeiro').expect(401);
    });

    it('should return financial report with authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/financeiro')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Admin Authorization', () => {
    it('should block non-admin from all admin routes', async () => {
      const operatorToken = await jwtService.signAsync({
        sub: 'operator-1',
        role: 'operador',
        cpfCnpj: '12345678901',
      });

      await request(app.getHttpServer())
        .get('/admin/tenants')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/admin/solicitacoes')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/admin/auditoria')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);
    });
  });
});
