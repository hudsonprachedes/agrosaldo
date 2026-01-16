import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { createMockPrismaService } from './test-helpers';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    // Mock PrismaService before creating the module
    const mockPrismaService = createMockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        cpfCnpj: '12345678901',
        name: 'Test User',
        password: '$2a$10$hashedpassword',
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpfCnpj: '12345678901',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should return 401 for invalid credentials', () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpfCnpj: '12345678901',
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
        name: 'New User',
        password: '$2a$10$hashedpassword',
        role: 'owner',
        status: 'pending_approval',
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);

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
          expect(res.body.status).toBe('pending_approval');
        });
    });

    it('should return 409 if user already exists', () => {
      const mockUser = {
        id: '1',
        email: 'existing@example.com',
        cpfCnpj: '12345678901',
        name: 'Existing User',
        password: '$2a$10$hashedpassword',
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

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
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        cpfCnpj: '12345678901',
        name: 'Test User',
        password: '$2a$10$hashedpassword',
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

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
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe('test@example.com');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});
