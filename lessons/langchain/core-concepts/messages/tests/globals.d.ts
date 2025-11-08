/// <reference types="bun-types" />

declare global {
  /**
   * Describe a test suite
   */
  function describe(name: string, fn: () => void): void;

  /**
   * Define a test case
   */
  function test(
    name: string,
    fn: () => void | Promise<void>,
    timeout?: number
  ): void;

  /**
   * Run code before all tests in a describe block
   */
  function beforeAll(fn: () => void | Promise<void>): void;

  /**
   * Run code after all tests in a describe block
   */
  function afterAll(fn: () => void | Promise<void>): void;

  /**
   * Run code before each test in a describe block
   */
  function beforeEach(fn: () => void | Promise<void>): void;

  /**
   * Run code after each test in a describe block
   */
  function afterEach(fn: () => void | Promise<void>): void;

  /**
   * Expect assertions
   */
  namespace expect {
    interface Matchers<T> {
      toBe(expected: T): void;
      toEqual(expected: T): void;
      toBeDefined(): void;
      toBeUndefined(): void;
      toBeNull(): void;
      toBeTypeOf(expected: string): void;
      toHaveProperty(property: string): void;
      toContain(expected: string | any): void;
      toThrow(error?: string | RegExp | Error): void;
      toBeGreaterThan(expected: number): void;
      toBeLessThan(expected: number): void;
      toBeGreaterThanOrEqual(expected: number): void;
      toBeLessThanOrEqual(expected: number): void;
      toBeInstanceOf(expected: any): void;
      toHaveLength(expected: number): void;
      not: Matchers<T>;
    }
  }

  function expect<T>(actual: T): expect.Matchers<T>;
}

export {};
