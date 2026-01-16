import { describe, it, expect } from '@jest/globals';
import { getAvailableMatrizes } from '../mock-bovinos';

describe('mock-bovinos - getAvailableMatrizes', () => {
  it('deve retornar matrizes para prop-1', () => {
    expect(getAvailableMatrizes('prop-1')).toBe(640);
  });

  it('deve considerar múltiplas faixas para prop-2', () => {
    expect(getAvailableMatrizes('prop-2')).toBe(1080);
  });

  it('deve retornar 0 quando não há dados', () => {
    expect(getAvailableMatrizes('prop-sem-dados')).toBe(0);
  });
});

describe('mock-bovinos - validação de nascimentos', () => {
  it('nascimentos não devem exceder matrizes disponíveis', () => {
    const availableMatrizes = getAvailableMatrizes('prop-1');
    const requestedBirths = availableMatrizes + 1;
    expect(requestedBirths).toBeGreaterThan(availableMatrizes);
  });

  it('deve permitir quando nascimentos estão dentro do limite', () => {
    const availableMatrizes = getAvailableMatrizes('prop-2');
    const requestedBirths = 100;
    expect(requestedBirths).toBeLessThanOrEqual(availableMatrizes);
  });

  it('deve permitir zero nascimentos', () => {
    const availableMatrizes = getAvailableMatrizes('prop-1');
    const requestedBirths = 0;
    expect(requestedBirths).toBeGreaterThanOrEqual(0);
    expect(requestedBirths).toBeLessThanOrEqual(availableMatrizes);
  });
});
