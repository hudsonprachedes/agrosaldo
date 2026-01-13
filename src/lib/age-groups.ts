/**
 * Sistema de Faixas Etárias Genérico
 * Suporta múltiplas espécies (bovino, bubalino, equino, etc)
 */

export type SpeciesType = 'bovino' | 'bubalino';
export type SexType = 'male' | 'female';

/**
 * Definição padrão de faixas etárias (meses)
 * Compartilhada entre todas as espécies de gado
 */
export const AGE_GROUP_BRACKETS = [
  { id: '0-4m', minMonths: 0, maxMonths: 4, label: '0-4 meses' },
  { id: '5-12m', minMonths: 5, maxMonths: 12, label: '5-12 meses' },
  { id: '13-24m', minMonths: 13, maxMonths: 24, label: '13-24 meses' },
  { id: '25-36m', minMonths: 25, maxMonths: 36, label: '25-36 meses' },
  { id: '36+m', minMonths: 36, maxMonths: Infinity, label: '+36 meses' },
] as const;

/**
 * Calcula a faixa etária baseado na data de nascimento
 * @param birthDate - Data de nascimento
 * @returns ID da faixa etária (ex: '0-4m')
 */
export function calculateAgeGroup(birthDate: Date): string {
  const ageInMonths = calculateAgeInMonths(birthDate);

  for (const bracket of AGE_GROUP_BRACKETS) {
    if (ageInMonths >= bracket.minMonths && ageInMonths <= bracket.maxMonths) {
      return bracket.id;
    }
  }

  // Fallback (não deveria chegar aqui)
  return '36+m';
}

/**
 * Calcula idade em meses
 */
export function calculateAgeInMonths(birthDate: Date): number {
  const now = new Date();
  const months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());

  // Ajustar por dias se necessário
  if (now.getDate() < birthDate.getDate()) {
    return Math.max(0, months - 1);
  }

  return Math.max(0, months);
}

/**
 * Obtém todas as faixas etárias disponíveis
 */
export function getAllAgeGroups() {
  return AGE_GROUP_BRACKETS.map(bracket => ({
    id: bracket.id,
    label: bracket.label,
    minMonths: bracket.minMonths,
    maxMonths: bracket.maxMonths,
  }));
}

/**
 * Validar se ID de faixa etária é válido
 */
export function isValidAgeGroupId(id: string): boolean {
  return AGE_GROUP_BRACKETS.some(bracket => bracket.id === id);
}

/**
 * Obter informações de uma faixa etária
 */
export function getAgeGroupInfo(id: string) {
  return AGE_GROUP_BRACKETS.find(bracket => bracket.id === id);
}
