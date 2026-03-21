/**
 * A memory-efficient circular buffer for storing logs
 * Automatically evicts oldest entries when capacity is reached
 */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private _size: number = 0;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add an item to the buffer
   * If buffer is full, oldest item is overwritten
   */
  push(item: T): void {
    if (this.capacity === 0) return;
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this._size < this.capacity) {
      this._size++;
    } else {
      // Buffer is full, move head forward (oldest item is overwritten)
      this.head = (this.head + 1) % this.capacity;
    }
  }

  /**
   * Get all items in order (oldest to newest)
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this._size; i++) {
      const index = (this.head + i) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Get a slice of items
   */
  slice(start: number, end?: number): T[] {
    const arr = this.toArray();
    return arr.slice(start, end);
  }

  /**
   * Filter items and return matching ones
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.toArray().filter(predicate);
  }

  /**
   * Remove items that don't match the predicate
   * Returns the new size
   */
  retain(predicate: (item: T) => boolean): number {
    const kept = this.filter(predicate);
    this.clear();
    for (const item of kept) {
      this.push(item);
    }
    return this._size;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }

  /**
   * Current number of items
   */
  get size(): number {
    return this._size;
  }

  /**
   * Check if buffer is empty
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Check if buffer is at capacity
   */
  get isFull(): boolean {
    return this._size === this.capacity;
  }
}

