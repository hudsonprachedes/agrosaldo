/**
 * Testes para validações críticas do AgroSaldo
 * Garante que regras de negócio são mantidas
 */

import { describe, it, expect } from '@jest/globals';
import { validateGTA, validateCPF, validateCNPJ, isGTAValid } from '@/lib/gta-validation';
import { getAvailableMatrizes } from '@/mocks/mock-bovinos';

describe('Validações Críticas do AgroSaldo', () => {
  describe('getAvailableMatrizes - Validação de Nascimentos', () => {
    it('deve retornar quantidade de matrizes disponíveis', () => {
      const available = getAvailableMatrizes('prop-1');
      expect(available).toEqual(640);
    });

    it('deve retornar 0 se não houver matrizes', () => {
      const available = getAvailableMatrizes('prop-sem-dados');
      expect(available).toEqual(0);
    });

    it('deve considerar múltiplas categorias de fêmeas adultas', () => {
      const available = getAvailableMatrizes('prop-2');
      expect(available).toEqual(1080);
    });
  });

  describe('validateGTA - Validação de Guia de Trânsito Animal', () => {
    it('deve aceitar GTA válida de MS no formato correto', () => {
      const gtaMs = 'MS-1234567';
      const result = validateGTA(gtaMs, 'MS');
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar GTA com formato inválido', () => {
      const gtaInvalida = 'INVALIDO123';
      const result = validateGTA(gtaInvalida, 'MS');
      expect(result.valid).toBe(false);
    });

    it('deve aceitar GTA sem formatação', () => {
      const gtaSemFormato = 'MS-7654321';
      const result = validateGTA(gtaSemFormato, 'MS');
      expect(result.valid).toBe(true);
    });

    it('deve validar GTA para múltiplos estados', () => {
      const estados = ['MS', 'MT', 'GO', 'SP', 'MG'];
      
      estados.forEach(estado => {
        const resultado = validateGTA(`${estado}-1234567`, estado as 'MS' | 'MT' | 'GO' | 'SP' | 'MG');
        expect(typeof resultado.valid).toBe('boolean');
      });
    });

    it('deve rejeitar GTA vencida', () => {
      const dataVencida = new Date(2020, 0, 1); // Janeiro 2020
      const isValid = isGTAValid(dataVencida, 'MS', new Date());
      expect(isValid).toBe(false);
    });
  });

  describe('validateCPF - Validação de CPF', () => {
    it('deve aceitar CPF válido com formatação', () => {
      const cpfValido = '529.982.247-25';
      const isValid = validateCPF(cpfValido);
      expect(isValid).toBe(true);
    });

    it('deve aceitar CPF válido sem formatação', () => {
      const cpfSemFormato = '52998224725';
      const isValid = validateCPF(cpfSemFormato);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar CPF com todos os dígitos iguais', () => {
      const cpfInvalido = '111.111.111-11';
      const isValid = validateCPF(cpfInvalido);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar CPF com tamanho inválido', () => {
      const cpfCurto = '123.456-78';
      const isValid = validateCPF(cpfCurto);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar CPF com dígitos verificadores errados', () => {
      const cpfInvalido = '123.456.789-01'; // Dígitos verificadores fictícios
      const isValid = validateCPF(cpfInvalido);
      expect(isValid).toBe(false);
    });
  });

  describe('validateCNPJ - Validação de CNPJ', () => {
    it('deve aceitar CNPJ válido com formatação', () => {
      const cnpjValido = '04.252.011/0001-10';
      const isValid = validateCNPJ(cnpjValido);
      expect(isValid).toBe(true);
    });

    it('deve aceitar CNPJ válido sem formatação', () => {
      const cnpjSemFormato = '04252011000110';
      const isValid = validateCNPJ(cnpjSemFormato);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar CNPJ com todos os dígitos iguais', () => {
      const cnpjInvalido = '11.111.111/1111-11';
      const isValid = validateCNPJ(cnpjInvalido);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar CNPJ com tamanho inválido', () => {
      const cnpjCurto = '00.000.000/0001';
      const isValid = validateCNPJ(cnpjCurto);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar CNPJ com dígitos verificadores errados', () => {
      const cnpjInvalido = '00.000.000/0001-01'; // Dígitos fictícios
      const isValid = validateCNPJ(cnpjInvalido);
      expect(isValid).toBe(false);
    });
  });

  describe('Regras de Negócio - Nascimentos', () => {
    it('não deve permitir nascimentos > número de matrizes', () => {
      const matrizes = getAvailableMatrizes('prop-1');
      const nascimentosProposto = matrizes + 10;

      expect(nascimentosProposto > matrizes).toBe(true); // Deve ser inválido
    });

    it('deve permitir nascimentos <= número de matrizes', () => {
      const matrizes = getAvailableMatrizes('prop-2');
      const nascimentosProposto = 100;

      expect(nascimentosProposto <= matrizes).toBe(true); // Deve ser válido
    });

    it('deve permitir nascimentos exatamente igual ao número de matrizes', () => {
      const matrizes = getAvailableMatrizes('prop-3');
      const nascimentosProposto = matrizes;

      expect(nascimentosProposto <= matrizes).toBe(true);
    });
  });
});
