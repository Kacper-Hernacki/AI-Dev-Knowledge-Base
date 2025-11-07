/**
 * Type definitions for Bun test runner
 * Provides TypeScript support for Bun's testing framework
 */

declare global {
  function describe(name: string, fn: () => void): void;
  function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  function expect<T>(actual: T): expect.Matchers<T>;
  function beforeAll(fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;

  namespace expect {
    interface Matchers<T> {
      toBe(expected: T): void;
      toEqual(expected: T): void;
      toBeTypeOf(expected: string): void;
      toBeInstanceOf(expected: any): void;
      toBeUndefined(): void;
      toBeNull(): void;
      toBeDefined(): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toBeGreaterThan(expected: number): void;
      toBeGreaterThanOrEqual(expected: number): void;
      toBeLessThan(expected: number): void;
      toBeLessThanOrEqual(expected: number): void;
      toContain(expected: any): void;
      toContainEqual(expected: any): void;
      toHaveLength(expected: number): void;
      toHaveProperty(expected: string, value?: any): void;
      toThrow(): void;
      toThrow(expected: string | RegExp): void;
      toThrowError(): void;
      toThrowError(expected: string | RegExp): void;
      not: Matchers<T>;
    }
  }
}

export {};