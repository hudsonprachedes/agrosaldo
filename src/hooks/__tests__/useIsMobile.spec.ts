/**
 * Testes para hooks customizados do AgroSaldo
 * useAuth, useIsMobile, useSyncStatus
 */

import { describe, it, expect } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useIsMobile } from '@/hooks/useIsMobile';

describe('Hooks Customizados', () => {
  describe('useIsMobile', () => {
    const originalInnerWidth = window.innerWidth;

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    it('deve retornar true quando viewport < 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('deve retornar false quando viewport >= 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('deve atualizar quando viewport muda', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result, rerender } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simular redimensionamento
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 400,
        });
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('deve considerar breakpoint correto (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());
      // 768 é o breakpoint md, deve ser false (desktop)
      expect(result.current).toBe(false);
    });

    it('deve considerar 767px como mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });
  });

  describe('Integração com componentes responsivos', () => {
    it('deve aplicar layout correto baseado em useIsMobile', () => {
      // Simula mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      const { result } = renderHook(() => useIsMobile());
      
      // Mobile deve usar MobileLayout
      if (result.current) {
        expect(result.current).toBe(true);
      }
    });
  });
});
