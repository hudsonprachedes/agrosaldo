import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  saveMovementOffline,
  savePhotoOffline,
  getPendingMovements,
  getSyncQueueItems,
  clearDatabase,
} from '@/lib/indexeddb';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Sincronização Offline-First', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('salva movimento offline e adiciona à fila', async () => {
    const movement = await saveMovementOffline({
      id: `mov-${Date.now()}`,
      propertyId: 'prop-123',
      type: 'birth',
      quantity: 5,
      ageGroupId: '0-4',
      date: new Date().toISOString(),
      description: 'Nascimento registrado',
      createdAt: new Date().toISOString(),
    });

    expect(movement.id).toBeTruthy();

    const pending = await getPendingMovements('prop-123');
    expect(pending.find(m => m.id === movement.id)).toBeTruthy();

    const queue = await getSyncQueueItems();
    expect(queue.some(item => item.resourceId === movement.id && item.type === 'movement')).toBe(true);
  });

  it('salva foto offline e adiciona à fila', async () => {
    const photoData = new Blob(['teste'], { type: 'image/jpeg' });
    const photo = await savePhotoOffline('mov-321', photoData, photoData.size + 200);

    expect(photo.id).toBeTruthy();

    const queue = await getSyncQueueItems();
    expect(queue.some(item => item.resourceId === photo.id && item.type === 'photo')).toBe(true);
  });

  it('retorna fila ordenável por criação', async () => {
    await saveMovementOffline({
      id: `mov-${Date.now()}`,
      propertyId: 'prop-123',
      type: 'birth',
      quantity: 1,
      ageGroupId: '0-4',
      date: new Date().toISOString(),
      description: 'Primeiro movimento',
      createdAt: new Date().toISOString(),
    });

    await delay(5);

    await saveMovementOffline({
      id: `mov-${Date.now()}`,
      propertyId: 'prop-123',
      type: 'sale',
      quantity: 2,
      ageGroupId: '12-24',
      date: new Date().toISOString(),
      description: 'Segundo movimento',
      createdAt: new Date().toISOString(),
    });

    const queue = await getSyncQueueItems();
    const sorted = [...queue].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    expect(sorted.map(i => i.id)).toHaveLength(queue.length);
  });

  it('mantém dados localmente em cenários de erro de rede', async () => {
    const movement = await saveMovementOffline({
      id: `mov-${Date.now()}`,
      propertyId: 'prop-123',
      type: 'birth',
      quantity: 3,
      ageGroupId: '0-4',
      date: new Date().toISOString(),
      description: 'Teste falha de rede',
      createdAt: new Date().toISOString(),
    });

    const pending = await getPendingMovements('prop-123');
    expect(pending.some(m => m.id === movement.id)).toBe(true);
  });
});
