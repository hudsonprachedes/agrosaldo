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
    nome: 'Fazenda Teste',
    cidade: 'São Paulo',
    estado: 'SP',
    areaTotal: 1000,
    areaCultivada: 800,
    areaNatural: 200,
    quantidadeGado: 500,
    status: 'ativa',
    plano: 'porteira',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Test User',
    email: 'test@example.com',
    cpfCnpj: '12345678901',
    senha: '$2b$10$q/.GykwS6X6A1ZFTSPAWneDIhOePOCCM6dOOdAoN/v.lJpflVUkjG',
    papel: 'proprietario',
    status: 'ativo',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    telefone: null,
    propriedades: [
      {
        id: 'up-1',
        usuarioId: '123e4567-e89b-12d3-a456-426614174000',
        propriedadeId: '123e4567-e89b-12d3-a456-426614174100',
        criadoEm: new Date(),
        propriedade: mockProperty,
      },
    ],
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
    (prismaService as any).usuario = {
      findUnique: jest.fn().mockImplementation(async (args: any) => {
        if (args.where?.cpfCnpj === mockUser.cpfCnpj) {
          return mockUser;
        }
        if (args.where?.id === mockUser.id) {
          return mockUser;
        }
        return null;
      }),
    };

    // Mock Prisma Property methods
    (prismaService as any).propriedade = {
      findMany: jest.fn().mockResolvedValue([mockProperty]),
      findUnique: jest.fn().mockImplementation(async (args: any) => {
        if (args.where.id === mockProperty.id) {
          return mockProperty;
        }
        return null;
      }),
      create: jest.fn().mockImplementation(async (args: any) => {
        return {
          id: '123e4567-e89b-12d3-a456-426614174101',
          ...args.data,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
      }),
      update: jest.fn().mockImplementation(async (args: any) => {
        return {
          ...mockProperty,
          ...args.data,
          atualizadoEm: new Date(),
        };
      }),
      delete: jest.fn().mockResolvedValue(mockProperty),
    };

    (prismaService as any).usuarioPropriedade = {
      findMany: jest.fn().mockResolvedValue([
        {
          usuarioId: mockUser.id,
          propriedadeId: mockProperty.id,
          criadoEm: new Date(),
        },
      ]),
    };

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        cpfCnpj: '12345678901',
        password: 'password123',
      });

    authToken = loginResponse.body.token;
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
      expect(response.body[0]).toHaveProperty('nome');
      expect(response.body[0]).toHaveProperty('cidade');
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
      expect(response.body).toHaveProperty('nome', mockProperty.nome);
      expect(response.body).toHaveProperty('cidade', mockProperty.cidade);
      expect(response.body).toHaveProperty('estado', mockProperty.estado);
    });

    it('should return 404 for non-existent property', async () => {
      (prismaService as any).propriedade.findUnique = jest.fn().mockResolvedValueOnce(null);

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
        plano: 'porteira',
      };

      const response = await request(app.getHttpServer())
        .post('/propriedades')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProperty)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nome', newProperty.name);
      expect(response.body).toHaveProperty('cidade', newProperty.city);
      expect(response.body).toHaveProperty('estado', newProperty.state);
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
        plano: 'porteira',
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
        plano: 'porteira',
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

      expect(response.body).toHaveProperty('nome', updateData.name);
      expect(response.body).toHaveProperty('quantidadeGado', updateData.cattleCount);
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
        plan: 'barao',
      };

      const response = await request(app.getHttpServer())
        .patch(`/propriedades/${mockProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('plano', updateData.plan);
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
      (prismaService as any).propriedade.delete = jest.fn().mockRejectedValueOnce(new Error('Property not found'));

      await request(app.getHttpServer())
        .delete('/propriedades/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Property Status', () => {
    it('should allow changing property status', async () => {
      const updateData = {
        status: 'suspensa',
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
