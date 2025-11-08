/**
 * Global type definitions for Bun test
 */

declare global {
  function describe(name: string, fn: () => void): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function expect<T>(actual: T): BunExpect<T>;
  function beforeAll(fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;

  interface BunExpect<T> {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(expected: any): void;
    toHaveLength(expected: number): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeInstanceOf(expected: any): void;
    toThrow(expected?: string | RegExp): void;
    toHaveProperty(property: string, value?: any): void;
    toMatchObject(expected: any): void;
    toBeCloseTo(expected: number, precision?: number): void;
    not: BunExpect<T>;
  }
}

export {};
