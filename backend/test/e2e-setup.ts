import { PrismaClient } from '@prisma/client';

// Mock PrismaClient for e2e tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
      update: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
      delete: jest.fn().mockResolvedValue({ id: '1' }),
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
    },
    movement: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1', type: 'birth' }),
      update: jest.fn().mockResolvedValue({ id: '1', type: 'birth' }),
      delete: jest.fn().mockResolvedValue({ id: '1' }),
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/agrosaldo_test';
