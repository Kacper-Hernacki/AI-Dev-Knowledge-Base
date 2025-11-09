/**
 * Complete Custom Middleware Examples
 * Demonstrates creating custom middleware with all patterns
 */

import { z } from "zod";
import {
  createAgent,
  createMiddleware,
  tool,
  AIMessage,
  HumanMessage,
  initChatModel,
} from "langchain";
import { MemorySaver } from "@langchain/langgraph";

/**
 * 1. NODE-STYLE HOOKS
 * Run sequentially at specific execution points
 */
export async function demonstrateNodeStyleHooks() {
  console.log("\n🔗 1. Node-Style Hooks");
  console.log("=".repeat(50));

  // Logging middleware
  const loggingMiddleware = createMiddleware({
    name: "LoggingMiddleware",
    beforeModel: (state) => {
      console.log(`📥 Before model: ${state.messages.length} messages`);
      return;
    },
    afterModel: (state) => {
      const lastMsg = state.messages[state.messages.length - 1];
      console.log(`📤 After model: ${lastMsg.content?.toString().slice(0, 50)}...`);
      return;
    },
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [loggingMiddleware],
  });

  try {
    console.log("\n💡 Node-style hooks run at specific points:");
    console.log("  • beforeAgent - Before agent starts");
    console.log("  • beforeModel - Before each model call");
    console.log("  • afterModel - After each model response");
    console.log("  • afterAgent - After agent completes");

    console.log("\n✅ Perfect for: logging, validation, state updates");
  } catch (error) {
    console.error("❌ Node-style hooks demo failed:", error);
  }
}

/**
 * 2. WRAP-STYLE HOOKS
 * Intercept execution with full control
 */
export async function demonstrateWrapStyleHooks() {
  console.log("\n🔄 2. Wrap-Style Hooks");
  console.log("=".repeat(50));

  // Retry middleware
  const retryMiddleware = createMiddleware({
    name: "RetryMiddleware",
    wrapModelCall: (request, handler) => {
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return handler(request);
        } catch (e) {
          if (attempt === maxRetries - 1) throw e;
          console.log(`🔁 Retry ${attempt + 1}/${maxRetries}`);
        }
      }

      throw new Error("Unreachable");
    },
  });

  console.log("\n💡 Wrap-style hooks intercept execution:");
  console.log("  • wrapModelCall - Around each model call");
  console.log("  • wrapToolCall - Around each tool call");
  console.log("");
  console.log("  You control:");
  console.log("  • If handler is called (0 times = short-circuit)");
  console.log("  • How many times (1 = normal, multiple = retry)");
  console.log("  • What parameters are passed");

  console.log("\n✅ Perfect for: retry, fallback, caching, transformation");
}

/**
 * 3. CUSTOM STATE SCHEMA
 * Extend agent state with custom properties
 */
export async function demonstrateCustomState() {
  console.log("\n📊 3. Custom State Schema");
  console.log("=".repeat(50));

  // Middleware with custom state (tracked externally for demo)
  let modelCallCount = 0;

  const callCounterMiddleware = createMiddleware({
    name: "CallCounterMiddleware",
    beforeModel: (state) => {
      if (modelCallCount > 10) {
        console.log("⚠️  Max calls reached!");
        return { jumpTo: "end" as const };
      }
      return;
    },
    afterModel: (state) => {
      modelCallCount++;
      console.log(`  📊 Model calls: ${modelCallCount}`);
      return;
    },
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [callCounterMiddleware],
  });

  console.log("\n💡 Custom state properties:");
  console.log("  • Define schema with zod");
  console.log("  • Access in hooks via state.yourProperty");
  console.log("  • Update by returning new values");
  console.log("  • TypeScript enforces types");

  console.log("\n✅ Track custom metrics and state");
}

/**
 * 4. CONTEXT EXTENSION
 * Pass configuration through runtime context
 */
export async function demonstrateContextExtension() {
  console.log("\n⚙️  4. Context Extension");
  console.log("=".repeat(50));

  const rateLimitMiddleware = createMiddleware({
    name: "RateLimitMiddleware",
    contextSchema: z.object({
      maxRequestsPerMinute: z.number(),
      apiKey: z.string(),
    }),
    beforeModel: async (state, runtime) => {
      const { maxRequestsPerMinute, apiKey } = runtime.context;

      console.log(`🔑 API Key: ${apiKey.slice(0, 8)}...`);
      console.log(`⏱️  Rate limit: ${maxRequestsPerMinute}/min`);

      // Check rate limit (simulated)
      const allowed = true; // await checkRateLimit(apiKey, maxRequestsPerMinute);

      if (!allowed) {
        return { jumpTo: "end" };
      }

      return state;
    },
  });

  console.log("\n💡 Context properties:");
  console.log("  • Define schema with contextSchema");
  console.log("  • Access via runtime.context");
  console.log("  • Read-only configuration");
  console.log("  • Passed through invoke config");

  console.log("\n📝 Usage:");
  console.log("  await agent.invoke(");
  console.log("    { messages: [...] },");
  console.log("    {");
  console.log("      context: {");
  console.log("        maxRequestsPerMinute: 60,");
  console.log("        apiKey: 'api-key-123',");
  console.log("      },");
  console.log("    }");
  console.log("  );");

  console.log("\n✅ Pass configuration at runtime");
}

/**
 * 5. AGENT JUMPS
 * Control execution flow with jumps
 */
export async function demonstrateAgentJumps() {
  console.log("\n⏭️  5. Agent Jumps");
  console.log("=".repeat(50));

  const earlyExitMiddleware = createMiddleware({
    name: "EarlyExitMiddleware",
    beforeModel: (state) => {
      // Check some condition
      const shouldExit = state.messages.length > 5;

      if (shouldExit) {
        console.log("🛑 Exiting early!");
        return {
          messages: [new AIMessage("Conversation limit reached.")],
          jumpTo: "end",
        };
      }

      return;
    },
  });

  console.log("\n💡 Available jump targets:");
  console.log("  • 'end' - Jump to end of execution");
  console.log("  • 'tools' - Jump to tools node");
  console.log("  • 'model' - Jump to model node");

  console.log("\n📝 Usage:");
  console.log("  return {");
  console.log("    messages: [new AIMessage('Done')],");
  console.log("    jumpTo: 'end',");
  console.log("  };");

  console.log("\n✅ Implement early termination logic");
}

/**
 * 6. EXECUTION ORDER
 * Understanding middleware execution flow
 */
export async function demonstrateExecutionOrder() {
  console.log("\n🔢 6. Execution Order");
  console.log("=".repeat(50));

  const middleware1 = createMiddleware({
    name: "Middleware1",
    beforeModel: (state) => {
      console.log("  1️⃣ Middleware1.beforeModel");
      return;
    },
    afterModel: (state) => {
      console.log("  6️⃣ Middleware1.afterModel");
      return;
    },
  });

  const middleware2 = createMiddleware({
    name: "Middleware2",
    beforeModel: (state) => {
      console.log("  2️⃣ Middleware2.beforeModel");
      return;
    },
    afterModel: (state) => {
      console.log("  5️⃣ Middleware2.afterModel");
      return;
    },
  });

  const middleware3 = createMiddleware({
    name: "Middleware3",
    wrapModelCall: (request, handler) => {
      console.log("  3️⃣ Middleware3.wrapModelCall (before)");
      const result = handler(request);
      console.log("  4️⃣ Middleware3.wrapModelCall (after)");
      return result;
    },
  });

  console.log("\n💡 Execution order:");
  console.log("");
  console.log("  Given: middleware: [mw1, mw2, mw3]");
  console.log("");
  console.log("  BEFORE hooks (first to last):");
  console.log("    mw1.beforeModel → mw2.beforeModel → mw3.beforeModel");
  console.log("");
  console.log("  WRAP hooks (nested, outermost first):");
  console.log("    mw1.wrap → mw2.wrap → mw3.wrap → MODEL");
  console.log("");
  console.log("  AFTER hooks (last to first - reverse!):");
  console.log("    mw3.afterModel → mw2.afterModel → mw1.afterModel");

  console.log("\n✅ Place critical middleware first!");
}

/**
 * 7. DYNAMIC TOOL SELECTION
 * Select relevant tools at runtime
 */
export async function demonstrateDynamicToolSelection() {
  console.log("\n🎯 7. Dynamic Tool Selection");
  console.log("=".repeat(50));

  const githubTool = tool(
    async ({ repo }) => `Created issue in ${repo}`,
    {
      name: "github_create_issue",
      description: "Create GitHub issue",
      schema: z.object({ repo: z.string() }),
    }
  );

  const gitlabTool = tool(
    async ({ project }) => `Created issue in ${project}`,
    {
      name: "gitlab_create_issue",
      description: "Create GitLab issue",
      schema: z.object({ project: z.string() }),
    }
  );

  const toolSelectorMiddleware = createMiddleware({
    name: "ToolSelector",
    contextSchema: z.object({
      provider: z.enum(["github", "gitlab"]),
    }),
    wrapModelCall: (request, handler) => {
      const provider = request.runtime.context.provider;

      // Select tools based on provider
      const toolName =
        provider === "gitlab" ? "gitlab_create_issue" : "github_create_issue";

      const selectedTools = request.tools.filter((t) => t.name === toolName);

      const modifiedRequest = { ...request, tools: selectedTools };
      return handler(modifiedRequest);
    },
  });

  console.log("\n💡 Benefits:");
  console.log("  • Shorter prompts");
  console.log("  • Better accuracy");
  console.log("  • Permission control");
  console.log("  • Dynamic filtering");

  console.log("\n📝 Usage:");
  console.log("  const agent = createAgent({");
  console.log("    model: 'gpt-4o',");
  console.log("    tools: [githubTool, gitlabTool], // All tools");
  console.log("    middleware: [toolSelectorMiddleware],");
  console.log("  });");
  console.log("");
  console.log("  await agent.invoke(");
  console.log("    { messages: [...] },");
  console.log("    { context: { provider: 'github' } }");
  console.log("  );");

  console.log("\n✅ Select tools at runtime!");
}

/**
 * 8. COMBINING PATTERNS
 * Real-world middleware combining multiple patterns
 */
export async function demonstrateCombiningPatterns() {
  console.log("\n🔗 8. Combining Patterns");
  console.log("=".repeat(50));

  // Production-ready middleware combining multiple patterns
  let requestCount = 0;

  const productionMiddleware = createMiddleware({
    name: "ProductionMiddleware",

    // Context configuration
    contextSchema: z.object({
      userId: z.string(),
      tier: z.enum(["free", "pro", "enterprise"]),
    }),

    // Node-style: validation
    beforeModel: (state, runtime) => {
      console.log(`  👤 User: ${runtime.context.userId} (${runtime.context.tier})`);
      console.log(`  📊 Request count: ${requestCount}`);

      if (runtime.context.tier === "free" && requestCount >= 3) {
        console.log("  ⚠️  Free tier limit reached! (continuing in demo)");
        // In production, would stop here with jumpTo: "end"
      }

      requestCount++;
      return;
    },

    // Wrap-style: error handling & logging
    wrapModelCall: (request, handler) => {
      const startTime = Date.now();

      try {
        console.log("  🔄 Processing request...");
        const result = handler(request);
        const duration = Date.now() - startTime;
        console.log(`  ✅ Completed in ${duration}ms`);
        return result;
      } catch (e) {
        const error = e instanceof Error ? e.message : "Unknown error";
        console.log(`  ❌ Error: ${error}`);
        throw e;
      }
    },

    // Node-style: tracking
    afterModel: (state) => {
      console.log(`  📈 Total requests in session: ${requestCount}`);
      return;
    },
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [productionMiddleware] as const,
    checkpointer: new MemorySaver(),
  });

  const config = { configurable: { thread_id: "prod_demo_1" } };

  console.log("\n🧪 Testing with 'free' tier user:");

  for (let i = 1; i <= 4; i++) {
    console.log(`\n  Request ${i}:`);

    const response = await agent.invoke(
      { messages: [{ role: "user", content: `Test request ${i}` }] },
      {
        ...config,
        context: {
          userId: "user-123",
          tier: "free" as const,
        },
      }
    );

    // Demo continues through all requests to show middleware behavior
  }

  console.log("\n✅ Combined patterns:");
  console.log("  • State tracking (request counter)");
  console.log("  • Context extension (user tier)");
  console.log("  • Node-style hooks (validation, tracking)");
  console.log("  • Wrap-style hooks (error handling, timing)");
  console.log("  • Agent jumps (early termination)");

  // Reset counter for next run
  requestCount = 0;
}

/**
 * Summary of custom middleware patterns
 */
export function summarizeCustomMiddleware() {
  console.log("\n📦 Custom Middleware Summary");
  console.log("=".repeat(50));

  console.log("\n| Pattern | Use Case |");
  console.log("|---------|----------|");
  console.log("| Node-style hooks | Logging, validation, state updates |");
  console.log("| Wrap-style hooks | Retry, fallback, caching |");
  console.log("| Custom state | Track metrics, counters |");
  console.log("| Context extension | Runtime configuration |");
  console.log("| Agent jumps | Early termination |");
  console.log("| Execution order | Control flow |");
  console.log("| Dynamic tools | Tool filtering |");

  console.log("\n📋 Best Practices:");
  console.log("  1. Keep middleware focused");
  console.log("  2. Handle errors gracefully");
  console.log("  3. Use appropriate hook types");
  console.log("  4. Document custom properties");
  console.log("  5. Test independently");
  console.log("  6. Consider execution order");
  console.log("  7. Use built-in when possible");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateNodeStyleHooks();
  await demonstrateWrapStyleHooks();
  await demonstrateCustomState();
  await demonstrateContextExtension();
  await demonstrateAgentJumps();
  await demonstrateExecutionOrder();
  await demonstrateDynamicToolSelection();
  demonstrateCombiningPatterns();
  summarizeCustomMiddleware();
}
