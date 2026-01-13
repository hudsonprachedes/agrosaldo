import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/**
 * Calcula a idade em meses de um animal baseado na data de nascimento
 */
export function calculateAgeInMonths(birthDate: Date): number {
  const now = new Date();
  const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + 
                 (now.getMonth() - birthDate.getMonth());
  return months;
}

/**
 * Determina a faixa etária baseado na data de nascimento
 * Regras:
 * - 0-4 meses: 0 a 4 meses
 * - 5-12 meses: 5 a 12 meses  
 * - 12-24 meses: 13 a 24 meses
 * - 24-36 meses: 25 a 36 meses
 * - 36+ meses: acima de 36 meses
 */
export function calculateAgeGroup(birthDate: Date): string {
  const ageInMonths = calculateAgeInMonths(birthDate);
  
  if (ageInMonths <= 4) return '0-4';
  if (ageInMonths <= 12) return '5-12';
  if (ageInMonths <= 24) return '12-24';
  if (ageInMonths <= 36) return '24-36';
  return '36+';
}

/**
 * Verifica se um animal deve ser movido para outra faixa etária
 */
export function shouldUpdateAgeGroup(currentGroup: string, birthDate: Date): boolean {
  const calculatedGroup = calculateAgeGroup(birthDate);
  return currentGroup !== calculatedGroup;
}

/**
 * Formata CPF/CNPJ removendo pontuação
 */
export function cleanDocument(doc: string): string {
  return doc.replace(/\D/g, '');
}
