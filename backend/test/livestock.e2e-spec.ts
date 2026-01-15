import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Livestock (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  const propertyId = '123e4567-e89b-12d3-a456-426614174100';

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    cpfCnpj: '12345678901',
    password: '$2b$10$hashedpassword',
    role: 'user',
    status: 'active',
  };

  const mockLivestock = [
    {
      id: '1',
      propertyId,
      species: 'cattle',
      ageGroup: 'calf',
      sex: 'male',
      headcount: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      propertyId,
      species: 'cattle',
      ageGroup: 'heifer',
      sex: 'female',
      headcount: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockMovements = [
    {
      id: '1',
      propertyId,
      type: 'birth',
      date: new Date('2026-01-01'),
      quantity: 10,
      sex: 'male',
      ageGroup: 'calf',
      description: 'Nascimentos',
      createdAt: new Date(),
    },
    {
      id: '2',
      propertyId,
      type: 'death',
      date: new Date('2026-01-05'),
      quantity: 2,
      sex: 'female',
      ageGroup: 'heifer',
      description: 'Mortalidade',
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

    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
    jest.spyOn(prismaService.livestock, 'findMany').mockResolvedValue(mockLivestock as any);
    jest.spyOn(prismaService.movement, 'findMany').mockResolvedValue(mockMovements as any);
    jest.spyOn(prismaService.livestock, 'groupBy').mockResolvedValue([
      { ageGroup: 'calf', _sum: { headcount: 50 } },
      { ageGroup: 'heifer', _sum: { headcount: 30 } },
    ] as any);

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

  describe('GET /rebanho/:propertyId', () => {
    it('should return livestock balance for property', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body).toHaveProperty('propertyId', propertyId);
      expect(response.body).toHaveProperty('livestock');
      expect(response.body).toHaveProperty('total');
      expect(response.body.livestock).toBeInstanceOf(Array);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}`)
        .expect(401);
    });

    it('should return 403 without property header', async () => {
      await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should calculate total headcount', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should group by age group', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body).toHaveProperty('byAgeGroup');
      expect(typeof response.body.byAgeGroup).toBe('object');
    });

    it('should group by sex', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body).toHaveProperty('bySex');
      expect(typeof response.body.bySex).toBe('object');
    });
  });

  describe('GET /rebanho/:propertyId/historico', () => {
    it('should return livestock history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}/historico`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter by months parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}/historico?months=3`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should include movement data in history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}/historico`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('date');
        expect(response.body[0]).toHaveProperty('type');
      }
    });
  });

  describe('GET /rebanho/:propertyId/resumo', () => {
    it('should return livestock summary', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}/resumo`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byAgeGroup');
      expect(response.body).toHaveProperty('bySex');
    });

    it('should calculate statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}/resumo`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(typeof response.body.total).toBe('number');
    });
  });

  describe('POST /rebanho/:propertyId/recalcular-faixas', () => {
    it('should recalculate age groups', async () => {
      jest.spyOn(prismaService.livestock, 'updateMany').mockResolvedValue({ count: 5 } as any);

      const response = await request(app.getHttpServer())
        .post(`/rebanho/${propertyId}/recalcular-faixas`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body).toHaveProperty('updated');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/rebanho/${propertyId}/recalcular-faixas`)
        .expect(401);
    });
  });

  describe('Livestock Calculations', () => {
    it('should handle empty livestock', async () => {
      jest.spyOn(prismaService.livestock, 'findMany').mockResolvedValueOnce([]);

      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.livestock).toEqual([]);
    });

    it('should aggregate by multiple criteria', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rebanho/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Property-ID', propertyId)
        .expect(200);

      expect(response.body).toHaveProperty('byAgeGroup');
      expect(response.body).toHaveProperty('bySex');
    });
  });
});
