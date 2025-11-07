// Global test types for Bun test runner
declare global {
  function describe(name: string, fn: () => void): void;
  function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  
  namespace expect {
    interface Matchers<T> {
      toBe(expected: T): void;
      toBeTypeOf(expected: string): void;
      toBeDefined(): void;
      toEqual(expected: T): void;
      toHaveProperty(property: string): void;
      toContain(expected: string): void;
      toThrow(): void;
      toBeGreaterThan(expected: number): void;
      toBeNull(): void;
      not: Matchers<T>;
    }
  }
  
  function expect<T>(actual: T): expect.Matchers<T>;
}

export {};