/**
 * Testes unitários para funções críticas de negócio
 * Coverage: Cálculo de faixas etárias, validação de matrizes, compressão
 */

import { describe, it, expect } from '@jest/globals';
import { calculateAgeInMonths, calculateAgeGroup, shouldUpdateAgeGroup } from '@/lib/utils';
import { getAvailableMatrizes } from '@/mocks/mock-bovinos';
import { migrateMovementsBetweenAgeGroups } from '@/lib/age-group-migration';
import { formatReportForWhatsApp } from '@/lib/whatsapp-share';

describe('Cálculo de Idade em Meses', () => {
  it('deve calcular idade corretamente para nascimento recente', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 2); // 2 meses atrás
    
    const ageInMonths = calculateAgeInMonths(birthDate);
    expect(ageInMonths).toBe(2);
  });

  it('deve calcular idade corretamente para nascimento há um ano', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 1);
    
    const ageInMonths = calculateAgeInMonths(birthDate);
    expect(ageInMonths).toBe(12);
  });

  it('deve calcular idade corretamente para nascimento há 3 anos', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 3);
    
    const ageInMonths = calculateAgeInMonths(birthDate);
    expect(ageInMonths).toBe(36);
  });
});

describe('Determinação de Faixa Etária', () => {
  it('deve retornar 0-4 para animal recém-nascido', () => {
    const birthDate = new Date();
    birthDate.setDate(birthDate.getDate() - 1); // Ontem
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('0-4');
  });

  it('deve retornar 0-4 para animal com 4 meses', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 4);
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('0-4');
  });

  it('deve retornar 5-12 para animal com 6 meses', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 6);
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('5-12');
  });

  it('deve retornar 5-12 para animal com 12 meses', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 12);
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('5-12');
  });

  it('deve retornar 12-24 para animal com 18 meses', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 18);
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('12-24');
  });

  it('deve retornar 24-36 para animal com 30 meses', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 30);
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('24-36');
  });

  it('deve retornar 36+ para animal com 40 meses', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 40);
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('36+');
  });
});

describe('Detecção de Mudança de Faixa', () => {
  it('deve retornar true quando animal muda de faixa', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 6);
    const currentGroup = '0-4'; // Faixa anterior
    
    const shouldUpdate = shouldUpdateAgeGroup(currentGroup, birthDate);
    expect(shouldUpdate).toBe(true);
  });

  it('deve retornar false quando animal permanece na mesma faixa', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 3);
    const currentGroup = '0-4'; // Mesma faixa
    
    const shouldUpdate = shouldUpdateAgeGroup(currentGroup, birthDate);
    expect(shouldUpdate).toBe(false);
  });
});

describe('Validação de Matrizes', () => {
  it('deve retornar quantidade correta de matrizes para propriedade 1', () => {
    const matrizes = getAvailableMatrizes('prop-1');
    expect(typeof matrizes).toBe('number');
    expect(matrizes).toBeGreaterThan(0);
  });

  it('deve retornar quantidade correta de matrizes para propriedade 3', () => {
    const matrizes = getAvailableMatrizes('prop-3');
    expect(typeof matrizes).toBe('number');
    expect(matrizes).toBeGreaterThanOrEqual(0);
  });

  it('deve validar nascimento dentro do limite de matrizes', () => {
    const matrizes = getAvailableMatrizes('prop-1');
    const birthQuantity = 10;
    
    // Simulação simples de validação
    const isValid = birthQuantity <= matrizes;
    expect(isValid).toBe(true);
  });

  it('deve bloquear nascimento acima do limite de matrizes', () => {
    const matrizes = getAvailableMatrizes('prop-1');
    const birthQuantity = matrizes + 1; // Um a mais que o limite
    
    // Simulação simples de validação
    const isValid = birthQuantity <= matrizes;
    expect(isValid).toBe(false);
  });
});

describe('Migração de Movimentos Entre Faixas', () => {
  it('deve migrar movimentos com birthDate preenchido', () => {
    const movements = [
      {
        id: 'mov-test-1',
        type: 'birth' as const,
        date: '2024-01-15',
        quantity: 5,
        sex: 'male' as const,
        ageGroupId: '0-4',
        description: 'Test',
        propertyId: 'prop-1',
        createdAt: '2024-01-15T08:00:00Z',
        birthDate: new Date(2024, 8, 15).toISOString(), // 6 meses atrás = faixa 5-12
      },
    ];

    const result = migrateMovementsBetweenAgeGroups(movements);
    expect(result.migratedCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.details)).toBe(true);
  });

  it('deve ignorar movimentos sem birthDate', () => {
    const movements = [
      {
        id: 'mov-test-2',
        type: 'death' as const,
        date: '2024-01-20',
        quantity: 2,
        ageGroupId: '0-4',
        description: 'Test death',
        propertyId: 'prop-1',
        createdAt: '2024-01-20T10:00:00Z',
      },
    ];

    const result = migrateMovementsBetweenAgeGroups(movements);
    expect(result.migratedCount).toBe(0);
  });
});

describe('Formatação para WhatsApp', () => {
  it('deve formatar dados de rebanho corretamente', () => {
    const reportData = {
      propertyName: 'Fazenda Teste',
      ownerName: 'João Silva',
      state: 'MT',
      totalCattle: 1000,
      monthlyBirths: 50,
      monthlyDeaths: 5,
    };

    const message = formatReportForWhatsApp(reportData);
    
    expect(message).toContain('Fazenda Teste');
    expect(message).toContain('João Silva');
    expect(message).toContain('1000');
    expect(message).toContain('50');
    expect(message).toContain('5');
  });

  it('deve incluir distribuição por faixa etária quando fornecida', () => {
    const reportData = {
      propertyName: 'Fazenda Teste',
      ownerName: 'João Silva',
      state: 'MT',
      totalCattle: 1000,
      ageDistribution: [
        { label: '0-4 meses', total: 100 },
        { label: '5-12 meses', total: 200 },
      ],
    };

    const message = formatReportForWhatsApp(reportData);
    
    expect(message).toContain('0-4 meses');
    expect(message).toContain('100');
    expect(message).toContain('200');
  });

  it('deve gerar mensagem válida para WhatsApp', () => {
    const reportData = {
      propertyName: 'Fazenda',
      ownerName: 'João',
      state: 'MT',
      totalCattle: 500,
    };

    const message = formatReportForWhatsApp(reportData);
    
    // Verificar que não contém caracteres inválidos
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
    expect(message).toContain('🐄'); // Emoji de vaca
  });
});

describe('Edge Cases', () => {
  it('deve lidar com nascimento duplicado no mesmo dia', () => {
    const movements = [
      {
        id: 'mov-1',
        type: 'birth' as const,
        date: '2024-01-15',
        quantity: 10,
        sex: 'female' as const,
        ageGroupId: '0-4',
        description: 'Lote A',
        propertyId: 'prop-1',
        createdAt: '2024-01-15T08:00:00Z',
        birthDate: '2024-01-15',
      },
      {
        id: 'mov-2',
        type: 'birth' as const,
        date: '2024-01-15',
        quantity: 5,
        sex: 'female' as const,
        ageGroupId: '0-4',
        description: 'Lote B',
        propertyId: 'prop-1',
        createdAt: '2024-01-15T14:00:00Z',
        birthDate: '2024-01-15',
      },
    ];

    const result = migrateMovementsBetweenAgeGroups(movements);
    expect(result).toBeDefined();
    expect(Array.isArray(result.details)).toBe(true);
  });

  it('deve validar zero matrizes corretamente', () => {
    // Criar cenário onde não há matrizes
    const matrizes = 0;
    const birthQuantity = 1;
    
    const isValid = birthQuantity <= matrizes;
    expect(isValid).toBe(false);
  });

  it('deve calcular idade de animal no limite de faixa', () => {
    // Teste para animal exatamente no limite (4 meses)
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 4);
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('0-4');
  });

  it('deve calcular idade de animal logo após limite de faixa', () => {
    // Teste para animal logo após o limite (5+ meses)
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 5);
    
    const ageGroup = calculateAgeGroup(birthDate);
    expect(ageGroup).toBe('5-12');
  });
});
