/**
 * Examples for tools lesson
 * Demonstrates tool creation, execution, and management
 */

import { z } from "zod";
import {
  ToolBuilder,
  ToolService,
  ToolExecutor
} from "../core/index.js";
import { TOOL_CATEGORIES } from "../config/index.js";

/**
 * Demonstrate basic tool creation
 */
export async function demonstrateBasicTools(): Promise<void> {
  console.log("\n🔧 Basic Tools Demo");
  console.log("=".repeat(50));

  try {
    // Create a simple calculator tool
    const calculator = ToolBuilder.createCalculatorTool();

    console.log("\n➕ Calculator Tool:");
    console.log(`  Name: ${calculator.name}`);
    console.log(`  Description: ${calculator.description}`);

    // Execute the tool
    const result = await calculator.invoke({ expression: "2 + 2 * 3" });
    console.log(`  Result: ${result}`);

    // Create a weather tool
    const weather = ToolBuilder.createWeatherTool(async (city) => {
      return `The weather in ${city} is sunny, 72°F`;
    });

    console.log("\n🌤️  Weather Tool:");
    console.log(`  Name: ${weather.name}`);

    const weatherResult = await weather.invoke({ city: "San Francisco" });
    console.log(`  Result: ${weatherResult}`);

  } catch (error) {
    console.error("❌ Basic tools demo failed:", error);
  }
}

/**
 * Demonstrate custom tool creation
 */
export async function demonstrateCustomTools(): Promise<void> {
  console.log("\n⚙️  Custom Tools Demo");
  console.log("=".repeat(50));

  try {
    // Create a custom search tool
    const searchTool = ToolBuilder.createTool({
      name: "search_products",
      description: "Search for products in the catalog",
      schema: z.object({
        query: z.string(),
        category: z.string().optional(),
        maxPrice: z.number().optional()
      }),
      func: async ({ query, category, maxPrice }) => {
        // Simulate database search
        const products = [
          { name: "Laptop", category: "Electronics", price: 999 },
          { name: "Mouse", category: "Electronics", price: 29 },
          { name: "Desk", category: "Furniture", price: 399 }
        ];

        let filtered = products.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase())
        );

        if (category) {
          filtered = filtered.filter(p => p.category === category);
        }

        if (maxPrice) {
          filtered = filtered.filter(p => p.price <= maxPrice);
        }

        return JSON.stringify(filtered);
      }
    });

    console.log("\n🔍 Search Tool:");
    const result = await searchTool.invoke({
      query: "laptop",
      maxPrice: 1000
    });
    console.log(`  Results: ${result}`);

  } catch (error) {
    console.error("❌ Custom tools demo failed:", error);
  }
}

/**
 * Demonstrate tool with context access
 */
export async function demonstrateContextTools(): Promise<void> {
  console.log("\n👤 Context Tools Demo");
  console.log("=".repeat(50));

  try {
    // Create tool that accesses context
    const getUserInfo = ToolBuilder.createContextTool({
      name: "get_user_info",
      description: "Get information about the current user",
      schema: z.object({
        field: z.string().optional()
      }),
      func: (args, config) => {
        const context = config?.context || {};
        const field = args.field;

        if (field) {
          return context[field] || `Field '${field}' not found`;
        }

        return JSON.stringify(context);
      },
      requiresContext: false
    });

    console.log("\n👤 User Info Tool (with context):");
    const result1 = await getUserInfo.invoke(
      {},
      {
        context: {
          user_id: "123",
          user_name: "Alice",
          user_email: "alice@example.com"
        }
      }
    );
    console.log(`  Result: ${result1}`);

    console.log("\n👤 User Info Tool (specific field):");
    const result2 = await getUserInfo.invoke(
      { field: "user_name" },
      {
        context: {
          user_id: "123",
          user_name: "Alice"
        }
      }
    );
    console.log(`  Result: ${result2}`);

  } catch (error) {
    console.error("❌ Context tools demo failed:", error);
  }
}

/**
 * Demonstrate tool with streaming
 */
export async function demonstrateStreamingTools(): Promise<void> {
  console.log("\n📡 Streaming Tools Demo");
  console.log("=".repeat(50));

  try {
    const processData = ToolBuilder.createStreamingTool({
      name: "process_data",
      description: "Process data with progress updates",
      schema: z.object({
        items: z.array(z.string())
      }),
      func: async ({ items }, config) => {
        const writer = config?.streamWriter;

        writer?.("Starting data processing...");

        for (let i = 0; i < items.length; i++) {
          writer?.(`Processing item ${i + 1}/${items.length}: ${items[i]}`);
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        writer?.("Processing complete!");

        return `Processed ${items.length} items successfully`;
      }
    });

    console.log("\n📊 Processing Tool:");

    const updates: string[] = [];
    const result = await processData.invoke(
      { items: ["item1", "item2", "item3"] },
      {
        streamWriter: (msg: string) => {
          console.log(`  📢 ${msg}`);
          updates.push(msg);
        }
      } as any // Type assertion needed for custom config
    );

    console.log(`  Final Result: ${result}`);
    console.log(`  Total updates: ${updates.length}`);

  } catch (error) {
    console.error("❌ Streaming tools demo failed:", error);
  }
}

/**
 * Demonstrate tool service and registry
 */
export async function demonstrateToolService(): Promise<void> {
  console.log("\n📚 Tool Service Demo");
  console.log("=".repeat(50));

  try {
    const service = new ToolService();

    // Create and register tools
    const calculator = ToolBuilder.createCalculatorTool();
    const weather = ToolBuilder.createWeatherTool(async (city) =>
      `Sunny in ${city}`
    );

    service.registerTool(calculator, {
      category: TOOL_CATEGORIES.COMPUTATION,
      tags: ["math", "calculator"]
    });

    service.registerTool(weather, {
      category: TOOL_CATEGORIES.WEATHER,
      tags: ["weather", "external"]
    });

    console.log("\n📋 Registered Tools:");
    console.log(`  Total tools: ${service.getToolCount()}`);

    const allTools = service.getAllTools();
    allTools.forEach(tool => {
      console.log(`  - ${tool.name} (${tool.category})`);
    });

    console.log("\n🔍 Search Tools:");
    const mathTools = service.searchTools("calc");
    console.log(`  Found ${mathTools.length} tools matching 'calc'`);

    console.log("\n🏷️  Tools by Category:");
    const compTools = service.getToolsByCategory(TOOL_CATEGORIES.COMPUTATION);
    console.log(`  Computation: ${compTools.length}`);

  } catch (error) {
    console.error("❌ Tool service demo failed:", error);
  }
}

/**
 * Demonstrate tool execution and error handling
 */
export async function demonstrateToolExecution(): Promise<void> {
  console.log("\n⚡ Tool Execution Demo");
  console.log("=".repeat(50));

  try {
    const executor = new ToolExecutor();

    // Create a tool that might fail
    const riskyTool = ToolBuilder.createTool({
      name: "risky_operation",
      description: "Operation that might fail",
      schema: z.object({
        shouldFail: z.boolean()
      }),
      func: async ({ shouldFail }) => {
        if (shouldFail) {
          throw new Error("Operation failed!");
        }
        return "Operation succeeded!";
      }
    });

    console.log("\n✅ Successful execution:");
    const success = await executor.executeTool(
      riskyTool,
      { shouldFail: false }
    );
    console.log(`  Status: ${success.success ? "SUCCESS" : "FAILED"}`);
    console.log(`  Result: ${success.result}`);
    console.log(`  Time: ${success.executionTime}ms`);

    console.log("\n❌ Failed execution:");
    const failure = await executor.executeTool(
      riskyTool,
      { shouldFail: true }
    );
    console.log(`  Status: ${failure.success ? "SUCCESS" : "FAILED"}`);
    console.log(`  Error: ${failure.error}`);

    console.log("\n🔄 With retry:");
    const withRetry = await executor.executeTool(
      riskyTool,
      { shouldFail: true },
      undefined,
      { retries: 2, retryDelay: 100 }
    );
    console.log(`  Final status: ${withRetry.success ? "SUCCESS" : "FAILED"}`);

  } catch (error) {
    console.error("❌ Tool execution demo failed:", error);
  }
}

/**
 * Demonstrate parallel tool execution
 */
export async function demonstrateParallelExecution(): Promise<void> {
  console.log("\n🚀 Parallel Execution Demo");
  console.log("=".repeat(50));

  try {
    const executor = new ToolExecutor();

    // Create multiple tools
    const tool1 = ToolBuilder.createTool({
      name: "task1",
      description: "First task",
      schema: z.object({}),
      func: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return "Task 1 complete";
      }
    });

    const tool2 = ToolBuilder.createTool({
      name: "task2",
      description: "Second task",
      schema: z.object({}),
      func: async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return "Task 2 complete";
      }
    });

    const tool3 = ToolBuilder.createTool({
      name: "task3",
      description: "Third task",
      schema: z.object({}),
      func: async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return "Task 3 complete";
      }
    });

    console.log("\n⏱️  Sequential execution:");
    const startSeq = Date.now();
    await executor.executeToolsSequential([
      { tool: tool1, args: {} },
      { tool: tool2, args: {} },
      { tool: tool3, args: {} }
    ]);
    const seqTime = Date.now() - startSeq;
    console.log(`  Total time: ${seqTime}ms`);

    console.log("\n⚡ Parallel execution:");
    const startPar = Date.now();
    const results = await executor.executeTools([
      { tool: tool1, args: {} },
      { tool: tool2, args: {} },
      { tool: tool3, args: {} }
    ]);
    const parTime = Date.now() - startPar;
    console.log(`  Total time: ${parTime}ms`);
    console.log(`  Speedup: ${(seqTime / parTime).toFixed(2)}x`);
    console.log(`  All succeeded: ${results.every(r => r.success)}`);

  } catch (error) {
    console.error("❌ Parallel execution demo failed:", error);
  }
}

/**
 * Demonstrate tool validation
 */
export async function demonstrateToolValidation(): Promise<void> {
  console.log("\n✅ Tool Validation Demo");
  console.log("=".repeat(50));

  try {
    // Create validated tool
    const validatedTool = ToolBuilder.createValidatedTool({
      name: "create_user",
      description: "Create a new user",
      schema: z.object({
        username: z.string(),
        email: z.string().email(),
        age: z.number()
      }),
      func: async ({ username, email, age }) => {
        return `User ${username} created with email ${email}, age ${age}`;
      },
      validator: (args) => {
        if (args.age < 18) {
          return "User must be 18 or older";
        }
        if (args.username.length < 3) {
          return "Username must be at least 3 characters";
        }
        return true;
      }
    });

    console.log("\n✅ Valid input:");
    const valid = await validatedTool.invoke({
      username: "alice",
      email: "alice@example.com",
      age: 25
    });
    console.log(`  Result: ${valid}`);

    console.log("\n❌ Invalid input (age < 18):");
    try {
      await validatedTool.invoke({
        username: "bob",
        email: "bob@example.com",
        age: 16
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  Error: ${message}`);
    }

  } catch (error) {
    console.error("❌ Tool validation demo failed:", error);
  }
}

/**
 * Demonstrate execution statistics
 */
export async function demonstrateExecutionStats(): Promise<void> {
  console.log("\n📊 Execution Statistics Demo");
  console.log("=".repeat(50));

  try {
    const executor = new ToolExecutor();

    const testTool = ToolBuilder.createTool({
      name: "test_tool",
      description: "Test tool",
      schema: z.object({
        shouldFail: z.boolean().optional()
      }),
      func: async ({ shouldFail = false }) => {
        if (shouldFail) throw new Error("Failed");
        return "Success";
      }
    });

    // Execute multiple times
    await executor.executeTool(testTool, { shouldFail: false });
    await executor.executeTool(testTool, { shouldFail: false });
    await executor.executeTool(testTool, { shouldFail: true });
    await executor.executeTool(testTool, { shouldFail: false });

    const stats = executor.getStatistics();

    console.log("\n📈 Statistics:");
    console.log(`  Total executions: ${stats.totalExecutions}`);
    console.log(`  Successful: ${stats.successCount}`);
    console.log(`  Failed: ${stats.failureCount}`);
    console.log(`  Average time: ${stats.averageExecutionTime.toFixed(2)}ms`);

    console.log("\n🔧 By Tool:");
    Object.entries(stats.byTool).forEach(([name, data]) => {
      console.log(`  ${name}:`);
      console.log(`    Executions: ${data.count}`);
      console.log(`    Success rate: ${(data.successRate * 100).toFixed(1)}%`);
    });

  } catch (error) {
    console.error("❌ Execution stats demo failed:", error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log("🚀 Tools Lesson Examples");
  console.log("=".repeat(60));

  const examples = [
    demonstrateBasicTools,
    demonstrateCustomTools,
    demonstrateContextTools,
    demonstrateStreamingTools,
    demonstrateToolService,
    demonstrateToolExecution,
    demonstrateParallelExecution,
    demonstrateToolValidation,
    demonstrateExecutionStats
  ];

  for (const example of examples) {
    try {
      await example();
      console.log("\n" + "─".repeat(60));
    } catch (error) {
      console.error("Example failed:", error);
      console.log("\n" + "─".repeat(60));
    }
  }

  console.log("\n✅ All examples completed!");
}

// Run all examples if executed directly
if (import.meta.main) {
  runAllExamples().catch(console.error);
}
