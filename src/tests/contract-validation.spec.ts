/**
 * Testes E2E de validação de contratos entre frontend e backend
 * Verifica compatibilidade de dados e detecta breaking changes
 */

import { test, expect } from '@playwright/test';
import { ContractSchemas, validateApiResponse } from '@/lib/contract-schemas';

test.describe('Validação de Contratos API', () => {
  const BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

  test('POST /auth/login - contrato de login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '123.456.789-00',
        password: '123456',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    
    // Validar contra schema
    const validatedData = validateApiResponse(data, ContractSchemas.LoginResponse);
    expect(validatedData).toHaveProperty('access_token');
    expect(validatedData).toHaveProperty('user');
    expect(validatedData.user).toHaveProperty('id');
    expect(validatedData.user).toHaveProperty('email');
  });

  test('GET /auth/me - contrato de usuário atual', async ({ request }) => {
    // Primeiro fazer login para obter token
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '123.456.789-00',
        password: '123456',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Buscar dados do usuário
    const response = await request.get(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const validatedData = validateApiResponse(data, ContractSchemas.Usuario);
    expect(validatedData).toHaveProperty('id');
    expect(validatedData).toHaveProperty('nome');
    expect(validatedData).toHaveProperty('email');
    expect(validatedData).toHaveProperty('papel');
  });

  test('GET /propriedades/minhas - contrato de propriedades', async ({ request }) => {
    // Login e token
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '123.456.789-00',
        password: '123456',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Buscar propriedades do usuário
    const response = await request.get(`${BASE_URL}/propriedades/minhas`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    // Validar cada propriedade contra schema
    data.forEach((property: any) => {
      const validatedProperty = validateApiResponse(property, ContractSchemas.Propriedade);
      expect(validatedProperty).toHaveProperty('id');
      expect(validatedProperty).toHaveProperty('nome');
      expect(validatedProperty).toHaveProperty('cidade');
      expect(validatedProperty).toHaveProperty('estado');
    });
  });

  test('POST /lancamentos/nascimento - contrato de criação de movimento', async ({ request }) => {
    // Login e token
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '123.456.789-00',
        password: '123456',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Buscar primeira propriedade para usar nos testes
    const propertiesResponse = await request.get(`${BASE_URL}/propriedades/minhas`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const properties = await propertiesResponse.json();
    expect(properties.length).toBeGreaterThan(0);
    const propertyId = properties[0].id;

    // Criar movimento de nascimento
    const movementData = {
      date: new Date().toISOString(),
      quantity: 5,
      sex: 'femea',
      ageGroup: '0-4m',
      description: 'Nascimento de bezerros',
    };

    const response = await request.post(`${BASE_URL}/lancamentos/nascimento`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Property-ID': propertyId,
      },
      data: movementData,
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    const validatedData = validateApiResponse(data, ContractSchemas.Movimento);
    expect(validatedData).toHaveProperty('id');
    expect(validatedData).toHaveProperty('propriedadeId');
    expect(validatedData).toHaveProperty('tipo');
    expect(validatedData.tipo).toBe('nascimento');
  });

  test('GET /rebanho/:propertyId - contrato de rebanho', async ({ request }) => {
    // Login e token
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '123.456.789-00',
        password: '123456',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Buscar primeira propriedade
    const propertiesResponse = await request.get(`${BASE_URL}/propriedades/minhas`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const properties = await propertiesResponse.json();
    expect(properties.length).toBeGreaterThan(0);
    const propertyId = properties[0].id;

    // Buscar dados do rebanho
    const response = await request.get(`${BASE_URL}/rebanho/${propertyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Property-ID': propertyId,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const validatedData = validateApiResponse(data, ContractSchemas.CattleReport);
    expect(validatedData).toHaveProperty('propertyId');
    expect(validatedData).toHaveProperty('livestock');
    expect(validatedData).toHaveProperty('total');
    expect(validatedData).toHaveProperty('byAgeGroup');
    expect(validatedData).toHaveProperty('bySex');
    expect(Array.isArray(validatedData.livestock)).toBe(true);
  });

  test('Validação de erro - contrato inválido', async ({ request }) => {
    // Tentar login com dados inválidos
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: 'invalid',
        password: 'wrong',
      },
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    // Resposta de erro não deve validar contra schema de sucesso
    expect(() => {
      validateApiResponse(data, ContractSchemas.LoginResponse);
    }).toThrow();
  });

  test('Validação de tipos de dados', async ({ request }) => {
    // Login
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '123.456.789-00',
        password: '123456',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Buscar usuário e validar tipos específicos
    const response = await request.get(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    const validatedUser = validateApiResponse(data, ContractSchemas.Usuario);

    // Validar UUID
    expect(validatedUser.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    
    // Validar email
    expect(validatedUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    
    // Validar enum
    expect(['super_admin', 'proprietario', 'gerente', 'operador']).toContain(validatedUser.papel);
    expect(['ativo', 'pendente_aprovacao', 'rejeitado', 'suspenso']).toContain(validatedUser.status);
    
    // Validar datas ISO
    expect(validatedUser.criadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

test.describe('Validação de Contratos Admin', () => {
  const BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

  test('GET /admin/dashboard/stats - contrato de dashboard admin', async ({ request }) => {
    // Login como admin
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '00.000.000/0001-00',
        password: 'admin123',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Buscar stats do dashboard
    const response = await request.get(`${BASE_URL}/admin/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const validatedData = validateApiResponse(data, ContractSchemas.AdminDashboardStats);
    expect(validatedData).toHaveProperty('totalTenants');
    expect(validatedData).toHaveProperty('activeTenants');
    expect(validatedData).toHaveProperty('totalCattle');
    expect(validatedData).toHaveProperty('mrr');
    expect(typeof validatedData.totalTenants).toBe('number');
    expect(typeof validatedData.activeTenants).toBe('number');
  });

  test('GET /admin/planos - contrato de planos', async ({ request }) => {
    // Login como admin
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '00.000.000/0001-00',
        password: 'admin123',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Buscar planos
    const response = await request.get(`${BASE_URL}/admin/planos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    // Validar cada plano
    data.forEach((plan: any) => {
      const validatedPlan = validateApiResponse(plan, ContractSchemas.AdminPlan);
      expect(validatedPlan).toHaveProperty('id');
      expect(validatedPlan).toHaveProperty('nome');
      expect(validatedPlan).toHaveProperty('preco');
      expect(typeof validatedPlan.preco).toBe('number');
      expect(['porteira', 'piquete', 'retiro', 'estancia', 'barao']).toContain(validatedPlan.nome);
    });
  });
});

test.describe('Validação de Contratos Analytics', () => {
  const BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

  test('GET /analytics/dashboard/:propertyId - contrato de analytics', async ({ request }) => {
    // Login
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        cpfCnpj: '123.456.789-00',
        password: '123456',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Buscar propriedade
    const propertiesResponse = await request.get(`${BASE_URL}/propriedades/minhas`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const properties = await propertiesResponse.json();
    expect(properties.length).toBeGreaterThan(0);
    const propertyId = properties[0].id;

    // Buscar analytics
    const response = await request.get(`${BASE_URL}/analytics/dashboard/${propertyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Property-ID': propertyId,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    // Analytics pode ter estrutura variável, então validamos apenas os campos obrigatórios
    expect(data).toHaveProperty('propertyId');
    expect(data.propertyId).toBe(propertyId);
  });
});
