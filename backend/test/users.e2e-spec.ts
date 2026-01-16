import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: string;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    cpfCnpj: '12345678901',
    phone: '11999999999',
    role: 'user',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Admin User',
    email: 'admin@example.com',
    cpfCnpj: '98765432100',
    phone: '11888888888',
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Mock Prisma methods
    jest.spyOn(prismaService.user, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.email === 'admin@example.com') {
        return { ...mockAdmin, password: '$2b$10$hashedpassword' } as any;
      }
      if (args.where.id === mockUser.id) {
        return mockUser as any;
      }
      return null;
    });

    jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([mockUser, mockAdmin] as any);

    jest.spyOn(prismaService.user, 'create').mockImplementation(async (args: any) => {
      return {
        id: '123e4567-e89b-12d3-a456-426614174002',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    });

    jest.spyOn(prismaService.user, 'update').mockImplementation(async (args: any) => {
      return {
        ...mockUser,
        ...args.data,
        updatedAt: new Date(),
      } as any;
    });

    jest.spyOn(prismaService.user, 'delete').mockResolvedValue(mockUser as any);

    jest.spyOn(prismaService.user, 'count').mockResolvedValue(2);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        cpfCnpj: '98765432100',
        password: 'senha123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /usuarios', () => {
    it('should return list of users', async () => {
      const response = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/usuarios')
        .expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/usuarios?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /usuarios/:id', () => {
    it('should return a specific user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/usuarios/${mockUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', mockUser.id);
      expect(response.body).toHaveProperty('name', mockUser.name);
      expect(response.body).toHaveProperty('email', mockUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .get('/usuarios/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /usuarios', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        cpfCnpj: '11122233344',
        password: 'senha123',
        phone: '11977777777',
      };

      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newUser.name);
      expect(response.body).toHaveProperty('email', newUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        name: 'Invalid User',
      };

      await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUser)
        .expect(400);
    });

    it('should validate email format', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'invalid-email',
        cpfCnpj: '11122233344',
        password: 'senha123',
      };

      await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUser)
        .expect(400);
    });
  });

  describe('PATCH /usuarios/:id', () => {
    it('should update a user', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '11966666666',
      };

      const response = await request(app.getHttpServer())
        .patch(`/usuarios/${mockUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('phone', updateData.phone);
    });

    it('should validate email format on update', async () => {
      const invalidUpdate = {
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .patch(`/usuarios/${mockUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });

  describe('DELETE /usuarios/:id', () => {
    it('should delete a user', async () => {
      await request(app.getHttpServer())
        .delete(`/usuarios/${mockUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 when deleting non-existent user', async () => {
      jest.spyOn(prismaService.user, 'delete').mockRejectedValueOnce(new Error('User not found'));

      await request(app.getHttpServer())
        .delete('/usuarios/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /usuarios/:id/reset-password', () => {
    it('should reset user password', async () => {
      jest.spyOn(prismaService.user, 'update').mockResolvedValueOnce(mockUser as any);

      await request(app.getHttpServer())
        .post(`/usuarios/${mockUser.id}/reset-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newPassword: 'newpassword123' })
        .expect(200);
    });

    it('should validate password strength', async () => {
      await request(app.getHttpServer())
        .post(`/usuarios/${mockUser.id}/reset-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newPassword: '123' })
        .expect(400);
    });
  });
});
