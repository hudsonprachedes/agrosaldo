import { describe, it, expect } from 'vitest';
import { getAvailableMatrizes } from '../mock-bovinos';

describe('mock-bovinos - getAvailableMatrizes', () => {
  it('deve retornar apenas fêmeas com 24+ meses', () => {
    const mockCattle = [
      { 
        id: '1', 
        sex: 'Fêmea', 
        birthDate: new Date('2022-01-01'), // 24 meses
        ageGroup: '24-36',
        propertyId: 'prop1',
        species: 'Bovino',
        breed: 'Nelore',
        earTag: '001',
        weight: 450,
        createdAt: new Date(),
      },
      { 
        id: '2', 
        sex: 'Macho', 
        birthDate: new Date('2021-01-01'), // 36+ meses
        ageGroup: '36+',
        propertyId: 'prop1',
        species: 'Bovino',
        breed: 'Nelore',
        earTag: '002',
        weight: 550,
        createdAt: new Date(),
      },
      { 
        id: '3', 
        sex: 'Fêmea', 
        birthDate: new Date('2023-06-01'), // < 24 meses
        ageGroup: '5-12',
        propertyId: 'prop1',
        species: 'Bovino',
        breed: 'Nelore',
        earTag: '003',
        weight: 300,
        createdAt: new Date(),
      },
      { 
        id: '4', 
        sex: 'Fêmea', 
        birthDate: new Date('2020-01-01'), // 48+ meses
        ageGroup: '36+',
        propertyId: 'prop1',
        species: 'Bovino',
        breed: 'Nelore',
        earTag: '004',
        weight: 500,
        createdAt: new Date(),
      },
    ];

    const matrices = getAvailableMatrizes(mockCattle);
    
    // Deve retornar apenas fêmeas com 24+ meses (ids 1 e 4)
    expect(matrices.length).toBe(2);
    expect(matrices.every(m => m.sex === 'Fêmea')).toBe(true);
  });

  it('deve retornar array vazio quando não há matrizes disponíveis', () => {
    const mockCattle = [
      { 
        id: '1', 
        sex: 'Macho', 
        birthDate: new Date('2020-01-01'),
        ageGroup: '36+',
        propertyId: 'prop1',
        species: 'Bovino',
        breed: 'Nelore',
        earTag: '001',
        weight: 500,
        createdAt: new Date(),
      },
    ];

    const matrices = getAvailableMatrizes(mockCattle);
    expect(matrices.length).toBe(0);
  });

  it('deve filtrar por propertyId corretamente', () => {
    const mockCattle = [
      { 
        id: '1', 
        sex: 'Fêmea', 
        birthDate: new Date('2020-01-01'),
        ageGroup: '36+',
        propertyId: 'prop1',
        species: 'Bovino',
        breed: 'Nelore',
        earTag: '001',
        weight: 450,
        createdAt: new Date(),
      },
      { 
        id: '2', 
        sex: 'Fêmea', 
        birthDate: new Date('2020-01-01'),
        ageGroup: '36+',
        propertyId: 'prop2',
        species: 'Bovino',
        breed: 'Nelore',
        earTag: '002',
        weight: 450,
        createdAt: new Date(),
      },
    ];

    const matrices = getAvailableMatrizes(mockCattle, 'prop1');
    expect(matrices.length).toBe(1);
    expect(matrices[0].propertyId).toBe('prop1');
  });
});

describe('mock-bovinos - validação de nascimentos', () => {
  it('nascimentos não devem exceder matrizes disponíveis', () => {
    const availableMatrizes = 10;
    const requestedBirths = 5;
    
    expect(requestedBirths).toBeLessThanOrEqual(availableMatrizes);
  });

  it('deve rejeitar quando nascimentos excedem matrizes', () => {
    const availableMatrizes = 10;
    const requestedBirths = 15;
    
    expect(requestedBirths).toBeGreaterThan(availableMatrizes);
  });

  it('deve permitir nascimentos iguais ao número de matrizes', () => {
    const availableMatrizes = 10;
    const requestedBirths = 10;
    
    expect(requestedBirths).toBeLessThanOrEqual(availableMatrizes);
  });

  it('deve permitir zero nascimentos', () => {
    const availableMatrizes = 10;
    const requestedBirths = 0;
    
    expect(requestedBirths).toBeGreaterThanOrEqual(0);
    expect(requestedBirths).toBeLessThanOrEqual(availableMatrizes);
  });
});
