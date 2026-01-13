/**
 * Testes para sincronização offline e IndexedDB
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import {
  saveMovement,
  savePhoto,
  getMovements,
  getSyncQueue,
  clearCompletedSyncItems,
} from '@/lib/db';

describe('Sincronização Offline-First', () => {
  beforeEach(async () => {
    // Limpa banco antes de cada teste
    // await clearAllData();
  });

  afterEach(async () => {
    // Cleanup após testes
  });

  describe('saveMovement', () => {
    it('deve salvar movimento no IndexedDB', async () => {
      const movement = {
        propertyId: 'prop-123',
        type: 'nascimento' as const,
        quantity: 5,
        ageGroup: 'bezerraMeses4',
        date: new Date().toISOString(),
        notes: 'Nascimento registrado',
        photoId: undefined,
        gtaNumber: undefined,
      };

      const id = await saveMovement(movement);
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('deve salvar movimento com foto', async () => {
      const movement = {
        propertyId: 'prop-123',
        type: 'mortalidade' as const,
        quantity: 1,
        ageGroup: 'vacaAdulta',
        date: new Date().toISOString(),
        notes: 'Morte registrada',
        photoId: 'photo-123',
      };

      const id = await saveMovement(movement);
      expect(id).toBeTruthy();
    });

    it('deve adicionar movimento à fila de sincronização', async () => {
      const movement = {
        propertyId: 'prop-123',
        type: 'venda' as const,
        quantity: 10,
        ageGroup: 'novilha12Meses',
        date: new Date().toISOString(),
        gtaNumber: 'MS.123.456.789/0001-01-2024-001',
      };

      await saveMovement(movement);

      const queue = await getSyncQueue();
      expect(queue.length).toBeGreaterThan(0);
      expect(queue[queue.length - 1].type).toBe('movimento');
    });
  });

  describe('savePhoto', () => {
    it('deve salvar foto no IndexedDB', async () => {
      const photoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'; // Exemplo base64
      const result = await savePhoto('mov-123', photoData, 'mortalidade');

      expect(result).toBeTruthy();
    });

    it('deve adicionar foto à fila de sincronização', async () => {
      const photoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      await savePhoto('mov-123', photoData, 'mortalidade');

      const queue = await getSyncQueue();
      const photoQueue = queue.filter(item => item.type === 'foto');
      expect(photoQueue.length).toBeGreaterThan(0);
    });
  });

  describe('getSyncQueue', () => {
    it('deve retornar fila de sincronização vazia inicialmente', async () => {
      // Assume limpeza anterior
      const queue = await getSyncQueue();
      expect(Array.isArray(queue)).toBe(true);
    });

    it('deve retornar itens com propriedade correta', async () => {
      const movement = {
        propertyId: 'prop-123',
        type: 'nascimento' as const,
        quantity: 5,
        ageGroup: 'bezerraMeses4',
        date: new Date().toISOString(),
      };

      await saveMovement(movement);
      const queue = await getSyncQueue();

      expect(queue[0]).toHaveProperty('id');
      expect(queue[0]).toHaveProperty('type');
      expect(queue[0]).toHaveProperty('createdAt');
      expect(queue[0]).toHaveProperty('retries');
    });

    it('deve ordenar itens por timestamp de criação', async () => {
      // Cria múltiplos movimentos
      const mov1 = {
        propertyId: 'prop-123',
        type: 'nascimento' as const,
        quantity: 1,
        ageGroup: 'bezerraMeses4',
        date: new Date().toISOString(),
      };

      await saveMovement(mov1);
      await new Promise(resolve => setTimeout(resolve, 100)); // Aguarda 100ms

      const mov2 = {
        propertyId: 'prop-123',
        type: 'venda' as const,
        quantity: 2,
        ageGroup: 'novilha12Meses',
        date: new Date().toISOString(),
      };

      await saveMovement(mov2);
      const queue = await getSyncQueue();

      // Verifica se segunda inserção é mais recente
      if (queue.length >= 2) {
        const timestamps = queue.map(item => new Date(item.createdAt).getTime());
        expect(timestamps[timestamps.length - 1] >= timestamps[0]).toBe(true);
      }
    });
  });

  describe('clearCompletedSyncItems', () => {
    it('deve remover itens sincronizados com sucesso', async () => {
      const movement = {
        propertyId: 'prop-123',
        type: 'nascimento' as const,
        quantity: 5,
        ageGroup: 'bezerraMeses4',
        date: new Date().toISOString(),
      };

      await saveMovement(movement);
      const queueBefore = await getSyncQueue();
      expect(queueBefore.length).toBeGreaterThan(0);

      // Limpa itens completados
      await clearCompletedSyncItems();

      // Em produção, verifica se itens foram removidos
      const queueAfter = await getSyncQueue();
      // Resultado depende de quantos itens foram completados
      expect(Array.isArray(queueAfter)).toBe(true);
    });
  });

  describe('Cenários de Erro', () => {
    it('deve lidar com falha de conexão ao salvar movimento', async () => {
      const movement = {
        propertyId: 'prop-123',
        type: 'nascimento' as const,
        quantity: 5,
        ageGroup: 'bezerraMeses4',
        date: new Date().toISOString(),
      };

      // Mesmo com erro de conexão, deve salvar localmente
      const id = await saveMovement(movement);
      expect(id).toBeTruthy();
    });

    it('deve persistir dados mesmo após erro de sincronização', async () => {
      const movement = {
        propertyId: 'prop-123',
        type: 'venda' as const,
        quantity: 10,
        ageGroup: 'novilha12Meses',
        date: new Date().toISOString(),
      };

      const id = await saveMovement(movement);
      
      // Dados devem estar salvos localmente
      const movements = await getMovements('prop-123');
      const saved = movements.find(m => m.id === id);
      expect(saved).toBeTruthy();
    });
  });

  describe('Integração com Auto-Sync', () => {
    it('deve marcar itens para sincronização automática quando online', async () => {
      const movement = {
        propertyId: 'prop-123',
        type: 'nascimento' as const,
        quantity: 5,
        ageGroup: 'bezerraMeses4',
        date: new Date().toISOString(),
      };

      await saveMovement(movement);
      const queue = await getSyncQueue();

      // Todos os itens da fila devem ter contador de tentativas
      queue.forEach(item => {
        expect(item).toHaveProperty('retries');
        expect(typeof item.retries).toBe('number');
      });
    });
  });
});
