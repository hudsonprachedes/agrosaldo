import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('MovementsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard('JwtAuthGuard')
    .useValue({ canActivate: () => true })
    .overrideGuard('RolesGuard')
    .useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      cpfCnpj: '12345678901',
      nome: 'Test User',
      senha: '$2a$10$hashedpassword',
      papel: 'proprietario' as const,
      status: 'ativo' as const,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      telefone: null,
    };

    // @ts-ignore
    (prismaService as any).usuario = {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      findMany: jest.fn().mockResolvedValue([mockUser]),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      delete: jest.fn().mockResolvedValue(mockUser),
      count: jest.fn().mockResolvedValue(1),
    };

    // @ts-ignore
    (prismaService as any).movimento = {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1', tipo: 'nascimento' }),
      update: jest.fn().mockResolvedValue({ id: '1', tipo: 'nascimento' }),
      delete: jest.fn().mockResolvedValue({ id: '1', tipo: 'nascimento' }),
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        cpfCnpj: '12345678901',
        password: 'password123',
      });

    authToken = loginResponse.body.token;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/lancamentos (POST)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/lancamentos')
        .send({
          propertyId: 'property-1',
          type: 'nascimento',
          date: new Date().toISOString(),
          quantity: 5,
        })
        .expect(401);
    });

    it('should create a movement with authentication', () => {
      return request(app.getHttpServer())
        .post('/lancamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: 'property-1',
          type: 'nascimento',
          date: new Date().toISOString(),
          quantity: 5,
          sex: 'femea',
          ageGroup: 'calf',
          description: 'Nascimento de bezerras',
        })
        .expect(201);
    });
  });

  describe('/lancamentos (GET)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/lancamentos')
        .query({ propertyId: 'property-1' })
        .expect(401);
    });

    it('should return movements with authentication', () => {
      return request(app.getHttpServer())
        .get('/lancamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ propertyId: 'property-1' })
        .expect(200);
    });
  });

  describe('/lancamentos/:id (GET)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/lancamentos/1')
        .expect(401);
    });

    it('should return a movement with authentication', () => {
      return request(app.getHttpServer())
        .get('/lancamentos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('/lancamentos/:id (DELETE)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete('/lancamentos/1')
        .expect(401);
    });

    it('should delete a movement with authentication', () => {
      return request(app.getHttpServer())
        .delete('/lancamentos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
