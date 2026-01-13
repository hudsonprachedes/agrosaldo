import { describe, it, expect } from '@jest/globals';
import {
  validateGTA,
  formatGTA,
  isGTARequired,
  getGTAExpiration,
  isGTAValid,
  parseGTA,
  GTA_RULES,
  SUPPORTED_STATES,
  STATE_NAMES,
} from '../gta-validation';

describe('validateGTA', () => {
  it('deve validar GTA de MS corretamente', () => {
    const result = validateGTA('MS-1234567', 'MS');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('deve validar GTA de MT corretamente', () => {
    const result = validateGTA('MT-12345678', 'MT');
    expect(result.valid).toBe(true);
  });

  it('deve validar GTA de GO com dígito verificador', () => {
    const result = validateGTA('GO-123456-7', 'GO');
    expect(result.valid).toBe(true);
  });

  it('deve validar GTA de SP corretamente', () => {
    const result = validateGTA('SP-123456789', 'SP');
    expect(result.valid).toBe(true);
  });

  it('deve validar GTA de RS com 10 dígitos', () => {
    const result = validateGTA('RS-1234567890', 'RS');
    expect(result.valid).toBe(true);
  });

  it('deve rejeitar GTA com comprimento incorreto', () => {
    const result = validateGTA('MS-12345', 'MS');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('10 caracteres');
  });

  it('deve rejeitar GTA com formato inválido', () => {
    const result = validateGTA('MS12345678', 'MS');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Formato inválido');
  });

  it('deve rejeitar GTA com letras no número', () => {
    const result = validateGTA('MS-ABCDEFG', 'MS');
    expect(result.valid).toBe(false);
  });

  it('deve aceitar GTA com espaços (trim)', () => {
    const result = validateGTA('  MS-1234567  ', 'MS');
    expect(result.valid).toBe(true);
  });

  it('deve aceitar GTA em minúsculas (converte para maiúscula)', () => {
    const result = validateGTA('ms-1234567', 'MS');
    expect(result.valid).toBe(true);
  });

  it('deve validar todos os estados suportados', () => {
    expect(validateGTA('MS-1234567', 'MS').valid).toBe(true);
    expect(validateGTA('MT-12345678', 'MT').valid).toBe(true);
    expect(validateGTA('GO-123456-7', 'GO').valid).toBe(true);
    expect(validateGTA('SP-123456789', 'SP').valid).toBe(true);
    expect(validateGTA('MG-12345678', 'MG').valid).toBe(true);
    expect(validateGTA('RS-1234567890', 'RS').valid).toBe(true);
    expect(validateGTA('PR-1234567', 'PR').valid).toBe(true);
    expect(validateGTA('SC-12345678', 'SC').valid).toBe(true);
    expect(validateGTA('BA-123456789', 'BA').valid).toBe(true);
    expect(validateGTA('TO-123456', 'TO').valid).toBe(true);
    expect(validateGTA('PA-1234567', 'PA').valid).toBe(true);
    expect(validateGTA('RO-123456', 'RO').valid).toBe(true);
    expect(validateGTA('AC-123456', 'AC').valid).toBe(true);
  });
});

describe('formatGTA', () => {
  it('deve adicionar prefixo MS quando ausente', () => {
    expect(formatGTA('1234567', 'MS')).toBe('MS-1234567');
  });

  it('deve manter GTA que já tem prefixo', () => {
    expect(formatGTA('MS-1234567', 'MS')).toBe('MS-1234567');
  });

  it('deve converter para maiúsculas', () => {
    expect(formatGTA('ms-1234567', 'MS')).toBe('MS-1234567');
  });

  it('deve remover espaços', () => {
    expect(formatGTA('  1234567  ', 'MS')).toBe('MS-1234567');
  });

  it('deve formatar corretamente para GO com dígito verificador', () => {
    expect(formatGTA('123456-7', 'GO')).toBe('GO-123456-7');
  });

  it('deve formatar para todos os estados', () => {
    expect(formatGTA('12345678', 'MT')).toBe('MT-12345678');
    expect(formatGTA('123456789', 'SP')).toBe('SP-123456789');
    expect(formatGTA('1234567890', 'RS')).toBe('RS-1234567890');
  });
});

describe('isGTARequired', () => {
  it('deve exigir GTA para venda em MS', () => {
    expect(isGTARequired('sale', 'MS')).toBe(true);
  });

  it('deve exigir GTA para compra em MS', () => {
    expect(isGTARequired('purchase', 'MS')).toBe(true);
  });

  it('não deve exigir GTA para morte', () => {
    expect(isGTARequired('death', 'MS')).toBe(false);
  });

  it('não deve exigir GTA para nascimento', () => {
    expect(isGTARequired('birth', 'MS')).toBe(false);
  });

  it('não deve exigir GTA para vacina', () => {
    expect(isGTARequired('vaccine', 'MS')).toBe(false);
  });

  it('não deve exigir GTA para ajuste', () => {
    expect(isGTARequired('adjustment', 'MS')).toBe(false);
  });

  it('deve exigir GTA para venda em todos os estados', () => {
    SUPPORTED_STATES.forEach(state => {
      expect(isGTARequired('sale', state)).toBe(true);
    });
  });

  it('deve exigir GTA para compra em todos os estados', () => {
    SUPPORTED_STATES.forEach(state => {
      expect(isGTARequired('purchase', state)).toBe(true);
    });
  });
});

describe('getGTAExpiration', () => {
  it('deve calcular expiração de 15 dias para MS', () => {
    const issueDate = new Date('2024-01-01');
    const expiration = getGTAExpiration(issueDate, 'MS');
    expect(expiration).toEqual(new Date('2024-01-16'));
  });

  it('deve calcular expiração de 10 dias para GO', () => {
    const issueDate = new Date('2024-01-01');
    const expiration = getGTAExpiration(issueDate, 'GO');
    expect(expiration).toEqual(new Date('2024-01-11'));
  });

  it('deve calcular expiração de 20 dias para SP', () => {
    const issueDate = new Date('2024-01-01');
    const expiration = getGTAExpiration(issueDate, 'SP');
    expect(expiration).toEqual(new Date('2024-01-21'));
  });

  it('deve calcular expiração corretamente atravessando meses', () => {
    const issueDate = new Date('2024-01-25');
    const expiration = getGTAExpiration(issueDate, 'MS');
    expect(expiration).toEqual(new Date('2024-02-09'));
  });

  it('deve calcular expiração corretamente atravessando anos', () => {
    const issueDate = new Date('2023-12-25');
    const expiration = getGTAExpiration(issueDate, 'MS');
    expect(expiration).toEqual(new Date('2024-01-09'));
  });
});

describe('isGTAValid', () => {
  it('deve retornar true para GTA dentro do prazo', () => {
    const issueDate = new Date('2024-01-01');
    const checkDate = new Date('2024-01-10');
    expect(isGTAValid(issueDate, 'MS', checkDate)).toBe(true);
  });

  it('deve retornar true para GTA no último dia de validade', () => {
    const issueDate = new Date('2024-01-01');
    const checkDate = new Date('2024-01-16'); // 15 dias depois
    expect(isGTAValid(issueDate, 'MS', checkDate)).toBe(true);
  });

  it('deve retornar false para GTA expirada', () => {
    const issueDate = new Date('2024-01-01');
    const checkDate = new Date('2024-01-17'); // 16 dias depois
    expect(isGTAValid(issueDate, 'MS', checkDate)).toBe(false);
  });

  it('deve usar data atual quando checkDate não fornecida', () => {
    const issueDate = new Date();
    expect(isGTAValid(issueDate, 'MS')).toBe(true);
  });

  it('deve validar corretamente para GO com 10 dias', () => {
    const issueDate = new Date('2024-01-01');
    const checkDate = new Date('2024-01-11'); // 10 dias
    expect(isGTAValid(issueDate, 'GO', checkDate)).toBe(true);
    
    const expiredCheck = new Date('2024-01-12'); // 11 dias
    expect(isGTAValid(issueDate, 'GO', expiredCheck)).toBe(false);
  });

  it('deve validar corretamente para SP com 20 dias', () => {
    const issueDate = new Date('2024-01-01');
    const checkDate = new Date('2024-01-21'); // 20 dias
    expect(isGTAValid(issueDate, 'SP', checkDate)).toBe(true);
    
    const expiredCheck = new Date('2024-01-22'); // 21 dias
    expect(isGTAValid(issueDate, 'SP', expiredCheck)).toBe(false);
  });
});

describe('parseGTA', () => {
  it('deve extrair estado e número de GTA válida', () => {
    const result = parseGTA('MS-1234567');
    expect(result.state).toBe('MS');
    expect(result.number).toBe('MS-1234567');
    expect(result.valid).toBe(true);
  });

  it('deve marcar GTA inválida como não válida', () => {
    const result = parseGTA('MS-12345');
    expect(result.state).toBe('MS');
    expect(result.number).toBe('MS-12345');
    expect(result.valid).toBe(false);
  });

  it('deve retornar state null para GTA sem prefixo', () => {
    const result = parseGTA('1234567');
    expect(result.state).toBeNull();
    expect(result.number).toBe('1234567');
    expect(result.valid).toBe(false);
  });

  it('deve converter para maiúsculas ao parsear', () => {
    const result = parseGTA('ms-1234567');
    expect(result.state).toBe('MS');
    expect(result.number).toBe('MS-1234567');
    expect(result.valid).toBe(true);
  });

  it('deve remover espaços ao parsear', () => {
    const result = parseGTA('  MS-1234567  ');
    expect(result.state).toBe('MS');
    expect(result.number).toBe('MS-1234567');
    expect(result.valid).toBe(true);
  });

  it('deve parsear GTA de GO com dígito verificador', () => {
    const result = parseGTA('GO-123456-7');
    expect(result.state).toBe('GO');
    expect(result.number).toBe('GO-123456-7');
    expect(result.valid).toBe(true);
  });
});

describe('GTA_RULES', () => {
  it('deve ter regras para todos os estados suportados', () => {
    SUPPORTED_STATES.forEach(state => {
      expect(GTA_RULES[state]).toBeDefined();
      expect(GTA_RULES[state].state).toBe(state);
    });
  });

  it('deve ter todas as propriedades necessárias para cada regra', () => {
    SUPPORTED_STATES.forEach(state => {
      const rule = GTA_RULES[state];
      expect(rule.pattern).toBeInstanceOf(RegExp);
      expect(rule.format).toBeTruthy();
      expect(rule.length).toBeGreaterThan(0);
      expect(rule.description).toBeTruthy();
      expect(rule.example).toBeTruthy();
      expect(typeof rule.requiredForSale).toBe('boolean');
      expect(typeof rule.requiredForPurchase).toBe('boolean');
      expect(rule.expirationDays).toBeGreaterThan(0);
    });
  });

  it('deve ter 13 estados configurados', () => {
    expect(SUPPORTED_STATES.length).toBe(13);
    expect(Object.keys(GTA_RULES).length).toBe(13);
  });
});

describe('STATE_NAMES', () => {
  it('deve ter nome completo para todos os estados', () => {
    SUPPORTED_STATES.forEach(state => {
      expect(STATE_NAMES[state]).toBeTruthy();
      expect(STATE_NAMES[state].length).toBeGreaterThan(2);
    });
  });

  it('deve ter nomes corretos para estados principais', () => {
    expect(STATE_NAMES.MS).toBe('Mato Grosso do Sul');
    expect(STATE_NAMES.MT).toBe('Mato Grosso');
    expect(STATE_NAMES.GO).toBe('Goiás');
    expect(STATE_NAMES.SP).toBe('São Paulo');
    expect(STATE_NAMES.RS).toBe('Rio Grande do Sul');
  });
});
