import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Properties (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;

  const mockProperty = {
    id: '123e4567-e89b-12d3-a456-426614174100',
    name: 'Fazenda Teste',
    city: 'São Paulo',
    state: 'SP',
    totalArea: 1000,
    cultivatedArea: 800,
    naturalArea: 200,
    cattleCount: 500,
    status: 'active',
    plan: 'premium',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    cpfCnpj: '12345678901',
    password: '$2b$10$hashedpassword',
    role: 'user',
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

    // Mock Prisma User methods
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

    // Mock Prisma Property methods
    jest.spyOn(prismaService.property, 'findMany').mockResolvedValue([mockProperty] as any);
    
    jest.spyOn(prismaService.property, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === mockProperty.id) {
        return mockProperty as any;
      }
      return null;
    });

    jest.spyOn(prismaService.property, 'create').mockImplementation(async (args: any) => {
      return {
        id: '123e4567-e89b-12d3-a456-426614174101',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    });

    jest.spyOn(prismaService.property, 'update').mockImplementation(async (args: any) => {
      return {
        ...mockProperty,
        ...args.data,
        updatedAt: new Date(),
      } as any;
    });

    jest.spyOn(prismaService.property, 'delete').mockResolvedValue(mockProperty as any);

    jest.spyOn(prismaService.userProperty, 'findMany').mockResolvedValue([
      {
        userId: mockUser.id,
        propertyId: mockProperty.id,
        role: 'owner',
        createdAt: new Date(),
      },
    ] as any);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        cpfCnpj: '12345678901',
        password: 'senha123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /propriedades', () => {
    it('should return list of properties for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/propriedades')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('city');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/propriedades')
        .expect(401);
    });
  });

  describe('GET /propriedades/:id', () => {
    it('should return a specific property', async () => {
      const response = await request(app.getHttpServer())
        .get(`/propriedades/${mockProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', mockProperty.id);
      expect(response.body).toHaveProperty('name', mockProperty.name);
      expect(response.body).toHaveProperty('city', mockProperty.city);
      expect(response.body).toHaveProperty('state', mockProperty.state);
    });

    it('should return 404 for non-existent property', async () => {
      jest.spyOn(prismaService.property, 'findUnique').mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .get('/propriedades/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /propriedades', () => {
    it('should create a new property', async () => {
      const newProperty = {
        name: 'Nova Fazenda',
        city: 'Campinas',
        state: 'SP',
        totalArea: 500,
        cultivatedArea: 400,
        naturalArea: 100,
        plan: 'basic',
      };

      const response = await request(app.getHttpServer())
        .post('/propriedades')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProperty)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newProperty.name);
      expect(response.body).toHaveProperty('city', newProperty.city);
      expect(response.body).toHaveProperty('state', newProperty.state);
    });

    it('should validate required fields', async () => {
      const invalidProperty = {
        name: 'Fazenda Incompleta',
      };

      await request(app.getHttpServer())
        .post('/propriedades')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProperty)
        .expect(400);
    });

    it('should validate area values', async () => {
      const invalidProperty = {
        name: 'Fazenda Teste',
        city: 'São Paulo',
        state: 'SP',
        totalArea: -100,
        cultivatedArea: 50,
        naturalArea: 50,
        plan: 'basic',
      };

      await request(app.getHttpServer())
        .post('/propriedades')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProperty)
        .expect(400);
    });

    it('should validate state code', async () => {
      const invalidProperty = {
        name: 'Fazenda Teste',
        city: 'São Paulo',
        state: 'INVALID',
        totalArea: 100,
        cultivatedArea: 50,
        naturalArea: 50,
        plan: 'basic',
      };

      await request(app.getHttpServer())
        .post('/propriedades')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProperty)
        .expect(400);
    });
  });

  describe('PATCH /propriedades/:id', () => {
    it('should update a property', async () => {
      const updateData = {
        name: 'Fazenda Atualizada',
        cattleCount: 600,
      };

      const response = await request(app.getHttpServer())
        .patch(`/propriedades/${mockProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('cattleCount', updateData.cattleCount);
    });

    it('should validate area values on update', async () => {
      const invalidUpdate = {
        totalArea: -500,
      };

      await request(app.getHttpServer())
        .patch(`/propriedades/${mockProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should update plan type', async () => {
      const updateData = {
        plan: 'enterprise',
      };

      const response = await request(app.getHttpServer())
        .patch(`/propriedades/${mockProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('plan', updateData.plan);
    });
  });

  describe('DELETE /propriedades/:id', () => {
    it('should delete a property', async () => {
      await request(app.getHttpServer())
        .delete(`/propriedades/${mockProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 when deleting non-existent property', async () => {
      jest.spyOn(prismaService.property, 'delete').mockRejectedValueOnce(new Error('Property not found'));

      await request(app.getHttpServer())
        .delete('/propriedades/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Property Status', () => {
    it('should allow changing property status', async () => {
      const updateData = {
        status: 'inactive',
      };

      const response = await request(app.getHttpServer())
        .patch(`/propriedades/${mockProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('status', updateData.status);
    });
  });
});
