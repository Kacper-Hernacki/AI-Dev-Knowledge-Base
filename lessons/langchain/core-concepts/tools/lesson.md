# LangChain Tools - Complete Guide

## Table of Contents
1. [Learning Objectives](#learning-objectives)
2. [What are Tools?](#what-are-tools)
3. [Core Concepts](#core-concepts)
4. [Tool Creation](#tool-creation)
5. [Tool Execution](#tool-execution)
6. [Tool Management](#tool-management)
7. [Advanced Features](#advanced-features)
8. [Best Practices](#best-practices)
9. [Production Checklist](#production-checklist)

## Learning Objectives

By the end of this lesson, you will be able to:

- ✅ Understand what tools are and why they're important in LangChain
- ✅ Create custom tools with proper schema validation
- ✅ Execute tools with error handling and retry logic
- ✅ Manage tool registries and catalogs
- ✅ Implement context-aware and stateful tools
- ✅ Handle streaming tool updates
- ✅ Build production-ready tool systems

## What are Tools?

**Tools** are functions that language models can invoke to perform specific tasks, access external data, or interact with systems. They extend the capabilities of LLMs beyond text generation.

### Why Use Tools?

1. **Access Real-time Data**: Fetch current weather, stock prices, or search results
2. **Perform Computations**: Execute calculations, data transformations, or complex logic
3. **Interact with Systems**: Read/write files, query databases, call APIs
4. **Extend Capabilities**: Add functionality that LLMs can't do alone
5. **Maintain State**: Store and retrieve information across conversations

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Tool System                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ToolBuilder   │  │ToolExecutor  │  │ToolService   │  │
│  │              │  │              │  │              │  │
│  │ • Create     │  │ • Execute    │  │ • Register   │  │
│  │ • Validate   │  │ • Retry      │  │ • Search     │  │
│  │ • Schema     │  │ • Timeout    │  │ • Catalog    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Tool Types                            │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ • Basic Tools      • Context Tools                 │  │
│  │ • Memory Tools     • Streaming Tools              │  │
│  │ • Validated Tools  • Custom Tools                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Core Concepts

### 1. Tool Definition

Every tool has three essential components:

```typescript
interface ToolDefinition<T> {
  name: string;              // Unique identifier
  description: string;       // What the tool does
  schema: T;                // Input validation schema
  func: Function;           // Implementation
}
```

### 2. Tool Categories

Tools are organized by category for better management:

```typescript
const TOOL_CATEGORIES = {
  DATA_RETRIEVAL: "data_retrieval",
  COMPUTATION: "computation",
  FILE_OPERATIONS: "file_operations",
  API_CALLS: "api_calls",
  DATABASE: "database",
  WEATHER: "weather",
  USER_INFO: "user_info",
  GENERAL: "general"
};
```

### 3. Tool Configuration

Tools can access configuration for context and state:

```typescript
interface ToolConfig {
  context?: Record<string, any>;  // User context
  store?: MemoryStore;            // Persistent storage
  streamWriter?: (msg: string) => void;  // Streaming updates
}
```

## Tool Creation

### Basic Tool Creation

Create a simple tool using `ToolBuilder`:

```typescript
import { ToolBuilder } from "./core/tool-builder.js";
import { z } from "zod";

// Create a basic tool
const greetTool = ToolBuilder.createTool({
  name: "greet_user",
  description: "Greet a user by name",
  schema: z.object({
    name: z.string(),
    formal: z.boolean().optional()
  }),
  func: async ({ name, formal }) => {
    return formal
      ? `Good day, ${name}. How may I assist you?`
      : `Hey ${name}! What's up?`;
  }
});

// Use the tool
const result = await greetTool.invoke({
  name: "Alice",
  formal: true
});
console.log(result); // "Good day, Alice. How may I assist you?"
```

### Pre-built Tools

LangChain provides several pre-built tool creators:

#### Calculator Tool

```typescript
const calculator = ToolBuilder.createCalculatorTool();

const result = await calculator.invoke({
  expression: "2 + 2 * 3"
});
console.log(result); // "2 + 2 * 3 = 8"
```

#### Weather Tool

```typescript
const weather = ToolBuilder.createWeatherTool(async (city, units) => {
  // Fetch real weather data
  const data = await fetchWeatherAPI(city);
  return `Weather in ${city}: ${data.temp}°${units}`;
});

const result = await weather.invoke({
  city: "London",
  units: "celsius"
});
```

#### Search Tool

```typescript
const search = ToolBuilder.createSearchTool(async (query, limit) => {
  // Perform database or API search
  const results = await searchDatabase(query, limit);
  return results;
});

const results = await search.invoke({
  query: "langchain tools",
  limit: 10
});
```

### Custom Tool with Validation

Create tools with custom validation logic:

```typescript
const createUserTool = ToolBuilder.createValidatedTool({
  name: "create_user",
  description: "Create a new user account",
  schema: z.object({
    username: z.string(),
    email: z.string().email(),
    age: z.number()
  }),
  func: async ({ username, email, age }) => {
    // Create user in database
    const user = await db.users.create({ username, email, age });
    return `User ${username} created successfully`;
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
```

### Context-Aware Tools

Tools that access user context:

```typescript
const getUserInfo = ToolBuilder.createContextTool({
  name: "get_user_preferences",
  description: "Get user preferences from context",
  schema: z.object({
    preference_key: z.string().optional()
  }),
  func: (args, config) => {
    const context = config?.context || {};

    if (args.preference_key) {
      return context.preferences?.[args.preference_key] || "Not set";
    }

    return JSON.stringify(context.preferences || {});
  },
  requiresContext: false
});

// Use with context
const result = await getUserInfo.invoke(
  { preference_key: "theme" },
  {
    context: {
      user_id: "123",
      preferences: {
        theme: "dark",
        language: "en"
      }
    }
  }
);
```

### Memory-Enabled Tools (Store)

Tools can access persistent storage across conversations using LangChain's Store API. The store uses namespaced keys for organization.

**Important:** Tools access the store via **closure** (capturing it from the outer scope), not through `config.store`.

**Store API:**
- `store.get(namespace, key)` - Retrieve a value (returns `{ value, key, namespace, ... }`)
- `store.put(namespace, key, value)` - Store a value
- `store.delete(namespace, key)` - Delete a value
- `store.search(namespace)` - Search items in namespace

```typescript
import { tool } from "@langchain/core/tools";
import { InMemoryStore } from "@langchain/langgraph";

// Create store outside - tools will capture it via closure
const store = new InMemoryStore();

// Save user info to memory
const saveUserInfo = tool(
  async ({ user_id, name, age, email }) => {
    // Store is captured via closure ✅
    await store.put(["users"], user_id, { name, age, email });
    return "Successfully saved user info";
  },
  {
    name: "save_user_info",
    description: "Save user info to memory",
    schema: z.object({
      user_id: z.string(),
      name: z.string(),
      age: z.number(),
      email: z.string()
    })
  }
);

// Get user info from memory
const getUserInfo = tool(
  async ({ user_id }) => {
    // Store is captured via closure ✅
    const item = await store.get(["users"], user_id);

    // InMemoryStore returns { value, key, namespace, createdAt, updatedAt }
    if (!item || !item.value) {
      return `User ${user_id} not found`;
    }

    return JSON.stringify(item.value);
  },
  {
    name: "get_user_info",
    description: "Get user info from memory",
    schema: z.object({
      user_id: z.string()
    })
  }
);

// Use tools - no store in config!
const result = await saveUserInfo.invoke({
  user_id: "abc123",
  name: "Foo",
  age: 25,
  email: "foo@langchain.dev"
});

// Later retrieve the user
const userInfo = await getUserInfo.invoke({ user_id: "abc123" });
```

**Namespaced Storage:**

Use different namespaces to organize data:

```typescript
// Store preferences with namespaces
await store.put(["preferences", "user1"], "theme", "dark");
await store.put(["preferences", "user2"], "theme", "light");

// Store session data
await store.put(["sessions", "session1"], "cart", ["item1", "item2"]);

// Retrieve from specific namespace
const item = await store.get(["preferences", "user1"], "theme");
const theme = item?.value; // Extract the value
```

**Note:** See `examples/memory-store-example.ts` for a complete working example with real `InMemoryStore`.

### Streaming Tools

Tools that provide progress updates:

```typescript
const processLargeFile = ToolBuilder.createStreamingTool({
  name: "process_file",
  description: "Process a large file with progress updates",
  schema: z.object({
    filepath: z.string(),
    operation: z.enum(["count", "transform", "analyze"])
  }),
  func: async ({ filepath, operation }, config) => {
    const writer = config?.streamWriter;

    writer?.(`Starting ${operation} on ${filepath}...`);

    // Simulate processing
    const chunks = 10;
    for (let i = 0; i < chunks; i++) {
      await processChunk(i);
      writer?.(`Progress: ${((i + 1) / chunks * 100).toFixed(0)}%`);
    }

    writer?.("Processing complete!");
    return `File ${filepath} processed successfully`;
  }
});

// Use with streaming
await processLargeFile.invoke(
  { filepath: "/data/large.csv", operation: "analyze" },
  {
    streamWriter: (msg) => {
      console.log(`📢 ${msg}`);
    }
  }
);
```

## Tool Execution

### Basic Execution

The `ToolExecutor` class manages tool execution with error handling:

```typescript
import { ToolExecutor } from "./core/tool-executor.js";

const executor = new ToolExecutor();

// Execute a tool
const result = await executor.executeTool(
  calculator,
  { expression: "10 * 5" }
);

console.log(result);
// {
//   success: true,
//   result: "10 * 5 = 50",
//   executionTime: 2,
//   toolName: "calculator",
//   args: { expression: "10 * 5" }
// }
```

### Error Handling

```typescript
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
    return "Success";
  }
});

// Execute with error handling
const result = await executor.executeTool(
  riskyTool,
  { shouldFail: true }
);

console.log(result);
// {
//   success: false,
//   error: "Operation failed!",
//   executionTime: 1,
//   toolName: "risky_operation",
//   args: { shouldFail: true }
// }
```

### Retry Logic

```typescript
let attempts = 0;

const unreliableTool = ToolBuilder.createTool({
  name: "unreliable",
  description: "Fails first 2 times",
  schema: z.object({}),
  func: async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("Temporary failure");
    }
    return "Success after retries";
  }
});

// Execute with retries
const result = await executor.executeTool(
  unreliableTool,
  {},
  undefined,
  { retries: 3, retryDelay: 100 }
);

console.log(result.success); // true
console.log(result.result);  // "Success after retries"
```

### Timeout Handling

```typescript
const slowTool = ToolBuilder.createTool({
  name: "slow_operation",
  description: "Takes a long time",
  schema: z.object({}),
  func: async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    return "Done";
  }
});

// Execute with timeout
const result = await executor.executeTool(
  slowTool,
  {},
  undefined,
  { timeout: 1000 } // 1 second timeout
);

console.log(result.success); // false
console.log(result.error);   // "Execution timed out after 1000ms"
```

### Parallel Execution

Execute multiple tools concurrently:

```typescript
const results = await executor.executeTools([
  { tool: tool1, args: { input: "A" } },
  { tool: tool2, args: { input: "B" } },
  { tool: tool3, args: { input: "C" } }
]);

console.log(`Executed ${results.length} tools`);
console.log(`Success rate: ${results.filter(r => r.success).length}/${results.length}`);
```

### Sequential Execution

Execute tools one after another:

```typescript
const results = await executor.executeToolsSequential([
  { tool: step1, args: {} },
  { tool: step2, args: {} },
  { tool: step3, args: {} }
], { stopOnError: true });
```

### Execution Statistics

Track tool performance:

```typescript
const stats = executor.getStatistics();

console.log(`Total executions: ${stats.totalExecutions}`);
console.log(`Success rate: ${(stats.successCount / stats.totalExecutions * 100).toFixed(1)}%`);
console.log(`Average time: ${stats.averageExecutionTime.toFixed(2)}ms`);

// Per-tool statistics
Object.entries(stats.byTool).forEach(([name, data]) => {
  console.log(`${name}:`);
  console.log(`  Executions: ${data.count}`);
  console.log(`  Success rate: ${(data.successRate * 100).toFixed(1)}%`);
  console.log(`  Average time: ${data.averageTime.toFixed(2)}ms`);
});
```

## Tool Management

### Tool Registry

The `ToolService` manages tool registration and discovery:

```typescript
import { ToolService, TOOL_CATEGORIES } from "./core/index.js";

const service = new ToolService();

// Register tools
service.registerTool(calculator, {
  category: TOOL_CATEGORIES.COMPUTATION,
  tags: ["math", "calculator"]
});

service.registerTool(weather, {
  category: TOOL_CATEGORIES.WEATHER,
  tags: ["weather", "external", "api"]
});

// Get all tools
const allTools = service.getAllTools();
console.log(`Registered ${allTools.length} tools`);
```

### Finding Tools

```typescript
// Search by name or description
const mathTools = service.searchTools("math");
const calcTools = service.searchTools("calculator");

// Filter by category
const weatherTools = service.getToolsByCategory(TOOL_CATEGORIES.WEATHER);

// Filter by tag
const externalTools = service.getToolsByTag("external");
```

### Tool Validation

```typescript
// Validate arguments before execution
const validation = service.validateToolArgs("calculator", {
  expression: "2+2"
});

if (validation.valid) {
  // Proceed with execution
} else {
  console.error("Validation errors:", validation.errors);
}
```

### Executing from AI Messages

```typescript
import { AIMessage } from "@langchain/core/messages";

const aiMessage = new AIMessage({
  content: "I'll calculate that for you",
  tool_calls: [
    {
      id: "call_1",
      name: "calculator",
      args: { expression: "15 * 7" }
    }
  ]
});

// Parse and execute tool calls
const results = await service.executeToolCalls(aiMessage);
```

### Tool Catalog

Generate documentation for all tools:

```typescript
const catalog = service.createCatalog();

console.log(catalog);
// # Tool Catalog
//
// ## Computation
//
// ### calculator
//
// **Description:** Perform mathematical calculations
//
// **Tags:** math, calculator
//
// **Schema:**
// ```json
// {
//   "expression": "string"
// }
// ```
```

## Advanced Features

### Tool Composition

Combine multiple tools into workflows:

```typescript
const workflow = ToolBuilder.createTool({
  name: "data_pipeline",
  description: "Process data through multiple steps",
  schema: z.object({
    data: z.array(z.any())
  }),
  func: async ({ data }, config) => {
    // Step 1: Validate
    const validation = await validateTool.invoke({ data }, config);

    // Step 2: Transform
    const transformed = await transformTool.invoke({ data }, config);

    // Step 3: Store
    const stored = await storeTool.invoke({ data: transformed }, config);

    return stored;
  }
});
```

### Dynamic Tool Creation

Create tools at runtime based on configuration:

```typescript
function createAPITool(apiName: string, endpoint: string) {
  return ToolBuilder.createTool({
    name: `call_${apiName}`,
    description: `Call the ${apiName} API`,
    schema: z.object({
      params: z.record(z.string(), z.any()).optional()
    }),
    func: async ({ params }) => {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      return response.json();
    }
  });
}

// Create tools for different APIs
const githubTool = createAPITool("github", "https://api.github.com");
const weatherTool = createAPITool("weather", "https://api.weather.com");
```

### Tool Authorization

Implement access control for tools:

```typescript
const protectedTool = ToolBuilder.createContextTool({
  name: "delete_data",
  description: "Delete user data (admin only)",
  schema: z.object({
    user_id: z.string()
  }),
  func: async ({ user_id }, config) => {
    const userRole = config?.context?.user_role;

    if (userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Proceed with deletion
    await deleteUserData(user_id);
    return `User ${user_id} data deleted`;
  },
  requiresContext: true
});
```

### Rate Limiting

Implement rate limiting for tools:

```typescript
const rateLimiter = new Map<string, number[]>();

function createRateLimitedTool(tool: any, maxCalls: number, windowMs: number) {
  return ToolBuilder.createTool({
    name: tool.name,
    description: tool.description,
    schema: tool.schema,
    func: async (args, config) => {
      const now = Date.now();
      const calls = rateLimiter.get(tool.name) || [];

      // Remove old calls outside window
      const recentCalls = calls.filter(t => now - t < windowMs);

      if (recentCalls.length >= maxCalls) {
        throw new Error("Rate limit exceeded");
      }

      recentCalls.push(now);
      rateLimiter.set(tool.name, recentCalls);

      return tool.func(args, config);
    }
  });
}

// Create rate-limited tool: 10 calls per minute
const limited = createRateLimitedTool(apiTool, 10, 60000);
```

## Best Practices

### 1. Tool Naming

Use clear, descriptive names:

```typescript
// Good
const getUserProfile = ToolBuilder.createTool({ ... });
const calculateTaxAmount = ToolBuilder.createTool({ ... });
const searchProducts = ToolBuilder.createTool({ ... });

// Bad
const tool1 = ToolBuilder.createTool({ ... });
const doStuff = ToolBuilder.createTool({ ... });
const x = ToolBuilder.createTool({ ... });
```

### 2. Schema Validation

Always validate inputs:

```typescript
// Good - with validation
const tool = ToolBuilder.createTool({
  name: "send_email",
  description: "Send an email",
  schema: z.object({
    to: z.string().email(),
    subject: z.string().min(1).max(200),
    body: z.string().max(10000)
  }),
  func: async ({ to, subject, body }) => {
    // Safe to use validated inputs
  }
});

// Bad - no validation
const badTool = ToolBuilder.createTool({
  name: "send_email",
  description: "Send an email",
  schema: z.any(), // Don't do this!
  func: async (args: any) => {
    // Unsafe - args could be anything
  }
});
```

### 3. Error Handling

Provide clear error messages:

```typescript
const tool = ToolBuilder.createTool({
  name: "fetch_user",
  description: "Fetch user by ID",
  schema: z.object({
    user_id: z.string()
  }),
  func: async ({ user_id }) => {
    try {
      const user = await db.users.findById(user_id);

      if (!user) {
        return `Error: User ${user_id} not found`;
      }

      return JSON.stringify(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `Error fetching user: ${message}`;
    }
  }
});
```

### 4. Performance Optimization

Cache results when appropriate:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();

const cachedTool = ToolBuilder.createTool({
  name: "expensive_lookup",
  description: "Expensive data lookup with caching",
  schema: z.object({
    key: z.string()
  }),
  func: async ({ key }) => {
    const cached = cache.get(key);
    const now = Date.now();

    // Return cached if less than 5 minutes old
    if (cached && now - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }

    // Fetch fresh data
    const data = await expensiveOperation(key);
    cache.set(key, { data, timestamp: now });

    return data;
  }
});
```

### 5. Logging and Monitoring

Track tool usage:

```typescript
const monitoredTool = ToolBuilder.createTool({
  name: "api_call",
  description: "External API call",
  schema: z.object({
    endpoint: z.string()
  }),
  func: async ({ endpoint }) => {
    const startTime = Date.now();

    try {
      logger.info(`Calling API: ${endpoint}`);
      const result = await fetch(endpoint);
      const duration = Date.now() - startTime;

      logger.info(`API call successful`, {
        endpoint,
        duration,
        status: result.status
      });

      return result.json();
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`API call failed`, {
        endpoint,
        duration,
        error: error.message
      });
      throw error;
    }
  }
});
```

### 6. Testing

Write comprehensive tests:

```typescript
describe("Calculator Tool", () => {
  test("should perform basic arithmetic", async () => {
    const result = await calculator.invoke({ expression: "2+2" });
    expect(result).toContain("4");
  });

  test("should handle invalid expressions", async () => {
    const result = await calculator.invoke({ expression: "invalid" });
    expect(result).toContain("Error");
  });

  test("should respect operator precedence", async () => {
    const result = await calculator.invoke({ expression: "2+2*3" });
    expect(result).toContain("8");
  });
});
```

## Production Checklist

Before deploying tools to production:

### Security

- [ ] Validate all inputs with strict schemas
- [ ] Implement authorization checks for sensitive operations
- [ ] Sanitize user inputs to prevent injection attacks
- [ ] Use environment variables for sensitive credentials
- [ ] Implement rate limiting to prevent abuse
- [ ] Log all tool executions for audit trails

### Reliability

- [ ] Add timeout handling for all external calls
- [ ] Implement retry logic for transient failures
- [ ] Handle errors gracefully with clear messages
- [ ] Test tools under various failure scenarios
- [ ] Monitor tool execution times and success rates

### Performance

- [ ] Cache expensive operations when appropriate
- [ ] Use parallel execution for independent tools
- [ ] Optimize database queries and API calls
- [ ] Set reasonable timeouts for all operations
- [ ] Monitor and alert on performance degradation

### Maintainability

- [ ] Document all tools with clear descriptions
- [ ] Use consistent naming conventions
- [ ] Organize tools by category and tags
- [ ] Version tool schemas for backward compatibility
- [ ] Maintain a tool catalog for discoverability

### Monitoring

- [ ] Track tool execution counts and durations
- [ ] Monitor error rates and types
- [ ] Alert on unusual patterns or failures
- [ ] Log tool inputs and outputs (with PII redaction)
- [ ] Create dashboards for tool metrics

## Example: Complete Tool System

Here's a complete example bringing it all together:

```typescript
import {
  ToolBuilder,
  ToolExecutor,
  ToolService,
  TOOL_CATEGORIES
} from "./core/index.js";
import { z } from "zod";

// 1. Create tools
const searchProducts = ToolBuilder.createTool({
  name: "search_products",
  description: "Search for products in the catalog",
  schema: z.object({
    query: z.string(),
    category: z.string().optional(),
    max_price: z.number().optional()
  }),
  func: async ({ query, category, max_price }) => {
    let results = await db.products.search(query);

    if (category) {
      results = results.filter(p => p.category === category);
    }

    if (max_price) {
      results = results.filter(p => p.price <= max_price);
    }

    return JSON.stringify(results);
  }
});

const getOrderStatus = ToolBuilder.createContextTool({
  name: "get_order_status",
  description: "Get status of user's order",
  schema: z.object({
    order_id: z.string()
  }),
  func: async ({ order_id }, config) => {
    const user_id = config?.context?.user_id;

    if (!user_id) {
      throw new Error("User authentication required");
    }

    const order = await db.orders.findOne({
      id: order_id,
      user_id
    });

    if (!order) {
      return `Order ${order_id} not found`;
    }

    return `Order ${order_id}: ${order.status}`;
  },
  requiresContext: true
});

// 2. Set up service
const service = new ToolService();

service.registerTool(searchProducts, {
  category: TOOL_CATEGORIES.DATA_RETRIEVAL,
  tags: ["search", "products"]
});

service.registerTool(getOrderStatus, {
  category: TOOL_CATEGORIES.USER_INFO,
  tags: ["orders", "status", "user"]
});

// 3. Execute tools
const executor = new ToolExecutor();

const searchResult = await executor.executeTool(
  searchProducts,
  {
    query: "laptop",
    max_price: 1000
  }
);

const orderResult = await executor.executeTool(
  getOrderStatus,
  { order_id: "ORD-123" },
  {
    context: { user_id: "USER-456" }
  }
);

// 4. Monitor performance
const stats = executor.getStatistics();
console.log(`Tool execution stats:`, stats);
```

## Conclusion

Tools are a powerful way to extend LangChain applications with custom functionality. By following best practices and using the provided utilities, you can build robust, production-ready tool systems.

### Key Takeaways

1. **Always validate inputs** - Use Zod schemas for type safety
2. **Handle errors gracefully** - Provide clear error messages
3. **Monitor performance** - Track execution times and success rates
4. **Organize tools** - Use categories and tags for discoverability
5. **Test thoroughly** - Write comprehensive tests for all tools
6. **Think about security** - Implement authorization and rate limiting

### Next Steps

- Explore the [examples](./examples/index.ts) for more use cases
- Run the [demo](./demo.ts) to see tools in action
- Check out [LangChain docs](https://docs.langchain.com) for more advanced patterns
- Build your own tools for your specific use case

Happy building! 🛠️
