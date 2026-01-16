/**
 * Sistema de Migração Automática de Faixas Etárias
 * 
 * Responsável por mover animais automaticamente entre faixas etárias
 * baseado na data de nascimento. Executa diariamente quando o app abre
 * ou pode ser acionado manualmente.
 * 
 * Regras:
 * - 0-4 meses: 0 a 4 meses
 * - 5-12 meses: 5 a 12 meses  
 * - 12-24 meses: 12 a 24 meses
 * - 24-36 meses: 24 a 36 meses
 * - 36+ meses: acima de 36 meses
 */

import { calculateAgeGroup } from './utils';

export interface MovementRecord {
  id: string;
  propertyId: string;
  type: 'birth' | string;
  date: string;
  quantity: number;
  sex?: 'male' | 'female';
  ageGroupId?: string;
  birthDate?: string;
  description?: string;
}

export interface CattleBalanceGroup {
  previousBalance: number;
  entries: number;
  exits: number;
  currentBalance: number;
}

export interface CattleBalance {
  ageGroupId: string;
  male: CattleBalanceGroup;
  female: CattleBalanceGroup;
}

export interface AgeGroupMigrationResult {
  migratedCount: number;
  details: Array<{
    movementId: string;
    fromAgeGroup: string;
    toAgeGroup: string;
    ageInMonths: number;
    quantity: number;
  }>;
  timestamp: Date;
}

/**
 * Valida e migra movimentos para a faixa etária correta
 * @param movements - Array de movimentos de nascimento com birthDate
 * @returns Objeto com detalhes das migrações realizadas
 */
export function migrateMovementsBetweenAgeGroups(
  movements: MovementRecord[]
): AgeGroupMigrationResult {
  const result: AgeGroupMigrationResult = {
    migratedCount: 0,
    details: [],
    timestamp: new Date(),
  };

  for (const movement of movements) {
    // Apenas processar nascimentos com birthDate
    if (movement.type !== 'birth' || !movement.birthDate) {
      continue;
    }

    try {
      const birthDate = new Date(movement.birthDate);
      const currentAgeGroup = calculateAgeGroup(birthDate);
      const previousAgeGroup = movement.ageGroupId || '0-4';

      // Se mudou de faixa, registrar migração
      if (currentAgeGroup !== previousAgeGroup) {
        result.details.push({
          movementId: movement.id,
          fromAgeGroup: previousAgeGroup,
          toAgeGroup: currentAgeGroup,
          ageInMonths: calculateAgeInMonths(birthDate),
          quantity: movement.quantity,
        });
        result.migratedCount++;
      }
    } catch (error) {
      console.error(`Erro ao processar movimento ${movement.id}:`, error);
    }
  }

  return result;
}

/**
 * Calcula a idade em meses baseado na data de nascimento
 */
function calculateAgeInMonths(birthDate: Date): number {
  const now = new Date();
  const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + 
                 (now.getMonth() - birthDate.getMonth());
  return months;
}

/**
 * Atualiza balances de rebanho migrando animais entre faixas
 * @param currentBalance - Balance atual
 * @param fromAgeGroup - Faixa de origem
 * @param toAgeGroup - Faixa de destino
 * @param quantity - Quantidade de animais
 * @param sex - Sexo dos animais (male/female)
 */
export function updateBalanceOnAgeGroupChange(
  currentBalance: Record<string, CattleBalance>,
  fromAgeGroup: string,
  toAgeGroup: string,
  quantity: number,
  sex: 'male' | 'female'
): Record<string, CattleBalance> {
  const updatedBalance = { ...currentBalance };

  // Garantir que as faixas existem
  if (!updatedBalance[fromAgeGroup]) {
    updatedBalance[fromAgeGroup] = createEmptyCattleBalance(fromAgeGroup);
  }
  if (!updatedBalance[toAgeGroup]) {
    updatedBalance[toAgeGroup] = createEmptyCattleBalance(toAgeGroup);
  }

  // Saída da faixa de origem
  if (sex === 'male') {
    updatedBalance[fromAgeGroup].male.currentBalance = Math.max(
      0,
      updatedBalance[fromAgeGroup].male.currentBalance - quantity
    );
    updatedBalance[fromAgeGroup].male.exits += quantity;

    // Entrada na faixa de destino
    updatedBalance[toAgeGroup].male.currentBalance += quantity;
    updatedBalance[toAgeGroup].male.entries += quantity;
  } else {
    updatedBalance[fromAgeGroup].female.currentBalance = Math.max(
      0,
      updatedBalance[fromAgeGroup].female.currentBalance - quantity
    );
    updatedBalance[fromAgeGroup].female.exits += quantity;

    // Entrada na faixa de destino
    updatedBalance[toAgeGroup].female.currentBalance += quantity;
    updatedBalance[toAgeGroup].female.entries += quantity;
  }

  return updatedBalance;
}

/**
 * Cria um balance vazio para uma faixa etária
 */
function createEmptyCattleBalance(ageGroupId: string): CattleBalance {
  return {
    ageGroupId,
    male: { previousBalance: 0, entries: 0, exits: 0, currentBalance: 0 },
    female: { previousBalance: 0, entries: 0, exits: 0, currentBalance: 0 },
  };
}

/**
 * Verifica se é necessário rodar migração (uma vez por dia)
 * Usa localStorage para não sobrecarregar o sistema
 */
export function shouldRunMigration(): boolean {
  const lastMigration = localStorage.getItem('agrosaldo_last_age_migration');
  
  if (!lastMigration) {
    return true; // Primeira vez, executar
  }

  const lastDate = new Date(lastMigration);
  const today = new Date();
  
  // Executar apenas uma vez por dia
  return lastDate.toDateString() !== today.toDateString();
}

/**
 * Marca a última execução de migração
 */
export function markMigrationExecuted(): void {
  localStorage.setItem('agrosaldo_last_age_migration', new Date().toISOString());
}

/**
 * Hook-style inicialização: chamar ao abrir o app
 * @param movements - Array de movimentos
 * @param onMigrationComplete - Callback quando migração termina
 */
export async function initializeAgeGroupMigration(
  movements: MovementRecord[],
  onMigrationComplete?: (result: AgeGroupMigrationResult) => void
): Promise<void> {
  try {
    // Verificar se precisa rodar
    if (!shouldRunMigration()) {
      return;
    }

    // Executar migração
    const result = migrateMovementsBetweenAgeGroups(movements);

    if (result.migratedCount > 0) {
      console.log(`✅ Migração de faixas etárias concluída: ${result.migratedCount} animais atualizados`);
      if (onMigrationComplete) {
        onMigrationComplete(result);
      }
    }

    // Marcar como executado
    markMigrationExecuted();
  } catch (error) {
    console.error('❌ Erro durante migração de faixas etárias:', error);
  }
}

/**
 * Gera relatório visual da migração para logging
 */
export function generateMigrationReport(result: AgeGroupMigrationResult): string {
  if (result.migratedCount === 0) {
    return '✅ Nenhuma migração necessária';
  }

  let report = `🐄 Relatório de Migração de Faixas Etárias\n`;
  report += `Data: ${result.timestamp.toLocaleString('pt-BR')}\n`;
  report += `Total de animais migrados: ${result.migratedCount}\n`;
  report += `\nDetalhes:\n`;

  for (const detail of result.details) {
    report += `  • ${detail.quantity} animal(is) - ${detail.fromAgeGroup} → ${detail.toAgeGroup} (idade: ${detail.ageInMonths} meses)\n`;
  }

  return report;
}
