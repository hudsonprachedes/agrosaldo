import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

describe('Livestock (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  const propertyId = '123e4567-e89b-12d3-a456-426614174100';

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    cpfCnpj: '12345678901',
    senha: '$2b$10$q/.GykwS6X6A1ZFTSPAWneDIhOePOCCM6dOOdAoN/v.lJpflVUkjG',
    papel: 'operador',
    status: 'ativo',
  };

  const mockLivestock = [
    {
      id: '1',
      propriedadeId: propertyId,
      especie: 'bovino',
      faixaEtaria: 'calf',
      sexo: 'macho',
      cabecas: 50,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    },
    {
      id: '2',
      propriedadeId: propertyId,
      especie: 'bovino',
      faixaEtaria: 'heifer',
      sexo: 'femea',
      cabecas: 30,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    },
  ];

  const mockMovements = [
    {
      id: '1',
      propriedadeId: propertyId,
      tipo: 'nascimento',
      data: new Date('2026-01-01'),
      quantidade: 10,
      sexo: 'macho',
      faixaEtaria: 'calf',
      descricao: 'Nascimentos',
      criadoEm: new Date(),
    },
    {
      id: '2',
      propriedadeId: propertyId,
      tipo: 'morte',
      data: new Date('2026-01-05'),
      quantidade: 2,
      sexo: 'femea',
      faixaEtaria: 'heifer',
      descricao: 'Mortalidade',
      criadoEm: new Date(),
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const authHeader = req.headers?.authorization as string | undefined;
          if (!authHeader) {
            throw new UnauthorizedException();
          }
          req.user = {
            id: mockUser.id,
            role: mockUser.papel,
            cpfCnpj: mockUser.cpfCnpj,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    (prismaService as any).usuarioPropriedade = {
      findFirst: jest.fn().mockResolvedValue({ id: 'up-1' } as any),
    };

    if ((prismaService.usuario as any).findFirst) {
      jest
        .spyOn(prismaService.usuario as any, 'findFirst')
        .mockResolvedValue(mockUser as any);
    }

    jest
      .spyOn(prismaService.usuario, 'findUnique')
      .mockResolvedValue(mockUser as any);

    if ((prismaService as any).usuarioPropriedade?.findFirst) {
      jest
        .spyOn((prismaService as any).usuarioPropriedade, 'findFirst')
        .mockResolvedValue({ id: 'up-1' } as any);
    }
    jest
      .spyOn(prismaService.rebanho, 'findMany')
      .mockResolvedValue(mockLivestock as any);
    jest
      .spyOn(prismaService.movimento, 'findMany')
      .mockResolvedValue(mockMovements as any);
    jest.spyOn(prismaService.rebanho, 'groupBy').mockResolvedValue([
      { faixaEtaria: 'calf', _sum: { cabecas: 50 } },
      { faixaEtaria: 'heifer', _sum: { cabecas: 30 } },
    ] as any);

    if (!(prismaService.rebanho as any).updateMany) {
      (prismaService.rebanho as any).updateMany = jest
        .fn()
        .mockResolvedValue({ count: 0 });
    }

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
        expect(response.body[0]).toHaveProperty('data');
        expect(response.body[0]).toHaveProperty('tipo');
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
      jest
        .spyOn(prismaService.rebanho, 'updateMany')
        .mockResolvedValue({ count: 5 } as any);

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
      jest.spyOn(prismaService.rebanho, 'findMany').mockResolvedValueOnce([]);

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
