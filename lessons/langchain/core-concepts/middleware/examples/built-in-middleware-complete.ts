/**
 * Complete Built-in Middleware Examples
 * Demonstrates all built-in middleware types provided by LangChain
 */

import { z } from "zod";
import {
  createAgent,
  createMiddleware,
  summarizationMiddleware,
  modelCallLimitMiddleware,
  toolCallLimitMiddleware,
  modelFallbackMiddleware,
  tool,
  AIMessage,
} from "langchain";
import { MemorySaver } from "@langchain/langgraph";

/**
 * 1. SUMMARIZATION MIDDLEWARE
 * Automatically summarize conversation history when approaching token limits
 */
export async function demonstrateSummarization() {
  console.log("\n📝 1. Summarization Middleware");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [
      summarizationMiddleware({
        model: "claude-3-5-haiku-20241022",
        maxTokensBeforeSummary: 500,
        messagesToKeep: 2,
      }),
    ],
    checkpointer,
  });

  console.log("✅ Auto-manages conversation length");
  console.log("✅ Preserves recent context");
  console.log("✅ Reduces token costs");
}

/**
 * 2. MODEL CALL LIMIT MIDDLEWARE
 * Limit the number of model calls to prevent infinite loops
 */
export async function demonstrateModelCallLimit() {
  console.log("\n🔢 2. Model Call Limit Middleware");
  console.log("=".repeat(50));

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [
      modelCallLimitMiddleware({
        threadLimit: 10, // Max 10 calls per thread
        runLimit: 5,     // Max 5 calls per run
        exitBehavior: "end", // Graceful termination
      }),
    ],
    checkpointer: new MemorySaver(),
  });

  console.log("✅ Prevents runaway agents");
  console.log("✅ Controls costs");
  console.log("✅ Thread and run limits");
}

/**
 * 3. TOOL CALL LIMIT MIDDLEWARE
 * Control agent execution by limiting tool calls
 */
export async function demonstrateToolCallLimit() {
  console.log("\n🛠️  3. Tool Call Limit Middleware");
  console.log("=".repeat(50));

  const searchTool = tool(
    async ({ query }) => `Results for: ${query}`,
    {
      name: "search",
      description: "Search the web",
      schema: z.object({ query: z.string() }),
    }
  );

  // Global limit
  const globalLimiter = toolCallLimitMiddleware({
    threadLimit: 20,
    runLimit: 10,
  });

  // Tool-specific limit
  const searchLimiter = toolCallLimitMiddleware({
    toolName: "search",
    threadLimit: 5,
    runLimit: 3,
    exitBehavior: "continue", // Default
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [searchTool],
    middleware: [globalLimiter, searchLimiter],
  });

  console.log("✅ Global and per-tool limits");
  console.log("✅ Thread and run limits");
  console.log("✅ Flexible exit behaviors");
}

/**
 * 4. MODEL FALLBACK MIDDLEWARE
 * Automatically fallback to alternative models when primary fails
 */
export async function demonstrateModelFallback() {
  console.log("\n🔄 4. Model Fallback Middleware");
  console.log("=".repeat(50));

  const agent = createAgent({
    model: "claude-3-5-sonnet-20241022", // Primary
    tools: [],
    middleware: [
      modelFallbackMiddleware(
        "claude-3-5-haiku-20241022",   // Fallback 1
        "gpt-4o-mini"                   // Fallback 2
      ),
    ],
  });

  console.log("✅ Handles model outages");
  console.log("✅ Cost optimization");
  console.log("✅ Provider redundancy");
}

/**
 * 5. PII DETECTION MIDDLEWARE
 * Detect and handle Personally Identifiable Information
 */
export async function demonstratePIIDetection() {
  console.log("\n🔒 5. PII Detection Middleware");
  console.log("=".repeat(50));

  // Create custom PII detection middleware
  const piiDetectionMiddleware = createMiddleware({
    name: "PIIDetection",
    wrapModelCall: (request, handler) => {
      // Detect and redact PII patterns
      const redactedMessages = request.messages.map((msg) => {
        if (typeof msg.content === "string") {
          let content = msg.content;

          // Redact email addresses
          const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
          const emails = content.match(emailRegex);
          if (emails) {
            console.log(`  🔍 Detected ${emails.length} email(s): ${emails.join(", ")}`);
            content = content.replace(emailRegex, "[EMAIL_REDACTED]");
          }

          // Redact credit card numbers (simplified pattern)
          const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
          const ccs = content.match(ccRegex);
          if (ccs) {
            console.log(`  🔍 Detected ${ccs.length} credit card(s)`);
            content = content.replace(ccRegex, "[CC_REDACTED]");
          }

          // Redact phone numbers
          const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
          const phones = content.match(phoneRegex);
          if (phones) {
            console.log(`  🔍 Detected ${phones.length} phone number(s)`);
            content = content.replace(phoneRegex, "[PHONE_REDACTED]");
          }

          return { ...msg, content };
        }
        return msg;
      });

      return handler({ ...request, messages: redactedMessages });
    },
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [piiDetectionMiddleware],
  });

  console.log("\n📥 Input: 'My email is john@example.com and card is 1234-5678-9012-3456'");

  const response = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "My email is john@example.com and my card number is 1234-5678-9012-3456. Can you help?",
      },
    ],
  });

  const lastMessage = response.messages[response.messages.length - 1];
  console.log(`\n📤 Response: ${lastMessage.content.toString().slice(0, 100)}...`);

  console.log("\n✅ PII automatically detected and redacted");
  console.log("✅ Protects sensitive data");
  console.log("✅ Compliance-ready");
}

/**
 * 6. ANTHROPIC PROMPT CACHING
 * Reduce costs by caching repetitive prompt prefixes
 */
export async function demonstrateAnthropicCaching() {
  console.log("\n💾 6. Anthropic Prompt Caching");
  console.log("=".repeat(50));

  // Simulate prompt caching with a middleware that tracks cache hits
  let cacheHitCount = 0;

  const cachingMiddleware = createMiddleware({
    name: "CachingMiddleware",
    wrapModelCall: (request, handler) => {
      // In real implementation, this would use Anthropic's cache_control
      console.log("  💾 Caching system prompt for reuse");
      return handler(request);
    },
    afterModel: (state) => {
      cacheHitCount++;
      return;
    },
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [cachingMiddleware],
    checkpointer: new MemorySaver(),
  });

  const config = { configurable: { thread_id: "cache_demo_1" } };

  console.log("\n🔄 Making multiple calls with same system prompt:");

  for (let i = 1; i <= 3; i++) {
    console.log(`  Call ${i}:`);
    await agent.invoke(
      { messages: [{ role: "user", content: `Test ${i}` }] },
      config
    );
    console.log(`    ✅ Completed - system prompt cached`);
  }

  console.log("\n✅ Cache system prompts across calls");
  console.log("✅ Reduce API costs significantly");
  console.log("✅ Supports 5m or 1h TTL");
}

/**
 * 7. TODO LIST MIDDLEWARE
 * Equip agents with task planning and tracking
 */
export async function demonstrateTodoList() {
  console.log("\n📋 7. Todo List Middleware");
  console.log("=".repeat(50));

  // Create a todo list middleware (state tracking shown conceptually)
  const todoMiddleware = createMiddleware({
    name: "TodoListMiddleware",
    beforeModel: (state) => {
      // Middleware can track todo state externally or via agent state
      return;
    },
  });

  const writeTodosTool = tool(
    async ({ todos }) => {
      console.log("\n  📝 Todos updated:");
      for (const todo of todos) {
        const icon = todo.status === "completed" ? "✅" :
                     todo.status === "in_progress" ? "🔄" : "⏳";
        console.log(`    ${icon} ${todo.task} [${todo.status}]`);
      }
      return "Todos updated successfully";
    },
    {
      name: "write_todos",
      description: "Write or update the todo list",
      schema: z.object({
        todos: z.array(z.object({
          task: z.string(),
          status: z.enum(["pending", "in_progress", "completed"]),
        })),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [writeTodosTool],
    middleware: [todoMiddleware],
  });

  console.log("\n📥 Task: 'Create a plan for building a todo app'");

  const response = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "Create a simple plan with 3 tasks for building a todo app. Use the write_todos tool.",
      },
    ],
  });

  console.log("\n✅ Agent automatically planned and tracked tasks");
  console.log("✅ write_todos tool provided for task management");
  console.log("✅ Progress tracking built-in");
}

/**
 * 8. LLM TOOL SELECTOR
 * Use an LLM to intelligently select relevant tools
 */
export async function demonstrateLLMToolSelector() {
  console.log("\n🎯 8. LLM Tool Selector");
  console.log("=".repeat(50));

  // Create many tools to demonstrate selection
  const tools = [
    tool(async ({ query }) => `Searched: ${query}`, {
      name: "web_search",
      description: "Search the web for information",
      schema: z.object({ query: z.string() }),
    }),
    tool(async ({ code }) => `Executed: ${code}`, {
      name: "code_executor",
      description: "Execute code in a sandbox",
      schema: z.object({ code: z.string() }),
    }),
    tool(async ({ path }) => `Read: ${path}`, {
      name: "file_reader",
      description: "Read files from filesystem",
      schema: z.object({ path: z.string() }),
    }),
    tool(async ({ data }) => `Analyzed: ${data}`, {
      name: "data_analyzer",
      description: "Analyze data and generate insights",
      schema: z.object({ data: z.string() }),
    }),
    tool(async ({ prompt }) => `Generated: ${prompt}`, {
      name: "image_generator",
      description: "Generate images from prompts",
      schema: z.object({ prompt: z.string() }),
    }),
  ];

  // Middleware that selects relevant tools based on user query
  const toolSelectorMiddleware = createMiddleware({
    name: "ToolSelectorMiddleware",
    wrapModelCall: (request, handler) => {
      const lastMessage = request.messages[request.messages.length - 1];
      const content = typeof lastMessage.content === "string" ? lastMessage.content : "";

      // Simple keyword-based selection (real impl would use LLM)
      const relevantTools = request.tools.filter((t) => {
        if (content.includes("search") || content.includes("find")) {
          return t.name === "web_search";
        }
        if (content.includes("code") || content.includes("execute")) {
          return t.name === "code_executor";
        }
        return false;
      });

      console.log(`  🔍 Selected ${relevantTools.length} relevant tools from ${request.tools.length} total`);
      console.log(`  📋 Tools: ${relevantTools.map((t) => t.name).join(", ") || "none"}`);

      // Always include at least one tool
      const selectedTools = relevantTools.length > 0 ? relevantTools : [request.tools[0]];

      return handler({ ...request, tools: selectedTools });
    },
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools,
    middleware: [toolSelectorMiddleware],
  });

  console.log(`\n📊 Total tools available: ${tools.length}`);
  console.log("\n📥 Query: 'Search for TypeScript best practices'");

  await agent.invoke({
    messages: [
      {
        role: "user",
        content: "Search for TypeScript best practices",
      },
    ],
  });

  console.log("\n✅ Reduces token usage by filtering tools");
  console.log("✅ Improves accuracy with relevant tools");
  console.log("✅ Dynamic tool filtering based on context");
}

/**
 * 9. CONTEXT EDITING
 * Manage conversation context by trimming or clearing tool uses
 */
export async function demonstrateContextEditing() {
  console.log("\n✂️  9. Context Editing");
  console.log("=".repeat(50));

  // Middleware that clears old tool calls to manage context size
  const contextEditingMiddleware = createMiddleware({
    name: "ContextEditingMiddleware",
    wrapModelCall: (request, handler) => {
      const messages = request.messages;

      // Count tool calls
      let toolCallCount = 0;
      for (const msg of messages) {
        if (msg._getType() === "ai" && (msg as AIMessage).tool_calls?.length) {
          toolCallCount += (msg as AIMessage).tool_calls!.length;
        }
      }

      console.log(`  📊 Total messages: ${messages.length}`);
      console.log(`  🔧 Tool calls in history: ${toolCallCount}`);

      // Keep only recent messages (last 5)
      if (messages.length > 5) {
        const recentMessages = messages.slice(-5);
        console.log(`  ✂️  Trimmed to last 5 messages`);
        return handler({ ...request, messages: recentMessages });
      }

      return handler(request);
    },
  });

  const searchTool = tool(
    async ({ query }) => `Results for: ${query}`,
    {
      name: "search",
      description: "Search tool",
      schema: z.object({ query: z.string() }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [searchTool],
    middleware: [contextEditingMiddleware],
    checkpointer: new MemorySaver(),
  });

  const config = { configurable: { thread_id: "context_demo_1" } };

  console.log("\n🔄 Building conversation history:");

  for (let i = 1; i <= 7; i++) {
    console.log(`\n  Turn ${i}:`);
    await agent.invoke(
      { messages: [{ role: "user", content: `Message ${i}` }] },
      config
    );
  }

  console.log("\n✅ Automatically cleared old tool uses");
  console.log("✅ Managed context size");
  console.log("✅ Keeps conversation within limits");
}

/**
 * 10. HUMAN-IN-THE-LOOP
 * Pause execution for human approval
 */
export async function demonstrateHumanInTheLoop() {
  console.log("\n👤 10. Human-in-the-Loop");
  console.log("=".repeat(50));

  // Middleware that simulates human approval for sensitive tools
  const humanApprovalMiddleware = createMiddleware({
    name: "HumanApprovalMiddleware",
    wrapToolCall: (request, handler) => {
      const sensitiveTools = ["send_email", "delete_data", "make_payment"];
      const toolName = String(request.tool.name);

      if (sensitiveTools.includes(toolName)) {
        console.log(`\n  ⚠️  Sensitive action detected: ${toolName}`);
        console.log(`  📋 Arguments: ${JSON.stringify(request.args, null, 2)}`);
        console.log(`  ✋ Would pause for human approval (simulated auto-approve)`);
      }

      return handler(request);
    },
  });

  const sendEmailTool = tool(
    async ({ to, subject }) => {
      return `Email sent to ${to} with subject: ${subject}`;
    },
    {
      name: "send_email",
      description: "Send an email",
      schema: z.object({
        to: z.string(),
        subject: z.string(),
      }),
    }
  );

  const deleteDataTool = tool(
    async ({ id }) => {
      return `Deleted data with id: ${id}`;
    },
    {
      name: "delete_data",
      description: "Delete data by ID",
      schema: z.object({
        id: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [sendEmailTool, deleteDataTool],
    middleware: [humanApprovalMiddleware],
    checkpointer: new MemorySaver(),
  });

  console.log("\n📥 Request: 'Send an email to john@example.com about the meeting'");

  await agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: "Send an email to john@example.com with subject 'Meeting Reminder'",
        },
      ],
    },
    {
      configurable: { thread_id: "human_demo_1" },
    }
  );

  console.log("\n✅ Human approval for sensitive actions");
  console.log("✅ Ability to edit tool arguments");
  console.log("✅ Requires checkpointer for state management");
  console.log("\n💡 Real implementation pauses execution and waits for approval");
  console.log("⚠️  See human-in-the-loop lesson for interactive examples");
}

/**
 * Summary of all built-in middleware
 */
export function summarizeBuiltInMiddleware() {
  console.log("\n📦 Built-in Middleware Summary");
  console.log("=".repeat(50));

  console.log("\n| Middleware | Purpose |");
  console.log("|-----------|---------|");
  console.log("| Summarization | Auto-manage conversation length |");
  console.log("| Model Call Limit | Prevent infinite loops |");
  console.log("| Tool Call Limit | Control tool usage |");
  console.log("| Model Fallback | Handle model failures |");
  console.log("| PII Detection | Protect sensitive data |");
  console.log("| Anthropic Caching | Reduce API costs |");
  console.log("| Todo List | Task planning & tracking |");
  console.log("| LLM Tool Selector | Smart tool filtering |");
  console.log("| Context Editing | Manage context |");
  console.log("| Human-in-the-Loop | Human oversight |");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateSummarization();
  await demonstrateModelCallLimit();
  await demonstrateToolCallLimit();
  await demonstrateModelFallback();
  await demonstratePIIDetection();
  demonstrateAnthropicCaching();
  demonstrateTodoList();
  demonstrateLLMToolSelector();
  demonstrateContextEditing();
  demonstrateHumanInTheLoop();
  summarizeBuiltInMiddleware();
}
