import { describe, it, expect } from 'vitest';
import { LEVELS, LEVEL_LABELS, isValidLevel } from '../levels';

describe('levels', () => {
  describe('LEVELS constants', () => {
    it('has the correct numeric values', () => {
      expect(LEVELS.trace).toBe(10);
      expect(LEVELS.debug).toBe(20);
      expect(LEVELS.info).toBe(30);
      expect(LEVELS.warn).toBe(40);
      expect(LEVELS.error).toBe(50);
      expect(LEVELS.fatal).toBe(60);
    });

    it('values increase monotonically from trace to fatal', () => {
      const vals = Object.values(LEVELS) as number[];
      for (let i = 1; i < vals.length; i++) {
        expect(vals[i]).toBeGreaterThan(vals[i - 1]);
      }
    });
  });

  describe('LEVEL_LABELS', () => {
    it('has a 3-character badge for every level', () => {
      for (const [level, label] of Object.entries(LEVEL_LABELS)) {
        expect(label.length, `label for ${level}`).toBe(3);
      }
    });

    it('has badges for all six levels', () => {
      expect(Object.keys(LEVEL_LABELS)).toEqual(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
    });
  });

  describe('isValidLevel', () => {
    it('returns true for known levels', () => {
      expect(isValidLevel('trace')).toBe(true);
      expect(isValidLevel('debug')).toBe(true);
      expect(isValidLevel('info')).toBe(true);
      expect(isValidLevel('warn')).toBe(true);
      expect(isValidLevel('error')).toBe(true);
      expect(isValidLevel('fatal')).toBe(true);
    });

    it('returns false for unknown strings', () => {
      expect(isValidLevel('verbose')).toBe(false);
      expect(isValidLevel('LOG')).toBe(false);
      expect(isValidLevel('')).toBe(false);
    });
  });
});
