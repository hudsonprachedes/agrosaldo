import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

describe('MovementsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  const propertyId = 'prop-1';

  beforeEach(async () => {
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
            id: '1',
            role: 'proprietario',
            cpfCnpj: '12345678901',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

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

    jest
      .spyOn(prismaService.usuario, 'findUnique')
      .mockResolvedValue(mockUser as any);
    jest
      .spyOn(prismaService.usuario, 'findMany')
      .mockResolvedValue([mockUser] as any);
    jest
      .spyOn(prismaService.usuario, 'create')
      .mockResolvedValue(mockUser as any);
    (prismaService as any).usuarioPropriedade = {
      findFirst: jest.fn().mockImplementation(async (args: any) => {
        const userId = args?.where?.usuarioId;
        const propId = args?.where?.propriedadeId;
        if (userId === '1' && propId === propertyId) {
          return { id: 'up-1' };
        }
        return null;
      }),
    };
    jest
      .spyOn(prismaService.usuario, 'update')
      .mockResolvedValue(mockUser as any);
    jest
      .spyOn(prismaService.usuario, 'delete')
      .mockResolvedValue(mockUser as any);
    jest.spyOn(prismaService.usuario, 'count').mockResolvedValue(1);

    jest
      .spyOn(prismaService.movimento, 'findMany')
      .mockResolvedValue([] as any);
    (prismaService.movimento as any).findUnique = jest
      .fn()
      .mockImplementation(async (args: any) => {
        if (args?.where?.id === '1') {
          return {
            id: '1',
            tipo: 'nascimento',
            propriedadeId: propertyId,
            criadoEm: new Date(),
            atualizadoEm: new Date(),
          } as any;
        }
        return null;
      });
    jest.spyOn(prismaService.movimento, 'create').mockResolvedValue({
      id: '1',
      tipo: 'nascimento',
      propriedadeId: propertyId,
    } as any);
    jest.spyOn(prismaService.movimento, 'update').mockResolvedValue({
      id: '1',
      tipo: 'nascimento',
      propriedadeId: propertyId,
    } as any);
    jest.spyOn(prismaService.movimento, 'delete').mockResolvedValue({
      id: '1',
      tipo: 'nascimento',
      propriedadeId: propertyId,
    } as any);

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
        .set('x-property-id', propertyId)
        .send({
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
      return request(app.getHttpServer()).get('/lancamentos').expect(401);
    });

    it('should return movements with authentication', () => {
      return request(app.getHttpServer())
        .get('/lancamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-property-id', propertyId)
        .expect(200);
    });
  });

  describe('/lancamentos/:id (GET)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/lancamentos/1').expect(401);
    });

    it('should return a movement with authentication', () => {
      return request(app.getHttpServer())
        .get('/lancamentos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-property-id', propertyId)
        .expect(200);
    });
  });

  describe('/lancamentos/:id (DELETE)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).delete('/lancamentos/1').expect(401);
    });

    it('should delete a movement with authentication', () => {
      return request(app.getHttpServer())
        .delete('/lancamentos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-property-id', propertyId)
        .expect(200);
    });
  });
});
