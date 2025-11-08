/**
 * Tests for ToolService
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { z } from "zod";
import { ToolService } from "../core/tool-service.js";
import { ToolBuilder } from "../core/tool-builder.js";
import { TOOL_CATEGORIES } from "../config/constants.js";
import { AIMessage } from "@langchain/core/messages";

describe("ToolService", () => {
  let service: ToolService;

  beforeEach(() => {
    service = new ToolService();
  });

  describe("registerTool", () => {
    test("should register a tool", () => {
      const tool = ToolBuilder.createTool({
        name: "test_tool",
        description: "Test tool",
        schema: z.object({}),
        func: async () => "result"
      });

      service.registerTool(tool);

      expect(service.hasTool("test_tool")).toBe(true);
      expect(service.getToolCount()).toBe(1);
    });

    test("should register tool with metadata", () => {
      const tool = ToolBuilder.createTool({
        name: "weather_tool",
        description: "Get weather",
        schema: z.object({}),
        func: async () => "sunny"
      });

      service.registerTool(tool, {
        category: TOOL_CATEGORIES.WEATHER,
        tags: ["weather", "external"]
      });

      const registered = service.getTool("weather_tool");

      expect(registered).toBeDefined();
      expect(registered?.category).toBe(TOOL_CATEGORIES.WEATHER);
      expect(registered?.tags).toContain("weather");
    });

    test("should overwrite existing tool with same name", () => {
      const tool1 = ToolBuilder.createTool({
        name: "duplicate",
        description: "First",
        schema: z.object({}),
        func: async () => "first"
      });

      const tool2 = ToolBuilder.createTool({
        name: "duplicate",
        description: "Second",
        schema: z.object({}),
        func: async () => "second"
      });

      service.registerTool(tool1);
      service.registerTool(tool2);

      expect(service.getToolCount()).toBe(1);

      const registered = service.getTool("duplicate");
      expect(registered?.description).toBe("Second");
    });
  });

  describe("registerTools", () => {
    test("should register multiple tools", () => {
      const tools = [
        ToolBuilder.createCalculatorTool(),
        ToolBuilder.createWeatherTool(async () => "sunny"),
        ToolBuilder.createSearchTool(async () => "results")
      ];

      service.registerTools(tools);

      expect(service.getToolCount()).toBe(3);
    });

    test("should register all tools with same category", () => {
      const tools = [
        ToolBuilder.createTool({
          name: "tool1",
          description: "Test",
          schema: z.object({}),
          func: async () => "1"
        }),
        ToolBuilder.createTool({
          name: "tool2",
          description: "Test",
          schema: z.object({}),
          func: async () => "2"
        })
      ];

      service.registerTools(tools, TOOL_CATEGORIES.COMPUTATION);

      const byCategory = service.getToolsByCategory(TOOL_CATEGORIES.COMPUTATION);
      expect(byCategory).toHaveLength(2);
    });
  });

  describe("getTool", () => {
    test("should get registered tool", () => {
      const tool = ToolBuilder.createCalculatorTool();
      service.registerTool(tool);

      const registered = service.getTool("calculator");

      expect(registered).toBeDefined();
      expect(registered?.name).toBe("calculator");
    });

    test("should return undefined for unknown tool", () => {
      const registered = service.getTool("nonexistent");

      expect(registered).toBeUndefined();
    });
  });

  describe("getAllTools", () => {
    test("should return all registered tools", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());
      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"));

      const all = service.getAllTools();

      expect(all).toHaveLength(2);
    });

    test("should return empty array when no tools registered", () => {
      const all = service.getAllTools();

      expect(all).toHaveLength(0);
    });
  });

  describe("getToolsByCategory", () => {
    test("should filter tools by category", () => {
      service.registerTool(ToolBuilder.createCalculatorTool(), {
        category: TOOL_CATEGORIES.COMPUTATION
      });

      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"), {
        category: TOOL_CATEGORIES.WEATHER
      });

      const computationTools = service.getToolsByCategory(
        TOOL_CATEGORIES.COMPUTATION
      );

      expect(computationTools).toHaveLength(1);
      expect(computationTools[0].name).toBe("calculator");
    });

    test("should return empty array for category with no tools", () => {
      const tools = service.getToolsByCategory(TOOL_CATEGORIES.DATABASE);

      expect(tools).toHaveLength(0);
    });
  });

  describe("getToolsByTag", () => {
    test("should filter tools by tag", () => {
      service.registerTool(ToolBuilder.createCalculatorTool(), {
        tags: ["math", "calculation"]
      });

      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"), {
        tags: ["weather", "external"]
      });

      const mathTools = service.getToolsByTag("math");

      expect(mathTools).toHaveLength(1);
      expect(mathTools[0].name).toBe("calculator");
    });

    test("should return empty array for tag with no tools", () => {
      const tools = service.getToolsByTag("nonexistent");

      expect(tools).toHaveLength(0);
    });
  });

  describe("searchTools", () => {
    test("should search tools by name", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());
      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"));

      const results = service.searchTools("calc");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("calculator");
    });

    test("should search tools by description", () => {
      service.registerTool(
        ToolBuilder.createTool({
          name: "special_tool",
          description: "Performs mathematical operations",
          schema: z.object({}),
          func: async () => "result"
        })
      );

      const results = service.searchTools("mathematical");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("special_tool");
    });

    test("should be case insensitive", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());

      const results = service.searchTools("CALC");

      expect(results).toHaveLength(1);
    });

    test("should return empty array when no matches", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());

      const results = service.searchTools("weather");

      expect(results).toHaveLength(0);
    });
  });

  describe("parseToolCalls", () => {
    test("should parse tool calls from AI message", () => {
      const message = new AIMessage({
        content: "I'll help with that",
        tool_calls: [
          {
            id: "call_1",
            name: "calculator",
            args: { expression: "2+2" }
          }
        ]
      });

      const toolCalls = service.parseToolCalls(message);

      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].id).toBe("call_1");
      expect(toolCalls[0].name).toBe("calculator");
      expect(toolCalls[0].args.expression).toBe("2+2");
    });

    test("should handle multiple tool calls", () => {
      const message = new AIMessage({
        content: "Multiple tools",
        tool_calls: [
          { id: "1", name: "tool1", args: { a: 1 } },
          { id: "2", name: "tool2", args: { b: 2 } }
        ]
      });

      const toolCalls = service.parseToolCalls(message);

      expect(toolCalls).toHaveLength(2);
    });

    test("should return empty array for message without tool calls", () => {
      const message = new AIMessage({
        content: "Just a message"
      });

      const toolCalls = service.parseToolCalls(message);

      expect(toolCalls).toHaveLength(0);
    });

    test("should generate ID if missing", () => {
      const message = new AIMessage({
        content: "Test",
        tool_calls: [
          { name: "calculator", args: {} } as any
        ]
      });

      const toolCalls = service.parseToolCalls(message);

      expect(toolCalls[0].id).toBeDefined();
      expect(toolCalls[0].id).toContain("call_");
    });
  });

  describe("executeToolCall", () => {
    test("should execute tool call", async () => {
      const tool = ToolBuilder.createCalculatorTool();
      service.registerTool(tool);

      const result = await service.executeToolCall({
        id: "call_1",
        name: "calculator",
        args: { expression: "2+2" }
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe("2+2 = 4");
    });

    test("should return error for unknown tool", async () => {
      const result = await service.executeToolCall({
        id: "call_1",
        name: "unknown_tool",
        args: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    test("should pass config to tool execution", async () => {
      const tool = ToolBuilder.createContextTool({
        name: "context_tool",
        description: "Test",
        schema: z.object({}),
        func: (args, config) => config?.context?.value || "no value",
        requiresContext: false
      });

      service.registerTool(tool);

      const result = await service.executeToolCall(
        {
          id: "call_1",
          name: "context_tool",
          args: {}
        },
        { context: { value: "test123" } }
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe("test123");
    });
  });

  describe("executeToolCalls", () => {
    test("should execute all tool calls from message", async () => {
      service.registerTool(ToolBuilder.createCalculatorTool());
      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"));

      const message = new AIMessage({
        content: "Multiple calls",
        tool_calls: [
          { id: "1", name: "calculator", args: { expression: "5*5" } },
          { id: "2", name: "get_weather", args: { city: "London" } }
        ]
      });

      const results = await service.executeToolCalls(message);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe("5*5 = 25");
      expect(results[1].success).toBe(true);
    });

    test("should handle mixed success and failure", async () => {
      service.registerTool(ToolBuilder.createCalculatorTool());

      const message = new AIMessage({
        content: "Test",
        tool_calls: [
          { id: "1", name: "calculator", args: { expression: "1+1" } },
          { id: "2", name: "unknown", args: {} }
        ]
      });

      const results = await service.executeToolCalls(message);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe("executeToolCallsParallel", () => {
    test("should execute tool calls in parallel", async () => {
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

      service.registerTool(tool1);
      service.registerTool(tool2);

      const message = new AIMessage({
        content: "Parallel",
        tool_calls: [
          { id: "1", name: "tool1", args: {} },
          { id: "2", name: "tool2", args: {} }
        ]
      });

      const start = Date.now();
      const results = await service.executeToolCallsParallel(message);
      const duration = Date.now() - start;

      expect(results).toHaveLength(2);
      // Should take ~50ms (parallel), not ~100ms (sequential)
      expect(duration).toBeLessThan(100);
    });
  });

  describe("validateToolArgs", () => {
    test("should validate valid arguments", () => {
      const tool = ToolBuilder.createTool({
        name: "test_tool",
        description: "Test",
        schema: z.object({
          name: z.string(),
          age: z.number()
        }),
        func: async () => "result"
      });

      service.registerTool(tool);

      const result = service.validateToolArgs("test_tool", {
        name: "Alice",
        age: 30
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test("should return errors for invalid arguments", () => {
      const tool = ToolBuilder.createTool({
        name: "test_tool",
        description: "Test",
        schema: z.object({
          name: z.string(),
          age: z.number()
        }),
        func: async () => "result"
      });

      service.registerTool(tool);

      const result = service.validateToolArgs("test_tool", {
        name: "Alice",
        age: "thirty" // Should be number
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test("should return error for unknown tool", () => {
      const result = service.validateToolArgs("unknown", {});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tool unknown not found");
    });
  });

  describe("getToolSchema", () => {
    test("should return tool schema", () => {
      const schema = z.object({ input: z.string() });

      const tool = ToolBuilder.createTool({
        name: "test",
        description: "Test",
        schema,
        func: async () => "result"
      });

      service.registerTool(tool);

      const retrievedSchema = service.getToolSchema("test");

      expect(retrievedSchema).toBe(schema);
    });

    test("should return undefined for unknown tool", () => {
      const schema = service.getToolSchema("unknown");

      expect(schema).toBeUndefined();
    });
  });

  describe("getToolsForBinding", () => {
    test("should return tools in binding format", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());
      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"));

      const tools = service.getToolsForBinding();

      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBeDefined();
      expect(tools[1].name).toBeDefined();
    });
  });

  describe("hasTool", () => {
    test("should return true for registered tool", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());

      expect(service.hasTool("calculator")).toBe(true);
    });

    test("should return false for unregistered tool", () => {
      expect(service.hasTool("nonexistent")).toBe(false);
    });
  });

  describe("unregisterTool", () => {
    test("should remove tool from registry", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());

      expect(service.hasTool("calculator")).toBe(true);

      const removed = service.unregisterTool("calculator");

      expect(removed).toBe(true);
      expect(service.hasTool("calculator")).toBe(false);
    });

    test("should return false when removing nonexistent tool", () => {
      const removed = service.unregisterTool("nonexistent");

      expect(removed).toBe(false);
    });
  });

  describe("clearTools", () => {
    test("should remove all tools", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());
      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"));

      expect(service.getToolCount()).toBe(2);

      service.clearTools();

      expect(service.getToolCount()).toBe(0);
    });
  });

  describe("getToolCount", () => {
    test("should return correct count", () => {
      expect(service.getToolCount()).toBe(0);

      service.registerTool(ToolBuilder.createCalculatorTool());
      expect(service.getToolCount()).toBe(1);

      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"));
      expect(service.getToolCount()).toBe(2);
    });
  });

  describe("getExecutionStats", () => {
    test("should return execution statistics", async () => {
      const tool = ToolBuilder.createCalculatorTool();
      service.registerTool(tool);

      await service.executeToolCall({
        id: "1",
        name: "calculator",
        args: { expression: "1+1" }
      });

      const stats = service.getExecutionStats();

      expect(stats.totalExecutions).toBe(1);
      expect(stats.successCount).toBe(1);
    });
  });

  describe("getExecutionHistory", () => {
    test("should return execution history", async () => {
      const tool = ToolBuilder.createCalculatorTool();
      service.registerTool(tool);

      await service.executeToolCall({
        id: "1",
        name: "calculator",
        args: { expression: "2+2" }
      });

      const history = service.getExecutionHistory();

      expect(history).toHaveLength(1);
      expect(history[0].toolName).toBe("calculator");
    });
  });

  describe("clearExecutionHistory", () => {
    test("should clear execution history", async () => {
      const tool = ToolBuilder.createCalculatorTool();
      service.registerTool(tool);

      await service.executeToolCall({
        id: "1",
        name: "calculator",
        args: { expression: "1+1" }
      });

      expect(service.getExecutionHistory()).toHaveLength(1);

      service.clearExecutionHistory();

      expect(service.getExecutionHistory()).toHaveLength(0);
    });
  });

  describe("exportToolDefinitions", () => {
    test("should export tool definitions", () => {
      service.registerTool(ToolBuilder.createCalculatorTool(), {
        category: TOOL_CATEGORIES.COMPUTATION,
        tags: ["math"]
      });

      const definitions = service.exportToolDefinitions();

      expect(definitions).toHaveLength(1);
      expect(definitions[0].name).toBe("calculator");
      expect(definitions[0].description).toBeDefined();
      expect(definitions[0].schema).toBeDefined();
      expect(definitions[0].category).toBe(TOOL_CATEGORIES.COMPUTATION);
      expect(definitions[0].tags).toContain("math");
    });

    test("should not include tool implementation", () => {
      service.registerTool(ToolBuilder.createCalculatorTool());

      const definitions = service.exportToolDefinitions();

      expect(definitions[0]).not.toHaveProperty("tool");
    });
  });

  describe("createCatalog", () => {
    test("should create markdown catalog", () => {
      service.registerTool(ToolBuilder.createCalculatorTool(), {
        category: TOOL_CATEGORIES.COMPUTATION,
        tags: ["math"]
      });

      service.registerTool(ToolBuilder.createWeatherTool(async () => "sunny"), {
        category: TOOL_CATEGORIES.WEATHER,
        tags: ["weather"]
      });

      const catalog = service.createCatalog();

      expect(catalog).toContain("# Tool Catalog");
      expect(catalog).toContain("## computation");
      expect(catalog).toContain("## weather");
      expect(catalog).toContain("### calculator");
      expect(catalog).toContain("### get_weather");
    });

    test("should include tool descriptions in catalog", () => {
      service.registerTool(
        ToolBuilder.createTool({
          name: "special_tool",
          description: "This is a special tool",
          schema: z.object({}),
          func: async () => "result"
        }),
        { category: "Special" }
      );

      const catalog = service.createCatalog();

      expect(catalog).toContain("This is a special tool");
    });

    test("should include tags in catalog", () => {
      service.registerTool(ToolBuilder.createCalculatorTool(), {
        tags: ["math", "calculation", "arithmetic"]
      });

      const catalog = service.createCatalog();

      expect(catalog).toContain("**Tags:**");
      expect(catalog).toContain("math");
      expect(catalog).toContain("calculation");
    });
  });
});
