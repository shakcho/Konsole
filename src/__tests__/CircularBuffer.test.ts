import { describe, it, expect, beforeEach } from 'vitest';
import { CircularBuffer } from '../CircularBuffer';

describe('CircularBuffer', () => {
  let buf: CircularBuffer<number>;

  beforeEach(() => {
    buf = new CircularBuffer<number>(3);
  });

  describe('basics', () => {
    it('starts empty', () => {
      expect(buf.size).toBe(0);
      expect(buf.isEmpty).toBe(true);
      expect(buf.isFull).toBe(false);
      expect(buf.toArray()).toEqual([]);
    });

    it('pushes items and returns them in insertion order', () => {
      buf.push(1);
      buf.push(2);
      buf.push(3);
      expect(buf.toArray()).toEqual([1, 2, 3]);
      expect(buf.size).toBe(3);
      expect(buf.isFull).toBe(true);
    });
  });

  describe('eviction when full', () => {
    it('overwrites oldest item when capacity is exceeded', () => {
      buf.push(1);
      buf.push(2);
      buf.push(3);
      buf.push(4); // evicts 1
      expect(buf.toArray()).toEqual([2, 3, 4]);
      expect(buf.size).toBe(3);
    });

    it('continues evicting correctly over multiple wraps', () => {
      buf.push(1);
      buf.push(2);
      buf.push(3);
      buf.push(4);
      buf.push(5);
      buf.push(6); // evicts 2, 3 → buffer should have [4, 5, 6]
      expect(buf.toArray()).toEqual([4, 5, 6]);
    });
  });

  describe('slice', () => {
    it('returns a subset of items', () => {
      buf.push(10);
      buf.push(20);
      buf.push(30);
      expect(buf.slice(1)).toEqual([20, 30]);
      expect(buf.slice(0, 2)).toEqual([10, 20]);
    });
  });

  describe('filter', () => {
    it('returns only matching items', () => {
      buf.push(1);
      buf.push(2);
      buf.push(3);
      expect(buf.filter((n) => n % 2 === 0)).toEqual([2]);
    });
  });

  describe('retain', () => {
    it('removes items that fail the predicate', () => {
      buf.push(1);
      buf.push(2);
      buf.push(3);
      const newSize = buf.retain((n) => n > 1);
      expect(newSize).toBe(2);
      expect(buf.toArray()).toEqual([2, 3]);
    });

    it('returns 0 when all items are removed', () => {
      buf.push(1);
      const newSize = buf.retain(() => false);
      expect(newSize).toBe(0);
      expect(buf.isEmpty).toBe(true);
    });
  });

  describe('clear', () => {
    it('empties the buffer', () => {
      buf.push(1);
      buf.push(2);
      buf.clear();
      expect(buf.size).toBe(0);
      expect(buf.isEmpty).toBe(true);
      expect(buf.toArray()).toEqual([]);
    });

    it('can push again after clear', () => {
      buf.push(1);
      buf.push(2);
      buf.push(3);
      buf.clear();
      buf.push(99);
      expect(buf.toArray()).toEqual([99]);
    });
  });

  describe('edge cases', () => {
    it('handles capacity of 1', () => {
      const b = new CircularBuffer<string>(1);
      b.push('a');
      expect(b.toArray()).toEqual(['a']);
      b.push('b'); // evicts 'a'
      expect(b.toArray()).toEqual(['b']);
    });

    it('isEmpty and isFull are mutually exclusive', () => {
      expect(buf.isEmpty).toBe(true);
      expect(buf.isFull).toBe(false);
      buf.push(1);
      buf.push(2);
      buf.push(3);
      expect(buf.isEmpty).toBe(false);
      expect(buf.isFull).toBe(true);
    });
  });
});
