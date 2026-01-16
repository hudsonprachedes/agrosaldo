// Mock PrismaService for e2e tests
jest.mock('../src/prisma/prisma.service', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    cpfCnpj: '12345678901',
    name: 'Test User',
    password: '$2b$10$hashedpassword',
    role: 'user',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    phone: null,
    properties: [
      {
        id: 'up-1',
        userId: 'user-1',
        propertyId: 'prop-1',
        role: 'owner',
        createdAt: new Date(),
        property: {
          id: 'prop-1',
          name: 'Test Property',
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
        }
      }
    ],
  };

  return {
    PrismaService: jest.fn().mockImplementation(() => ({
      user: {
        findMany: jest.fn().mockResolvedValue([mockUser]),
        findUnique: jest.fn().mockImplementation(async (args: any) => {
          if (args.where.cpfCnpj === '12345678901') {
            return mockUser;
          }
          if (args.where.id === 'user-1') {
            return mockUser;
          }
          return null;
        }),
        create: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
        delete: jest.fn().mockResolvedValue(mockUser),
        count: jest.fn().mockResolvedValue(1),
      },
      property: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: '1', name: 'Test Property' }),
        update: jest.fn().mockResolvedValue({ id: '1', name: 'Test Property' }),
        delete: jest.fn().mockResolvedValue({ id: '1' }),
      },
      livestock: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: '1', species: 'cattle' }),
        update: jest.fn().mockResolvedValue({ id: '1', species: 'cattle' }),
        delete: jest.fn().mockResolvedValue({ id: '1' }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      movement: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: '1', type: 'birth' }),
        update: jest.fn().mockResolvedValue({ id: '1', type: 'birth' }),
        delete: jest.fn().mockResolvedValue({ id: '1' }),
      },
      userProperty: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ userId: 'user-1', propertyId: 'prop-1' }),
      },
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([]),
      $executeRaw: jest.fn().mockResolvedValue(1),
    })),
  };
});

// Mock bcrypt for tests
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/agrosaldo_test';
