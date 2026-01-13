import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  calculateAgeInMonths,
  calculateAgeGroup,
  shouldUpdateAgeGroup,
  cleanDocument,
} from '../utils';

describe('calculateAgeInMonths', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2024-01-15') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve calcular idade de 0 meses para nascimento no mesmo mês', () => {
    const birthDate = new Date('2024-01-10');
    expect(calculateAgeInMonths(birthDate)).toBe(0);
  });

  it('deve calcular idade de 3 meses corretamente', () => {
    const birthDate = new Date('2023-10-15');
    expect(calculateAgeInMonths(birthDate)).toBe(3);
  });

  it('deve calcular idade de 12 meses (1 ano)', () => {
    const birthDate = new Date('2023-01-15');
    expect(calculateAgeInMonths(birthDate)).toBe(12);
  });

  it('deve calcular idade de 24 meses (2 anos)', () => {
    const birthDate = new Date('2022-01-15');
    expect(calculateAgeInMonths(birthDate)).toBe(24);
  });

  it('deve calcular idade de 36 meses (3 anos)', () => {
    const birthDate = new Date('2021-01-15');
    expect(calculateAgeInMonths(birthDate)).toBe(36);
  });

  it('deve calcular idade de 48 meses (4 anos)', () => {
    const birthDate = new Date('2020-01-15');
    expect(calculateAgeInMonths(birthDate)).toBe(48);
  });

  it('deve lidar com diferença de anos sem meses completos', () => {
    const birthDate = new Date('2023-02-01');
    expect(calculateAgeInMonths(birthDate)).toBeGreaterThanOrEqual(11);
  });
});

describe('calculateAgeGroup', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2024-01-15') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve retornar "0-4" para animal com 0 meses', () => {
    const birthDate = new Date('2024-01-10');
    expect(calculateAgeGroup(birthDate)).toBe('0-4');
  });

  it('deve retornar "0-4" para animal com 4 meses', () => {
    const birthDate = new Date('2023-09-15');
    expect(calculateAgeGroup(birthDate)).toBe('0-4');
  });

  it('deve retornar "5-12" para animal com 5 meses', () => {
    const birthDate = new Date('2023-08-15');
    expect(calculateAgeGroup(birthDate)).toBe('5-12');
  });

  it('deve retornar "5-12" para animal com 12 meses', () => {
    const birthDate = new Date('2023-01-15');
    expect(calculateAgeGroup(birthDate)).toBe('5-12');
  });

  it('deve retornar "12-24" para animal com 13 meses', () => {
    const birthDate = new Date('2022-12-15');
    expect(calculateAgeGroup(birthDate)).toBe('12-24');
  });

  it('deve retornar "12-24" para animal com 24 meses', () => {
    const birthDate = new Date('2022-01-15');
    expect(calculateAgeGroup(birthDate)).toBe('12-24');
  });

  it('deve retornar "24-36" para animal com 25 meses', () => {
    const birthDate = new Date('2021-12-15');
    expect(calculateAgeGroup(birthDate)).toBe('24-36');
  });

  it('deve retornar "24-36" para animal com 36 meses', () => {
    const birthDate = new Date('2021-01-15');
    expect(calculateAgeGroup(birthDate)).toBe('24-36');
  });

  it('deve retornar "36+" para animal com 37 meses', () => {
    const birthDate = new Date('2020-12-15');
    expect(calculateAgeGroup(birthDate)).toBe('36+');
  });

  it('deve retornar "36+" para animal muito velho (10 anos)', () => {
    const birthDate = new Date('2014-01-15');
    expect(calculateAgeGroup(birthDate)).toBe('36+');
  });
});

describe('shouldUpdateAgeGroup', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2024-01-15') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve retornar false quando grupo está correto', () => {
    const birthDate = new Date('2024-01-10');
    expect(shouldUpdateAgeGroup('0-4', birthDate)).toBe(false);
  });

  it('deve retornar true quando animal evoluiu de grupo', () => {
    const birthDate = new Date('2023-08-15');
    expect(shouldUpdateAgeGroup('0-4', birthDate)).toBe(true);
  });

  it('deve detectar evolução de 5-12 para 12-24', () => {
    const birthDate = new Date('2022-12-15');
    expect(shouldUpdateAgeGroup('5-12', birthDate)).toBe(true);
  });

  it('deve detectar evolução de 12-24 para 24-36', () => {
    const birthDate = new Date('2021-12-15');
    expect(shouldUpdateAgeGroup('12-24', birthDate)).toBe(true);
  });

  it('deve detectar evolução de 24-36 para 36+', () => {
    const birthDate = new Date('2020-12-15');
    expect(shouldUpdateAgeGroup('24-36', birthDate)).toBe(true);
  });

  it('deve retornar false quando animal já está em 36+ e continua', () => {
    const birthDate = new Date('2014-01-15');
    expect(shouldUpdateAgeGroup('36+', birthDate)).toBe(false);
  });
});

describe('cleanDocument', () => {
  it('deve remover pontos e hífens de CPF', () => {
    expect(cleanDocument('123.456.789-00')).toBe('12345678900');
  });

  it('deve remover pontos, barras e hífens de CNPJ', () => {
    expect(cleanDocument('00.000.000/0001-00')).toBe('00000000000100');
  });

  it('deve retornar string vazia quando entrada é vazia', () => {
    expect(cleanDocument('')).toBe('');
  });

  it('deve manter apenas números', () => {
    expect(cleanDocument('abc123def456')).toBe('123456');
  });

  it('deve remover todos caracteres não numéricos', () => {
    expect(cleanDocument('(11) 98765-4321')).toBe('11987654321');
  });

  it('deve lidar com string já limpa', () => {
    expect(cleanDocument('12345678900')).toBe('12345678900');
  });
});
