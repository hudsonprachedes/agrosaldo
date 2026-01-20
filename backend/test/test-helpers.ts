// Mock PrismaService types for tests

type MockPrismaService = {
  $transaction: jest.Mock;
  usuario: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  propriedade: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  rebanho: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    delete: jest.Mock;
    groupBy: jest.Mock;
  };
  movimento: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  usuarioPropriedade: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  cpfCnpj: '12345678901',
  nome: 'Test User',
  senha: '$2b$10$q/.GykwS6X6A1ZFTSPAWneDIhOePOCCM6dOOdAoN/v.lJpflVUkjG',
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

type MockTransactionCallback = (tx: {
  usuario: { create: jest.Mock };
  propriedade: { create: jest.Mock };
  usuarioPropriedade: { create: jest.Mock };
}) => Promise<unknown>;

type MockFindFirstArgs = {
  where?: {
    OR?: Array<{ cpfCnpj?: string }>;
  };
};

type MockFindUniqueArgs = {
  where?: {
    cpfCnpj?: string;
    id?: string;
  };
};

type MockUsuarioPropriedadeFindFirstArgs = {
  where?: {
    usuarioId?: string;
    propriedadeId?: string;
  };
};

export const createMockPrismaService = (): MockPrismaService => {
  const user = mockUser;

  return {
    $transaction: jest
      .fn()
      .mockImplementation((fn: MockTransactionCallback) => {
        return fn({
          usuario: {
            create: jest.fn().mockResolvedValue(user),
          },
          propriedade: {
            create: jest.fn().mockResolvedValue({
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
            }),
          },
          usuarioPropriedade: {
            create: jest.fn().mockResolvedValue({
              usuarioId: mockUser.id,
              propriedadeId: 'prop-1',
            }),
          },
        });
      }),
    usuario: {
      findMany: jest.fn().mockResolvedValue([mockUser]),
      findFirst: jest.fn().mockImplementation((args: MockFindFirstArgs) => {
        const cpfCnpj = args?.where?.OR?.[0]?.cpfCnpj;
        if (cpfCnpj === '12345678901') {
          return Promise.resolve(user);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation((args: MockFindUniqueArgs) => {
        if (args.where?.cpfCnpj === '12345678901') {
          return Promise.resolve(user);
        }
        if (args.where?.id === 'user-1') {
          return Promise.resolve({
            ...user,
            propriedades: [],
          });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      delete: jest.fn().mockResolvedValue(mockUser),
      count: jest.fn().mockResolvedValue(1),
    },
    propriedade: {
      findMany: jest.fn().mockResolvedValue([
        {
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
      ]),
      findUnique: jest.fn().mockResolvedValue({
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
      }),
      create: jest.fn().mockResolvedValue({
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
      }),
      update: jest.fn().mockResolvedValue({
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
      }),
      delete: jest.fn().mockResolvedValue({
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
      }),
    },
    rebanho: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1', especie: 'bovino' }),
      update: jest.fn().mockResolvedValue({ id: '1', especie: 'bovino' }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn().mockResolvedValue({ id: '1', especie: 'bovino' }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    movimento: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: '1',
        tipo: 'nascimento',
        data: new Date(),
        quantidade: 1,
        sexo: 'macho',
        faixaEtaria: '0-12',
        causa: null,
        propriedadeId: 'prop-1',
        criadoEm: new Date(),
      }),
      update: jest.fn().mockResolvedValue({
        id: '1',
        tipo: 'nascimento',
        data: new Date(),
        quantidade: 1,
        sexo: 'macho',
        faixaEtaria: '0-12',
        causa: null,
        propriedadeId: 'prop-1',
        criadoEm: new Date(),
      }),
      delete: jest.fn().mockResolvedValue({
        id: '1',
        tipo: 'nascimento',
        data: new Date(),
        quantidade: 1,
        sexo: 'macho',
        faixaEtaria: '0-12',
        causa: null,
        propriedadeId: 'prop-1',
        criadoEm: new Date(),
      }),
    },
    usuarioPropriedade: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'up-1',
          usuarioId: 'user-1',
          propriedadeId: 'prop-1',
          criadoEm: new Date(),
        },
      ]),
      findFirst: jest
        .fn()
        .mockImplementation((args: MockUsuarioPropriedadeFindFirstArgs) => {
          const userId = args?.where?.usuarioId;
          const propertyId = args?.where?.propriedadeId;
          if (userId === 'user-1' && propertyId === 'prop-1') {
            return Promise.resolve({ id: 'up-1' });
          }
          return Promise.resolve(null);
        }),
      create: jest.fn().mockResolvedValue({
        usuarioId: 'user-1',
        propriedadeId: 'prop-1',
      }),
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([]),
    $executeRaw: jest.fn().mockResolvedValue(1),
  };
};
