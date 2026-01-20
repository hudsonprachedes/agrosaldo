import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Mock types for E2E tests

type MockFindFirstArgs = {
  where?: {
    OR?: Array<{ cpfCnpj?: string }>;
  };
};

type MockFindUniqueArgs = {
  where?: {
    cpfCnpj?: string;
    id?: string;
  };
};

type MockCreateArgs = {
  data: Record<string, unknown>;
};

type MockUpdateArgs = {
  data: Record<string, unknown>;
};

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let adminToken: string;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Test User',
    email: 'test@example.com',
    cpfCnpj: '12345678901',
    telefone: '11999999999',
    papel: 'operador',
    status: 'ativo',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    senha: '$2b$10$q/.GykwS6X6A1ZFTSPAWneDIhOePOCCM6dOOdAoN/v.lJpflVUkjG',
    propriedades: [],
  };

  const mockAdmin = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    nome: 'Admin User',
    email: 'admin@example.com',
    cpfCnpj: '98765432100',
    telefone: '11888888888',
    papel: 'super_admin',
    status: 'ativo',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    senha: '$2b$10$q/.GykwS6X6A1ZFTSPAWneDIhOePOCCM6dOOdAoN/v.lJpflVUkjG',
    propriedades: [],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prismaService = app.get(PrismaService);

    (
      prismaService as unknown as { usuario: Record<string, jest.Mock> }
    ).usuario = {
      findFirst: jest.fn().mockImplementation((args: MockFindFirstArgs) => {
        const cpfCnpj = args?.where?.OR?.[0]?.cpfCnpj;
        if (cpfCnpj === mockUser.cpfCnpj) {
          return Promise.resolve(mockUser);
        }
        if (cpfCnpj === mockAdmin.cpfCnpj) {
          return Promise.resolve(mockAdmin);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation((args: MockFindUniqueArgs) => {
        if (args.where?.cpfCnpj === mockUser.cpfCnpj) {
          return Promise.resolve(mockUser);
        }
        if (args.where?.cpfCnpj === mockAdmin.cpfCnpj) {
          return Promise.resolve(mockAdmin);
        }
        if (args.where?.id === mockUser.id) {
          return Promise.resolve(mockUser);
        }
        if (args.where?.id === mockAdmin.id) {
          return Promise.resolve(mockAdmin);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue([mockUser, mockAdmin]),
      create: jest.fn().mockImplementation((args: MockCreateArgs) => {
        return Promise.resolve({
          id: '123e4567-e89b-12d3-a456-426614174002',
          ...args.data,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        });
      }),
      update: jest.fn().mockImplementation((args: MockUpdateArgs) => {
        return Promise.resolve({
          ...mockUser,
          ...args.data,
          atualizadoEm: new Date(),
        });
      }),
      delete: jest.fn().mockResolvedValue(mockUser),
      count: jest.fn().mockResolvedValue(2),
    };

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        cpfCnpj: '12345678901',
        password: 'password123',
      });

    authToken = (loginResponse.body as { token: string }).token;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        cpfCnpj: '98765432100',
        password: 'password123',
      });

    adminToken = (adminLoginResponse.body as { token: string }).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /usuarios', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/usuarios').expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return list of users for super_admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
