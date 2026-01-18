import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { createMockPrismaService } from './test-helpers';
import { validateLoginResponse, validateUserResponse } from './contract-validation';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    // Mock PrismaService after getting it
    const mockPrismaService = createMockPrismaService();
    Object.assign(prismaService, mockPrismaService);
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpfCnpj: '12345678901',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          // Validar contrato da resposta com Zod
          const validated = validateLoginResponse(res.body);
          expect(validated.user.email).toBe('test@example.com');
          expect(validated.token).toBeDefined();
        });
    });

    it('should return 401 for invalid credentials', () => {
      jest.spyOn(prismaService.usuario, 'findFirst').mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpfCnpj: 'invalid',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      const mockUser = {
        id: '1',
        email: 'newuser@example.com',
        cpfCnpj: '98765432100',
        nome: 'New User',
        senha: '$2a$10$hashedpassword',
        papel: 'proprietario',
        status: 'pendente_aprovacao',
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        telefone: null,
      };

      jest.spyOn(prismaService.usuario, 'findFirst').mockResolvedValue(null);

      jest.spyOn(prismaService, '$transaction' as any).mockImplementation(async (fn: any) => {
        return fn({
          usuario: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          propriedade: {
            create: jest.fn().mockResolvedValue({ id: 'prop-1' }),
          },
          usuarioPropriedade: {
            create: jest.fn().mockResolvedValue({ usuarioId: mockUser.id, propriedadeId: 'prop-1' }),
          },
        });
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          cpfCnpj: '98765432100',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('newuser@example.com');
          expect(res.body.status).toBe('pendente_aprovacao');
        });
    });

    it('should return 409 if user already exists', () => {
      jest.spyOn(prismaService.usuario, 'findFirst').mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
        cpfCnpj: '12345678901',
        nome: 'Existing User',
        senha: '$2a$10$hashedpassword',
        papel: 'proprietario',
        status: 'ativo',
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        telefone: null,
      } as any);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          cpfCnpj: '12345678901',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return current user with valid token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpfCnpj: '12345678901',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});
