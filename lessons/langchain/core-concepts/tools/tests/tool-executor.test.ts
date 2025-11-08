/**
 * Tests for ToolExecutor
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { z } from "zod";
import { ToolExecutor } from "../core/tool-executor.js";
import { ToolBuilder } from "../core/tool-builder.js";

describe("ToolExecutor", () => {
  let executor: ToolExecutor;

  beforeEach(() => {
    executor = new ToolExecutor();
  });

  describe("executeTool", () => {
    test("should execute tool successfully", async () => {
      const tool = ToolBuilder.createTool({
        name: "test_tool",
        description: "Test",
        schema: z.object({ input: z.string() }),
        func: async ({ input }) => `Result: ${input}`
      });

      const result = await executor.executeTool(tool, { input: "test" });

      expect(result.success).toBe(true);
      expect(result.result).toBe("Result: test");
      expect(result.toolName).toBe("test_tool");
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    test("should handle tool failure", async () => {
      const tool = ToolBuilder.createTool({
        name: "failing_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          throw new Error("Tool failed");
        }
      });

      const result = await executor.executeTool(tool, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("Tool failed");
      expect(result.toolName).toBe("failing_tool");
    });

    test("should measure execution time", async () => {
      const tool = ToolBuilder.createTool({
        name: "slow_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return "done";
        }
      });

      const result = await executor.executeTool(tool, {});

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(50);
    });

    test("should handle timeout", async () => {
      const tool = ToolBuilder.createTool({
        name: "timeout_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return "done";
        }
      });

      const result = await executor.executeTool(
        tool,
        {},
        undefined,
        { timeout: 50 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("timed out");
    });

    test("should pass config to tool", async () => {
      const tool = ToolBuilder.createContextTool({
        name: "config_tool",
        description: "Test",
        schema: z.object({}),
        func: (args, config) => {
          return config?.context?.value || "no value";
        },
        requiresContext: false
      });

      const result = await executor.executeTool(
        tool,
        {},
        { context: { value: "test123" } }
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe("test123");
    });

    test("should retry on failure", async () => {
      let attempts = 0;

      const tool = ToolBuilder.createTool({
        name: "retry_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Retry me");
          }
          return "success";
        }
      });

      const result = await executor.executeTool(
        tool,
        {},
        undefined,
        { retries: 3, retryDelay: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe("success");
      expect(attempts).toBe(3);
    });

    test("should fail after max retries", async () => {
      let attempts = 0;

      const tool = ToolBuilder.createTool({
        name: "always_fail",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          attempts++;
          throw new Error("Always fails");
        }
      });

      const result = await executor.executeTool(
        tool,
        {},
        undefined,
        { retries: 2, retryDelay: 10 }
      );

      expect(result.success).toBe(false);
      expect(attempts).toBe(3); // Initial + 2 retries
    });
  });

  describe("executeTools (parallel)", () => {
    test("should execute multiple tools in parallel", async () => {
      const tool1 = ToolBuilder.createTool({
        name: "tool1",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return "result1";
        }
      });

      const tool2 = ToolBuilder.createTool({
        name: "tool2",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return "result2";
        }
      });

      const start = Date.now();
      const results = await executor.executeTools([
        { tool: tool1, args: {} },
        { tool: tool2, args: {} }
      ]);
      const duration = Date.now() - start;

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].result).toBe("result1");
      expect(results[1].result).toBe("result2");

      // Should take ~50ms (parallel), not ~100ms (sequential)
      expect(duration).toBeLessThan(100);
    });

    test("should handle mixed success and failure", async () => {
      const successTool = ToolBuilder.createTool({
        name: "success",
        description: "Test",
        schema: z.object({}),
        func: async () => "success"
      });

      const failTool = ToolBuilder.createTool({
        name: "fail",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          throw new Error("Failed");
        }
      });

      const results = await executor.executeTools([
        { tool: successTool, args: {} },
        { tool: failTool, args: {} }
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    test("should pass different configs to each tool", async () => {
      const tool = ToolBuilder.createContextTool({
        name: "context_tool",
        description: "Test",
        schema: z.object({}),
        func: (args, config) => config?.context?.id || "none",
        requiresContext: false
      });

      const results = await executor.executeTools([
        { tool, args: {}, config: { context: { id: "1" } } },
        { tool, args: {}, config: { context: { id: "2" } } }
      ]);

      expect(results[0].result).toBe("1");
      expect(results[1].result).toBe("2");
    });

    test("should respect maxParallel option", async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const tool = ToolBuilder.createTool({
        name: "concurrent_tool",
        description: "Test",
        schema: z.object({ id: z.number() }),
        func: async ({ id }) => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise(resolve => setTimeout(resolve, 50));
          concurrent--;
          return `done-${id}`;
        }
      });

      const toolCalls = Array.from({ length: 5 }, (_, i) => ({
        tool,
        args: { id: i }
      }));

      await executor.executeTools(toolCalls, { maxParallel: 2 });

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe("executeToolsSequential", () => {
    test("should execute tools sequentially", async () => {
      const executionOrder: number[] = [];

      const createTool = (id: number) =>
        ToolBuilder.createTool({
          name: `tool${id}`,
          description: "Test",
          schema: z.object({}),
          func: async () => {
            executionOrder.push(id);
            await new Promise(resolve => setTimeout(resolve, 10));
            return `result${id}`;
          }
        });

      const results = await executor.executeToolsSequential([
        { tool: createTool(1), args: {} },
        { tool: createTool(2), args: {} },
        { tool: createTool(3), args: {} }
      ]);

      expect(results).toHaveLength(3);
      expect(executionOrder).toEqual([1, 2, 3]);
    });

    test("should stop on first failure if configured", async () => {
      const executionOrder: number[] = [];

      const successTool = (id: number) =>
        ToolBuilder.createTool({
          name: `tool${id}`,
          description: "Test",
          schema: z.object({}),
          func: async () => {
            executionOrder.push(id);
            return `result${id}`;
          }
        });

      const failTool = ToolBuilder.createTool({
        name: "fail",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          executionOrder.push(2);
          throw new Error("Failed");
        }
      });

      const results = await executor.executeToolsSequential(
        [
          { tool: successTool(1), args: {} },
          { tool: failTool, args: {} },
          { tool: successTool(3), args: {} }
        ],
        { stopOnError: true }
      );

      expect(results).toHaveLength(2);
      expect(executionOrder).toEqual([1, 2]); // Should not execute tool 3
    });

    test("should continue on failure if configured", async () => {
      const executionOrder: number[] = [];

      const successTool = (id: number) =>
        ToolBuilder.createTool({
          name: `tool${id}`,
          description: "Test",
          schema: z.object({}),
          func: async () => {
            executionOrder.push(id);
            return `result${id}`;
          }
        });

      const failTool = ToolBuilder.createTool({
        name: "fail",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          executionOrder.push(2);
          throw new Error("Failed");
        }
      });

      const results = await executor.executeToolsSequential(
        [
          { tool: successTool(1), args: {} },
          { tool: failTool, args: {} },
          { tool: successTool(3), args: {} }
        ],
        { stopOnError: false }
      );

      expect(results).toHaveLength(3);
      expect(executionOrder).toEqual([1, 2, 3]); // Should execute all
      expect(results[1].success).toBe(false);
    });
  });

  describe("getStatistics", () => {
    test("should track execution statistics", async () => {
      const tool = ToolBuilder.createTool({
        name: "stats_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => "success"
      });

      await executor.executeTool(tool, {});
      await executor.executeTool(tool, {});

      const stats = executor.getStatistics();

      expect(stats.totalExecutions).toBe(2);
      expect(stats.successCount).toBe(2);
      expect(stats.failureCount).toBe(0);
      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });

    test("should track success and failure counts", async () => {
      const successTool = ToolBuilder.createTool({
        name: "success",
        description: "Test",
        schema: z.object({}),
        func: async () => "success"
      });

      const failTool = ToolBuilder.createTool({
        name: "fail",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          throw new Error("Failed");
        }
      });

      await executor.executeTool(successTool, {});
      await executor.executeTool(successTool, {});
      await executor.executeTool(failTool, {});

      const stats = executor.getStatistics();

      expect(stats.totalExecutions).toBe(3);
      expect(stats.successCount).toBe(2);
      expect(stats.failureCount).toBe(1);
    });

    test("should track statistics by tool", async () => {
      const tool1 = ToolBuilder.createTool({
        name: "tool1",
        description: "Test",
        schema: z.object({}),
        func: async () => "success"
      });

      const tool2 = ToolBuilder.createTool({
        name: "tool2",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          throw new Error("Failed");
        }
      });

      await executor.executeTool(tool1, {});
      await executor.executeTool(tool1, {});
      await executor.executeTool(tool2, {});

      const stats = executor.getStatistics();

      expect(stats.byTool.tool1.count).toBe(2);
      expect(stats.byTool.tool1.successRate).toBe(1);
      expect(stats.byTool.tool2.count).toBe(1);
      expect(stats.byTool.tool2.successRate).toBe(0);
    });

    test("should calculate average execution time", async () => {
      const tool = ToolBuilder.createTool({
        name: "timed_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return "done";
        }
      });

      await executor.executeTool(tool, {});
      await executor.executeTool(tool, {});

      const stats = executor.getStatistics();

      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(50);
      expect(stats.byTool.timed_tool.averageTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe("getHistory", () => {
    test("should maintain execution history", async () => {
      const tool = ToolBuilder.createTool({
        name: "history_tool",
        description: "Test",
        schema: z.object({ id: z.number() }),
        func: async ({ id }) => `result-${id}`
      });

      await executor.executeTool(tool, { id: 1 });
      await executor.executeTool(tool, { id: 2 });

      const history = executor.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].args.id).toBe(1);
      expect(history[1].args.id).toBe(2);
    });

    test("should limit history size", async () => {
      const customExecutor = new ToolExecutor(50); // Max 50 entries

      const tool = ToolBuilder.createTool({
        name: "test",
        description: "Test",
        schema: z.object({}),
        func: async () => "success"
      });

      // Execute 60 times
      for (let i = 0; i < 60; i++) {
        await customExecutor.executeTool(tool, {});
      }

      const history = customExecutor.getHistory();

      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe("clearHistory", () => {
    test("should clear execution history", async () => {
      const tool = ToolBuilder.createTool({
        name: "test",
        description: "Test",
        schema: z.object({}),
        func: async () => "success"
      });

      await executor.executeTool(tool, {});
      await executor.executeTool(tool, {});

      expect(executor.getHistory()).toHaveLength(2);

      executor.clearHistory();

      expect(executor.getHistory()).toHaveLength(0);
    });

    test("should reset statistics when clearing history", async () => {
      const tool = ToolBuilder.createTool({
        name: "test",
        description: "Test",
        schema: z.object({}),
        func: async () => "success"
      });

      await executor.executeTool(tool, {});

      executor.clearHistory();

      const stats = executor.getStatistics();
      expect(stats.totalExecutions).toBe(0);
      expect(stats.successCount).toBe(0);
    });
  });

  describe("edge cases", () => {
    test("should handle tool with no arguments", async () => {
      const tool = ToolBuilder.createTool({
        name: "no_args",
        description: "Test",
        schema: z.object({}),
        func: async () => "success"
      });

      const result = await executor.executeTool(tool, {});

      expect(result.success).toBe(true);
      expect(result.result).toBe("success");
    });

    test("should handle tool returning undefined", async () => {
      const tool = ToolBuilder.createTool({
        name: "undefined_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => undefined
      });

      const result = await executor.executeTool(tool, {});

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
    });

    test("should handle tool returning null", async () => {
      const tool = ToolBuilder.createTool({
        name: "null_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => null
      });

      const result = await executor.executeTool(tool, {});

      expect(result.success).toBe(true);
      expect(result.result).toBe(null);
    });

    test("should handle tool returning objects", async () => {
      const tool = ToolBuilder.createTool({
        name: "object_tool",
        description: "Test",
        schema: z.object({}),
        func: async () => ({ foo: "bar", num: 42 })
      });

      const result = await executor.executeTool(tool, {});

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ foo: "bar", num: 42 });
    });
  });
});
