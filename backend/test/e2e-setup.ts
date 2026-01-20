// Mock PrismaService for e2e tests
jest.mock('../src/prisma/prisma.service', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    cpfCnpj: '12345678901',
    nome: 'Test User',
    senha: '$2b$10$hashedpassword',
    papel: 'operador',
    status: 'ativo',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    telefone: null,
    propriedades: [
      {
        id: 'up-1',
        usuarioId: 'user-1',
        propriedadeId: 'prop-1',
        criadoEm: new Date(),
        propriedade: {
          id: 'prop-1',
          nome: 'Test Property',
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
        },
      },
    ],
  };

  return {
    PrismaService: jest.fn().mockImplementation(() => {
      const prismaMock: any = {
        usuario: {
        findMany: jest.fn().mockResolvedValue([mockUser]),
        findFirst: jest.fn().mockImplementation(async (args: any) => {
          const cpfCnpj = args?.where?.OR?.[0]?.cpfCnpj;
          if (cpfCnpj === '12345678901') {
            return mockUser;
          }
          return null;
        }),
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
        propriedade: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: '1', nome: 'Test Property' }),
        update: jest.fn().mockResolvedValue({ id: '1', nome: 'Test Property' }),
        delete: jest.fn().mockResolvedValue({ id: '1' }),
        },
        rebanho: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue(null),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: '1', especie: 'bovino' }),
          update: jest.fn().mockResolvedValue({ id: '1', especie: 'bovino' }),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          delete: jest.fn().mockResolvedValue({ id: '1' }),
          groupBy: jest.fn().mockResolvedValue([]),
        },
        movimento: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: '1',
            tipo: 'nascimento',
            propriedadeId: 'prop-1',
            criadoEm: new Date(),
          }),
          update: jest.fn().mockResolvedValue({
            id: '1',
            tipo: 'nascimento',
            propriedadeId: 'prop-1',
            criadoEm: new Date(),
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          delete: jest.fn().mockResolvedValue({ id: '1' }),
        },
        usuarioPropriedade: {
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn().mockResolvedValue({ id: 'up-1' }),
          create: jest
            .fn()
            .mockResolvedValue({ usuarioId: 'user-1', propriedadeId: 'prop-1' }),
        },
        $transaction: jest.fn().mockImplementation(async (fn: any) => {
          return fn(prismaMock);
        }),
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $queryRaw: jest.fn().mockResolvedValue([]),
        $executeRaw: jest.fn().mockResolvedValue(1),
      };

      return prismaMock;
    }),
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
process.env.PRISMA_DATABASE_URL =
  'postgresql://test:test@localhost:5432/agrosaldo_test';
