import { HerdEvolutionService } from './herd-evolution.service';

describe('HerdEvolutionService', () => {
  const prisma = {} as any;
  const service = new HerdEvolutionService(prisma);

  describe('calculateAgeGroupFromBatch', () => {
    it('mantém 0-4m antes de completar 4 meses', () => {
      const base = new Date('2026-01-20T00:00:00.000Z');
      const ref = new Date('2026-05-19T00:00:00.000Z');
      expect(service.calculateAgeGroupFromBatch('0-4m', base, ref)).toBe(
        '0-4m',
      );
    });

    it('evolui 0-4m -> 5-12m ao completar 4 meses', () => {
      const base = new Date('2026-01-20T00:00:00.000Z');
      const ref = new Date('2026-05-20T00:00:00.000Z');
      expect(service.calculateAgeGroupFromBatch('0-4m', base, ref)).toBe(
        '5-12m',
      );
    });

    it('evolui 0-4m -> 13-24m ao completar 12 meses', () => {
      const base = new Date('2026-01-20T00:00:00.000Z');
      const ref = new Date('2027-01-20T00:00:00.000Z');
      expect(service.calculateAgeGroupFromBatch('0-4m', base, ref)).toBe(
        '13-24m',
      );
    });

    it('mantém 36+m sempre', () => {
      const base = new Date('2026-01-20T00:00:00.000Z');
      const ref = new Date('2030-01-20T00:00:00.000Z');
      expect(service.calculateAgeGroupFromBatch('36+m', base, ref)).toBe(
        '36+m',
      );
    });

    it('normaliza faixa inicial sem sufixo m', () => {
      const base = new Date('2026-01-20T00:00:00.000Z');
      const ref = new Date('2026-05-20T00:00:00.000Z');
      expect(service.calculateAgeGroupFromBatch('0-4', base, ref)).toBe(
        '5-12m',
      );
    });
  });
});
