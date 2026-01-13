/**
 * GTA (Guia de Trânsito Animal) Validation Rules
 * 
 * Regras de validação por estado conforme legislação vigente.
 * Cada estado possui formato específico e validações diferentes.
 */
import { cleanDocument } from './utils';

export type GTAState = 'MS' | 'MT' | 'GO' | 'SP' | 'MG' | 'RS' | 'PR' | 'SC' | 'BA' | 'TO' | 'PA' | 'RO' | 'AC';

export interface GTAValidationRule {
  state: GTAState;
  pattern: RegExp;
  format: string;
  length: number;
  description: string;
  example: string;
  requiredForSale: boolean;
  requiredForPurchase: boolean;
  expirationDays: number; // Dias de validade da GTA
}

/**
 * Regras de validação de GTA por estado
 */
export const GTA_RULES: Record<GTAState, GTAValidationRule> = {
  MS: {
    state: 'MS',
    pattern: /^MS-\d{7}$/,
    format: 'MS-XXXXXXX',
    length: 10,
    description: 'Mato Grosso do Sul - 7 dígitos após prefixo MS-',
    example: 'MS-1234567',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  MT: {
    state: 'MT',
    pattern: /^MT-\d{8}$/,
    format: 'MT-XXXXXXXX',
    length: 11,
    description: 'Mato Grosso - 8 dígitos após prefixo MT-',
    example: 'MT-12345678',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  GO: {
    state: 'GO',
    pattern: /^GO-\d{6}-\d{1}$/,
    format: 'GO-XXXXXX-X',
    length: 11,
    description: 'Goiás - 6 dígitos + dígito verificador',
    example: 'GO-123456-7',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 10,
  },
  SP: {
    state: 'SP',
    pattern: /^SP-\d{9}$/,
    format: 'SP-XXXXXXXXX',
    length: 12,
    description: 'São Paulo - 9 dígitos após prefixo SP-',
    example: 'SP-123456789',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 20,
  },
  MG: {
    state: 'MG',
    pattern: /^MG-\d{8}$/,
    format: 'MG-XXXXXXXX',
    length: 11,
    description: 'Minas Gerais - 8 dígitos após prefixo MG-',
    example: 'MG-12345678',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  RS: {
    state: 'RS',
    pattern: /^RS-\d{10}$/,
    format: 'RS-XXXXXXXXXX',
    length: 13,
    description: 'Rio Grande do Sul - 10 dígitos após prefixo RS-',
    example: 'RS-1234567890',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  PR: {
    state: 'PR',
    pattern: /^PR-\d{7}$/,
    format: 'PR-XXXXXXX',
    length: 10,
    description: 'Paraná - 7 dígitos após prefixo PR-',
    example: 'PR-1234567',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  SC: {
    state: 'SC',
    pattern: /^SC-\d{8}$/,
    format: 'SC-XXXXXXXX',
    length: 11,
    description: 'Santa Catarina - 8 dígitos após prefixo SC-',
    example: 'SC-12345678',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  BA: {
    state: 'BA',
    pattern: /^BA-\d{9}$/,
    format: 'BA-XXXXXXXXX',
    length: 12,
    description: 'Bahia - 9 dígitos após prefixo BA-',
    example: 'BA-123456789',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 10,
  },
  TO: {
    state: 'TO',
    pattern: /^TO-\d{6}$/,
    format: 'TO-XXXXXX',
    length: 9,
    description: 'Tocantins - 6 dígitos após prefixo TO-',
    example: 'TO-123456',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  PA: {
    state: 'PA',
    pattern: /^PA-\d{7}$/,
    format: 'PA-XXXXXXX',
    length: 10,
    description: 'Pará - 7 dígitos após prefixo PA-',
    example: 'PA-1234567',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  RO: {
    state: 'RO',
    pattern: /^RO-\d{6}$/,
    format: 'RO-XXXXXX',
    length: 9,
    description: 'Rondônia - 6 dígitos após prefixo RO-',
    example: 'RO-123456',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
  AC: {
    state: 'AC',
    pattern: /^AC-\d{6}$/,
    format: 'AC-XXXXXX',
    length: 9,
    description: 'Acre - 6 dígitos após prefixo AC-',
    example: 'AC-123456',
    requiredForSale: true,
    requiredForPurchase: true,
    expirationDays: 15,
  },
};

/**
 * Valida número de GTA de acordo com o estado
 */
export function validateGTA(gtaNumber: string, state: GTAState): {
  valid: boolean;
  message?: string;
} {
  const rule = GTA_RULES[state];
  
  if (!rule) {
    return {
      valid: false,
      message: `Estado ${state} não possui regra de validação configurada`,
    };
  }

  // Remove espaços e converte para maiúsculo
  const cleanGTA = gtaNumber.trim().toUpperCase();

  // Valida comprimento
  if (cleanGTA.length !== rule.length) {
    return {
      valid: false,
      message: `GTA deve ter ${rule.length} caracteres. Formato: ${rule.format}`,
    };
  }

  // Valida padrão regex
  if (!rule.pattern.test(cleanGTA)) {
    return {
      valid: false,
      message: `Formato inválido. Esperado: ${rule.format}. Exemplo: ${rule.example}`,
    };
  }

  return { valid: true };
}

/**
 * Formata número de GTA adicionando prefixo do estado se necessário
 */
export function formatGTA(gtaNumber: string, state: GTAState): string {
  const rule = GTA_RULES[state];
  const clean = gtaNumber.trim().toUpperCase();

  // Se já tem o prefixo, retorna
  if (clean.startsWith(`${state}-`)) {
    return clean;
  }

  // Adiciona prefixo
  return `${state}-${clean.replace(/^[A-Z]{2}-/, '')}`;
}

/**
 * Verifica se GTA é obrigatória para um tipo de movimentação
 */
export function isGTARequired(
  movementType: 'sale' | 'purchase' | 'death' | 'birth' | 'vaccine' | 'adjustment',
  state: GTAState
): boolean {
  const rule = GTA_RULES[state];
  
  if (!rule) return false;

  switch (movementType) {
    case 'sale':
      return rule.requiredForSale;
    case 'purchase':
      return rule.requiredForPurchase;
    default:
      return false;
  }
}

/**
 * Calcula data de expiração da GTA
 */
export function getGTAExpiration(issueDate: Date, state: GTAState): Date {
  const rule = GTA_RULES[state];
  const expiration = new Date(issueDate);
  expiration.setDate(expiration.getDate() + rule.expirationDays);
  return expiration;
}

/**
 * Verifica se GTA está dentro do prazo de validade
 */
export function isGTAValid(issueDate: Date, state: GTAState, checkDate: Date = new Date()): boolean {
  const expiration = getGTAExpiration(issueDate, state);
  return checkDate <= expiration;
}

/**
 * Extrai informações da GTA
 */
export function parseGTA(gtaNumber: string): {
  state: GTAState | null;
  number: string;
  valid: boolean;
} {
  const clean = gtaNumber.trim().toUpperCase();
  
  // Extrai estado do prefixo
  const stateMatch = clean.match(/^([A-Z]{2})-/);
  
  if (!stateMatch) {
    return {
      state: null,
      number: clean,
      valid: false,
    };
  }

  const state = stateMatch[1] as GTAState;
  const number = clean;
  
  const validation = validateGTA(number, state);
  
  return {
    state,
    number,
    valid: validation.valid,
  };
}

/**
 * Lista de estados suportados
 */
export const SUPPORTED_STATES: GTAState[] = [
  'MS', 'MT', 'GO', 'SP', 'MG', 'RS', 'PR', 'SC', 'BA', 'TO', 'PA', 'RO', 'AC'
];

/**
 * Nomes completos dos estados
 */
export const STATE_NAMES: Record<GTAState, string> = {
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  GO: 'Goiás',
  SP: 'São Paulo',
  MG: 'Minas Gerais',
  RS: 'Rio Grande do Sul',
  PR: 'Paraná',
  SC: 'Santa Catarina',
  BA: 'Bahia',
  TO: 'Tocantins',
  PA: 'Pará',
  RO: 'Rondônia',
  AC: 'Acre',
};

/**
 * Valida CPF com dígitos verificadores
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cleanDocument(cpf);

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  const digits = cleaned.split('').map(Number);

  const calcVerifier = (length: number) => {
    const sum = digits
      .slice(0, length)
      .reduce((acc, digit, index) => acc + digit * (length + 1 - index), 0);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const v1 = calcVerifier(9);
  const v2 = calcVerifier(10);

  return v1 === digits[9] && v2 === digits[10];
}

/**
 * Valida CNPJ com dígitos verificadores
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanDocument(cnpj);

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const digits = cleaned.split('').map(Number);
  const calcVerifier = (length: number) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const slice = digits.slice(0, length);
    const sum = slice.reduce((acc, digit, index) => acc + digit * weights[index], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const v1 = calcVerifier(12);
  const v2 = calcVerifier(13);

  return v1 === digits[12] && v2 === digits[13];
}
