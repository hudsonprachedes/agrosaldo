import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('MovementsController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      cpfCnpj: '12345678901',
      name: 'Test User',
      password: '$2a$10$hashedpassword',
      role: 'owner' as const,
      status: 'active' as const,
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

    authToken = loginResponse.body.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/movements (POST)', () => {
    it('should create a birth movement', () => {
      const mockMovement = {
        id: '1',
        propertyId: 'property-1',
        type: MovementType.birth,
        date: new Date(),
        quantity: 5,
        sex: SexType.female,
        ageGroup: 'calf',
        description: 'Nascimento de bezerras',
        destination: null,
        value: null,
        gtaNumber: null,
        photoUrl: null,
        cause: null,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.movement, 'create').mockResolvedValue(mockMovement);

      return request(app.getHttpServer())
        .post('/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: 'property-1',
          type: 'birth',
          date: new Date().toISOString(),
          quantity: 5,
          sex: 'female',
          ageGroup: 'calf',
          description: 'Nascimento de bezerras',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe('birth');
          expect(res.body.quantity).toBe(5);
        });
    });

    it('should create a death movement with photo', () => {
      const mockMovement = {
        id: '2',
        propertyId: 'property-1',
        type: MovementType.death,
        date: new Date(),
        quantity: 1,
        sex: SexType.male,
        ageGroup: 'adult',
        description: 'Morte natural',
        destination: null,
        value: null,
        gtaNumber: null,
        photoUrl: 'https://example.com/photo.jpg',
        cause: 'natural',
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.movement, 'create').mockResolvedValue(mockMovement);

      return request(app.getHttpServer())
        .post('/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: 'property-1',
          type: 'death',
          date: new Date().toISOString(),
          quantity: 1,
          sex: 'male',
          ageGroup: 'adult',
          description: 'Morte natural',
          photoUrl: 'https://example.com/photo.jpg',
          cause: 'natural',
        })
        .expect(201);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/movements')
        .send({
          propertyId: 'property-1',
          type: 'birth',
          date: new Date().toISOString(),
          quantity: 5,
        })
        .expect(401);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('/movements (GET)', () => {
    it('should return all movements for a property', () => {
      const mockMovements = [
        {
          id: '1',
          propertyId: 'property-1',
          type: MovementType.birth,
          date: new Date(),
          quantity: 5,
          sex: SexType.female,
          ageGroup: 'calf',
          description: 'Nascimento',
          destination: null,
          value: null,
          gtaNumber: null,
          photoUrl: null,
          cause: null,
          createdAt: new Date(),
        },
        {
          id: '2',
          propertyId: 'property-1',
          type: MovementType.sale,
          date: new Date(),
          quantity: 10,
          sex: SexType.male,
          ageGroup: 'adult',
          description: 'Venda',
          destination: 'Frigorífico ABC',
          value: 50000,
          gtaNumber: 'GTA123456',
          photoUrl: null,
          cause: null,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(prismaService.movement, 'findMany').mockResolvedValue(mockMovements);

      return request(app.getHttpServer())
        .get('/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ propertyId: 'property-1' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].type).toBe('birth');
          expect(res.body[1].type).toBe('sale');
        });
    });

    it('should filter movements by type', () => {
      const mockMovements = [
        {
          id: '1',
          propertyId: 'property-1',
          type: MovementType.birth,
          date: new Date(),
          quantity: 5,
          sex: SexType.female,
          ageGroup: 'calf',
          description: 'Nascimento',
          destination: null,
          value: null,
          gtaNumber: null,
          photoUrl: null,
          cause: null,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(prismaService.movement, 'findMany').mockResolvedValue(mockMovements);

      return request(app.getHttpServer())
        .get('/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ propertyId: 'property-1', type: 'birth' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].type).toBe('birth');
        });
    });
  });

  describe('/movements/:id (GET)', () => {
    it('should return a specific movement', () => {
      const mockMovement = {
        id: '1',
        propertyId: 'property-1',
        type: MovementType.birth,
        date: new Date(),
        quantity: 5,
        sex: SexType.female,
        ageGroup: 'calf',
        description: 'Nascimento',
        destination: null,
        value: null,
        gtaNumber: null,
        photoUrl: null,
        cause: null,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.movement, 'findUnique').mockResolvedValue(mockMovement);

      return request(app.getHttpServer())
        .get('/movements/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('1');
          expect(res.body.type).toBe('birth');
        });
    });

    it('should return 404 for non-existent movement', () => {
      jest.spyOn(prismaService.movement, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/movements/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/movements/:id (DELETE)', () => {
    it('should delete a movement', () => {
      const mockMovement = {
        id: '1',
        propertyId: 'property-1',
        type: MovementType.birth,
        date: new Date(),
        quantity: 5,
        sex: SexType.female,
        ageGroup: 'calf',
        description: 'Nascimento',
        destination: null,
        value: null,
        gtaNumber: null,
        photoUrl: null,
        cause: null,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.movement, 'delete').mockResolvedValue(mockMovement);

      return request(app.getHttpServer())
        .delete('/movements/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
