# Middleware in LangChain

## Table of Contents

- [Introduction](#introduction)
- [What is Middleware?](#what-is-middleware)
- [Built-in Middleware](#built-in-middleware)
  - [Summarization](#summarization)
  - [Human-in-the-Loop](#human-in-the-loop)
  - [Anthropic Prompt Caching](#anthropic-prompt-caching)
  - [Model Call Limit](#model-call-limit)
  - [Tool Call Limit](#tool-call-limit)
  - [Model Fallback](#model-fallback)
  - [PII Detection](#pii-detection)
  - [Todo List](#todo-list)
  - [LLM Tool Selector](#llm-tool-selector)
  - [Context Editing](#context-editing)
- [Custom Middleware](#custom-middleware)
  - [Class-Based Middleware](#class-based-middleware)
  - [Node-Style Hooks](#node-style-hooks)
  - [Wrap-Style Hooks](#wrap-style-hooks)
  - [Custom State Schema](#custom-state-schema)
  - [Context Extension](#context-extension)
  - [Agent Jumps](#agent-jumps)
  - [Execution Order](#execution-order)
  - [Dynamic Tool Selection](#dynamic-tool-selection)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Introduction

Middleware provides a way to tightly control what happens inside the agent at every step of execution.

### What Can Middleware Do?

- **Monitor** - Track agent behavior with logging, analytics, and debugging
- **Modify** - Transform prompts, tool selection, and output formatting
- **Control** - Add retries, fallbacks, and early termination logic
- **Enforce** - Apply rate limits, guardrails, and PII detection

## What is Middleware?

The core agent loop involves calling a model, letting it choose tools to execute, and finishing when it calls no more tools.

**Core Agent Loop:**
```
START → MODEL → TOOLS → MODEL → ... → END
```

Middleware exposes hooks before and after each of those steps:

**With Middleware:**
```
START
  → beforeAgent
  → beforeModel → MODEL → afterModel
  → beforeTools → TOOLS → afterTools
  → beforeModel → MODEL → afterModel
  → afterAgent
→ END
```

### Adding Middleware

```typescript
import { createAgent, summarizationMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [...],
  middleware: [
    summarizationMiddleware({
      model: "gpt-4o-mini",
      maxTokensBeforeSummary: 4000,
    }),
  ],
});
```

## Built-in Middleware

LangChain provides prebuilt middleware for common use cases.

### Summarization

Automatically summarize conversation history when approaching token limits.

**Perfect for:**
- Long-running conversations exceeding context windows
- Multi-turn dialogues with extensive history
- Preserving full conversation context

**Configuration:**

```typescript
import { createAgent, summarizationMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [weatherTool, calculatorTool],
  middleware: [
    summarizationMiddleware({
      model: "gpt-4o-mini",           // Model for summaries
      maxTokensBeforeSummary: 4000,   // Trigger at 4000 tokens
      messagesToKeep: 20,              // Keep last 20 messages
      summaryPrompt: "Custom...",      // Optional custom prompt
    }),
  ],
});
```

**Options:**
- `model` (required) - Model for generating summaries
- `maxTokensBeforeSummary` - Token threshold for triggering
- `messagesToKeep` (default: 20) - Recent messages to preserve
- `tokenCounter` - Custom token counting function
- `summaryPrompt` - Custom prompt template
- `summaryPrefix` (default: "## Previous conversation summary:") - Prefix for summary messages

**See:** `examples/built-in/01-summarization.ts`

### Human-in-the-Loop

Pause agent execution for human approval, editing, or rejection of tool calls.

**Perfect for:**
- High-stakes operations (database writes, financial transactions)
- Compliance workflows requiring human oversight
- Long conversations with human feedback

**Configuration:**

```typescript
import { createAgent, humanInTheLoopMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [readEmailTool, sendEmailTool],
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        send_email: {
          allowAccept: true,
          allowEdit: true,
          allowRespond: true,
        },
        read_email: false, // Auto-approve
      },
    }),
  ],
});
```

**Options:**
- `interruptOn` (required) - Mapping of tool names to approval configs

**Tool approval config:**
- `allowAccept` (default: false) - Whether approval is allowed
- `allowEdit` (default: false) - Whether editing is allowed
- `allowRespond` (default: false) - Whether responding/rejection is allowed

**Important:** Requires a checkpointer to maintain state across interruptions.

**See:** [human-in-the-loop documentation](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop)

### Anthropic Prompt Caching

Reduce costs by caching repetitive prompt prefixes with Anthropic models.

**Perfect for:**
- Applications with long, repeated system prompts
- Agents reusing same context across invocations
- Reducing API costs for high-volume deployments

**Configuration:**

```typescript
import { createAgent, anthropicPromptCachingMiddleware } from "langchain";

const LONG_PROMPT = `
Please be a helpful assistant.
<Lots more context ...>
`;

const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  prompt: LONG_PROMPT,
  middleware: [
    anthropicPromptCachingMiddleware({ ttl: "5m" }),
  ],
});

// First call - cache store
await agent.invoke({ messages: "Hi, my name is Bob" });

// Second call - cache hit!
await agent.invoke({ messages: "What's my name?" });
```

**Options:**
- `ttl` (default: "5m") - Time to live. Valid values: `"5m"` or `"1h"`

**See:** [Anthropic Prompt Caching docs](https://docs.claude.com/en/docs/build-with-claude/prompt-caching)

### Model Call Limit

Limit the number of model calls to prevent infinite loops or excessive costs.

**Perfect for:**
- Preventing runaway agents
- Enforcing cost controls
- Testing agent behavior within specific budgets

**Configuration:**

```typescript
import { createAgent, modelCallLimitMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [...],
  middleware: [
    modelCallLimitMiddleware({
      threadLimit: 10,      // Max 10 calls per thread (across runs)
      runLimit: 5,          // Max 5 calls per run (single invocation)
      exitBehavior: "end",  // Or "error" to throw exception
    }),
  ],
});
```

**Options:**
- `threadLimit` - Maximum model calls across all runs in a thread
- `runLimit` - Maximum model calls per single invocation
- `exitBehavior` (default: "end") - `"end"` (graceful) or `"error"` (throw)

### Tool Call Limit

Control agent execution by limiting tool calls, globally or per-tool.

**Perfect for:**
- Preventing excessive calls to expensive APIs
- Limiting web searches or database queries
- Enforcing rate limits on specific tools
- Protecting against runaway loops

**Configuration:**

```typescript
import { createAgent, toolCallLimitMiddleware } from "langchain";

// Global limit: max 20 calls per thread, 10 per run
const globalLimiter = toolCallLimitMiddleware({
  threadLimit: 20,
  runLimit: 10,
});

// Tool-specific limit with default "continue" behavior
const searchLimiter = toolCallLimitMiddleware({
  toolName: "search",
  threadLimit: 5,
  runLimit: 3,
});

// Strict enforcement with "error" behavior
const scraperLimiter = toolCallLimitMiddleware({
  toolName: "scrape_webpage",
  runLimit: 2,
  exitBehavior: "error",
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool, scraperTool],
  middleware: [globalLimiter, searchLimiter, scraperLimiter],
});
```

**Options:**
- `toolName` - Name of specific tool to limit (omit for global limit)
- `threadLimit` - Max calls across all runs in thread (requires checkpointer)
- `runLimit` - Max calls per single invocation
- `exitBehavior` (default: "continue") - `"continue"`, `"error"`, or `"end"`

**Exit behaviors:**
| Behavior | Effect | Best For |
|----------|--------|----------|
| `"continue"` (default) | Blocks exceeded calls with error messages, agent continues | Most use cases |
| `"error"` | Raises exception immediately | Complex workflows |
| `"end"` | Stops with ToolMessage + AI message | Single-tool scenarios |

**Note:** At least one of `threadLimit` or `runLimit` must be specified.

### Model Fallback

Automatically fallback to alternative models when the primary model fails.

**Perfect for:**
- Building resilient agents that handle model outages
- Cost optimization by falling back to cheaper models
- Provider redundancy across OpenAI, Anthropic, etc.

**Configuration:**

```typescript
import { createAgent, modelFallbackMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o", // Primary model
  tools: [...],
  middleware: [
    modelFallbackMiddleware(
      "gpt-4o-mini",                 // Try first on error
      "claude-3-5-sonnet-20241022"   // Then this
    ),
  ],
});
```

**Options:**
- `...models` (required) - One or more fallback model strings in order

### PII Detection

Detect and handle Personally Identifiable Information in conversations.

**Perfect for:**
- Healthcare and financial applications with compliance requirements
- Customer service agents that need to sanitize logs
- Any application handling sensitive user data

**Configuration:**

```typescript
import { createAgent, piiRedactionMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [...],
  middleware: [
    // Redact emails in user input
    piiRedactionMiddleware({
      piiType: "email",
      strategy: "redact",
      applyToInput: true,
    }),
    // Mask credit cards (show last 4 digits)
    piiRedactionMiddleware({
      piiType: "credit_card",
      strategy: "mask",
      applyToInput: true,
    }),
    // Custom PII type with regex
    piiRedactionMiddleware({
      piiType: "api_key",
      detector: /sk-[a-zA-Z0-9]{32}/,
      strategy: "block", // Throw error if detected
    }),
  ],
});
```

**Options:**
- `piiType` (required) - Type of PII (`email`, `credit_card`, `ip`, `mac_address`, `url`, or custom)
- `strategy` (default: "redact") - How to handle: `"block"`, `"redact"`, `"mask"`, `"hash"`
- `detector` - Custom detector regex pattern
- `applyToInput` (default: true) - Check user messages before model call
- `applyToOutput` (default: false) - Check AI messages after model call
- `applyToToolResults` (default: false) - Check tool result messages

### Todo List

Equip agents with task planning and tracking capabilities for complex multi-step tasks.

**Perfect for:**
- Complex multi-step tasks requiring coordination
- Long-running operations where progress visibility is important

**Configuration:**

```typescript
import { createAgent, todoListMiddleware, tool } from "langchain";
import * as z from "zod";

const readFile = tool(
  async ({ filePath }) => "file contents",
  {
    name: "read_file",
    description: "Read contents of a file",
    schema: z.object({ filePath: z.string() }),
  }
);

const writeFile = tool(
  async ({ filePath, content }) => `Wrote to ${filePath}`,
  {
    name: "write_file",
    description: "Write content to a file",
    schema: z.object({
      filePath: z.string(),
      content: z.string()
    }),
  }
);

const agent = createAgent({
  model: "gpt-4o",
  tools: [readFile, writeFile],
  middleware: [todoListMiddleware()] as const,
});

const result = await agent.invoke({
  messages: ["Refactor the auth module to use async/await"],
});

// Agent uses write_todos to plan and track:
// 1. Read current auth module code
// 2. Identify functions that need async conversion
// 3. Refactor functions to async/await
// 4. Update function calls throughout codebase
// 5. Run tests and fix any failures

console.log(result.todos); // Track progress
```

**Note:** Automatically provides agents with a `write_todos` tool and system prompts for effective task planning.

### LLM Tool Selector

Use an LLM to intelligently select relevant tools before calling the main model.

**Perfect for:**
- Agents with many tools (10+) where most aren't relevant per query
- Reducing token usage by filtering irrelevant tools
- Improving model focus and accuracy

**Configuration:**

```typescript
import { createAgent, llmToolSelectorMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [tool1, tool2, tool3, ...], // Many tools
  middleware: [
    llmToolSelectorMiddleware({
      model: "gpt-4o-mini",     // Use cheaper model for selection
      maxTools: 3,              // Limit to 3 most relevant tools
      alwaysInclude: ["search"], // Always include certain tools
    }),
  ],
});
```

**Options:**
- `model` - Model for tool selection (defaults to agent's main model)
- `maxTools` - Maximum number of tools to select (defaults to no limit)
- `alwaysInclude` - Array of tool names to always include

### Context Editing

Manage conversation context by trimming, summarizing, or clearing tool uses.

**Perfect for:**
- Long conversations needing periodic context cleanup
- Removing failed tool attempts from context
- Custom context management strategies

**Configuration:**

```typescript
import { createAgent, contextEditingMiddleware, ClearToolUsesEdit } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [...],
  middleware: [
    contextEditingMiddleware({
      edits: [
        new ClearToolUsesEdit({ maxTokens: 1000 }), // Clear old tool uses
      ],
    }),
  ],
});
```

**Options:**
- `edits` (default: `[new ClearToolUsesEdit()]`) - Array of `ContextEdit` strategies

**ClearToolUsesEdit options:**
- `maxTokens` (default: 1000) - Token count that triggers the edit

## Custom Middleware

Build custom middleware by implementing hooks that run at specific points in agent execution.

### Class-Based Middleware

Create middleware using `createMiddleware`:

```typescript
import { createMiddleware } from "langchain";

const myMiddleware = createMiddleware({
  name: "MyMiddleware",
  beforeModel: (state) => {
    console.log("Before model call");
    return; // or return state updates
  },
  afterModel: (state) => {
    console.log("After model call");
    return; // or return state updates
  },
});
```

### Two Hook Styles

**Node-style hooks** - Run sequentially at specific execution points
**Wrap-style hooks** - Intercept execution with full control over handler calls

#### Node-Style Hooks

Run at specific points in the execution flow:

- `beforeAgent` - Before agent starts (once per invocation)
- `beforeModel` - Before each model call
- `afterModel` - After each model response
- `afterAgent` - After agent completes (up to once per invocation)

**Example: Logging middleware**

```typescript
import { createMiddleware } from "langchain";

const loggingMiddleware = createMiddleware({
  name: "LoggingMiddleware",
  beforeModel: (state) => {
    console.log(`About to call model with ${state.messages.length} messages`);
    return;
  },
  afterModel: (state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    console.log(`Model returned: ${lastMessage.content}`);
    return;
  },
});
```

**Example: Conversation length limit**

```typescript
import { createMiddleware, AIMessage } from "langchain";

const createMessageLimitMiddleware = (maxMessages: number = 50) => {
  return createMiddleware({
    name: "MessageLimitMiddleware",
    beforeModel: (state) => {
      if (state.messages.length === maxMessages) {
        return {
          messages: [new AIMessage("Conversation limit reached.")],
          jumpTo: "end",
        };
      }
      return;
    },
  });
};
```

**Use cases:** Logging, validation, state updates

#### Wrap-Style Hooks

Intercept execution and control when the handler is called:

- `wrapModelCall` - Around each model call
- `wrapToolCall` - Around each tool call

You decide if the handler is called zero times (short-circuit), once (normal flow), or multiple times (retry logic).

**Example: Model retry middleware**

```typescript
import { createMiddleware } from "langchain";

const createRetryMiddleware = (maxRetries: number = 3) => {
  return createMiddleware({
    name: "RetryMiddleware",
    wrapModelCall: (request, handler) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return handler(request);
        } catch (e) {
          if (attempt === maxRetries - 1) throw e;
          console.log(`Retry ${attempt + 1}/${maxRetries}`);
        }
      }
      throw new Error("Unreachable");
    },
  });
};
```

**Example: Dynamic model selection**

```typescript
import { createMiddleware, initChatModel } from "langchain";

const dynamicModelMiddleware = createMiddleware({
  name: "DynamicModelMiddleware",
  wrapModelCall: (request, handler) => {
    // Use different model based on conversation length
    const modifiedRequest = { ...request };
    if (request.messages.length > 10) {
      modifiedRequest.model = initChatModel("gpt-4o");
    } else {
      modifiedRequest.model = initChatModel("gpt-4o-mini");
    }
    return handler(modifiedRequest);
  },
});
```

**Example: Tool call monitoring**

```typescript
import { createMiddleware } from "langchain";

const toolMonitoringMiddleware = createMiddleware({
  name: "ToolMonitoringMiddleware",
  wrapToolCall: (request, handler) => {
    console.log(`Executing tool: ${request.toolCall.name}`);
    console.log(`Arguments: ${JSON.stringify(request.toolCall.args)}`);

    try {
      const result = handler(request);
      console.log("Tool completed successfully");
      return result;
    } catch (e) {
      console.log(`Tool failed: ${e}`);
      throw e;
    }
  },
});
```

**Use cases:** Retries, caching, fallbacks, transformation

### Custom State Schema

Middleware can extend the agent's state with custom properties.

```typescript
import { createMiddleware, createAgent } from "langchain";
import * as z from "zod";

// Middleware with custom state requirements
const callCounterMiddleware = createMiddleware({
  name: "CallCounterMiddleware",
  stateSchema: z.object({
    modelCallCount: z.number().default(0),
    userId: z.string().optional(),
  }),
  beforeModel: (state) => {
    // Access custom state properties
    if (state.modelCallCount > 10) {
      return { jumpTo: "end" };
    }
    return;
  },
  afterModel: (state) => {
    // Update custom state
    return { modelCallCount: state.modelCallCount + 1 };
  },
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [...],
  middleware: [callCounterMiddleware] as const,
});

// TypeScript enforces required state properties
const result = await agent.invoke({
  messages: [new HumanMessage("Hello")],
  modelCallCount: 0, // Optional due to default value
  userId: "user-123", // Optional
});
```

**Key points:**
- Define schema with `stateSchema`
- Access via `state.yourProperty`
- Update by returning new values
- TypeScript enforces types

### Context Extension

Context properties are configuration values passed through the runnable config. Unlike state, context is read-only and typically used for configuration that doesn't change during execution.

```typescript
import * as z from "zod";
import { createMiddleware, HumanMessage } from "langchain";

const rateLimitMiddleware = createMiddleware({
  name: "RateLimitMiddleware",
  contextSchema: z.object({
    maxRequestsPerMinute: z.number(),
    apiKey: z.string(),
  }),
  beforeModel: async (state, runtime) => {
    // Access context through runtime
    const { maxRequestsPerMinute, apiKey } = runtime.context;

    // Implement rate limiting logic
    const allowed = await checkRateLimit(apiKey, maxRequestsPerMinute);
    if (!allowed) {
      return { jumpTo: "end" };
    }

    return state;
  },
});

// Context is provided through config
await agent.invoke(
  { messages: [new HumanMessage("Process data")] },
  {
    context: {
      maxRequestsPerMinute: 60,
      apiKey: "api-key-123",
    },
  }
);
```

**Key points:**
- Define schema with `contextSchema`
- Access via `runtime.context`
- Read-only configuration
- Passed through invoke config

### Agent Jumps

To exit early from middleware, return a dictionary with `jumpTo`:

```typescript
import { createMiddleware, AIMessage } from "langchain";

const earlyExitMiddleware = createMiddleware({
  name: "EarlyExitMiddleware",
  beforeModel: (state) => {
    // Check some condition
    if (shouldExit(state)) {
      return {
        messages: [new AIMessage("Exiting early due to condition.")],
        jumpTo: "end",
      };
    }
    return;
  },
});
```

**Available jump targets:**
- `"end"` - Jump to the end of the agent execution
- `"tools"` - Jump to the tools node
- `"model"` - Jump to the model node (or the first `beforeModel` hook)

**Important:** When jumping from `beforeModel` or `afterModel`, jumping to `"model"` will cause all `beforeModel` middleware to run again.

### Execution Order

When using multiple middleware, understanding execution order is important:

```typescript
const agent = createAgent({
  model: "gpt-4o",
  middleware: [middleware1, middleware2, middleware3],
  tools: [...],
});
```

**Execution flow:**

1. **Before hooks run in order:**
   - `middleware1.beforeAgent()`
   - `middleware2.beforeAgent()`
   - `middleware3.beforeAgent()`

2. **Agent loop starts:**
   - `middleware1.beforeModel()`
   - `middleware2.beforeModel()`
   - `middleware3.beforeModel()`

3. **Wrap hooks nest like function calls:**
   - `middleware1.wrapModelCall()` → `middleware2.wrapModelCall()` → `middleware3.wrapModelCall()` → model

4. **After hooks run in reverse order:**
   - `middleware3.afterModel()`
   - `middleware2.afterModel()`
   - `middleware1.afterModel()`

5. **Agent loop ends:**
   - `middleware3.afterAgent()`
   - `middleware2.afterAgent()`
   - `middleware1.afterAgent()`

**Key rules:**
- `before_*` hooks: First to last
- `after_*` hooks: Last to first (reverse)
- `wrap_*` hooks: Nested (first middleware wraps all others)

### Dynamic Tool Selection

Select relevant tools at runtime to improve performance and accuracy.

**Benefits:**
- **Shorter prompts** - Reduce complexity by exposing only relevant tools
- **Better accuracy** - Models choose correctly from fewer options
- **Permission control** - Dynamically filter tools based on user access

**Example: GitHub vs GitLab tool selection**

```typescript
import * as z from "zod";
import { createAgent, createMiddleware, tool, HumanMessage } from "langchain";

const githubCreateIssue = tool(
  async ({ repo, title }) => ({
    url: `https://github.com/${repo}/issues/1`,
    title,
  }),
  {
    name: "github_create_issue",
    description: "Create an issue in a GitHub repository",
    schema: z.object({ repo: z.string(), title: z.string() }),
  }
);

const gitlabCreateIssue = tool(
  async ({ project, title }) => ({
    url: `https://gitlab.com/${project}/-/issues/1`,
    title,
  }),
  {
    name: "gitlab_create_issue",
    description: "Create an issue in a GitLab project",
    schema: z.object({ project: z.string(), title: z.string() }),
  }
);

const allTools = [githubCreateIssue, gitlabCreateIssue];

const toolSelector = createMiddleware({
  name: "toolSelector",
  contextSchema: z.object({ provider: z.enum(["github", "gitlab"]) }),
  wrapModelCall: (request, handler) => {
    const provider = request.runtime.context.provider;
    const toolName =
      provider === "gitlab" ? "gitlab_create_issue" : "github_create_issue";

    const selectedTools = request.tools.filter((t) => t.name === toolName);
    const modifiedRequest = { ...request, tools: selectedTools };

    return handler(modifiedRequest);
  },
});

const agent = createAgent({
  model: "gpt-4o",
  tools: allTools, // Register all tools upfront
  middleware: [toolSelector],
});

// Invoke with GitHub context
await agent.invoke(
  {
    messages: [
      new HumanMessage("Open an issue titled 'Bug' in repository `my-repo`"),
    ],
  },
  {
    context: { provider: "github" },
  }
);
```

**Key points:**
- Register all tools upfront
- Middleware selects the relevant subset per request
- Use `contextSchema` for configuration requirements

## Best Practices

### 1. Keep Middleware Focused

Each middleware should do one thing well:

```typescript
// Good - focused on logging
const loggingMiddleware = createMiddleware({
  name: "LoggingMiddleware",
  beforeModel: (state) => {
    console.log(`Model call with ${state.messages.length} messages`);
    return;
  },
});

// Bad - doing too much
const megaMiddleware = createMiddleware({
  name: "MegaMiddleware",
  beforeModel: (state) => {
    console.log("Logging...");
    validateState(state);
    updateMetrics(state);
    checkPermissions(state);
    // Too many responsibilities!
  },
});
```

### 2. Handle Errors Gracefully

Don't let middleware errors crash the agent:

```typescript
const safeMiddleware = createMiddleware({
  name: "SafeMiddleware",
  beforeModel: (state) => {
    try {
      // Your logic here
      return doSomething(state);
    } catch (error) {
      console.error("Middleware error:", error);
      // Return empty to continue normally
      return;
    }
  },
});
```

### 3. Use Appropriate Hook Types

- **Node-style** for sequential logic (logging, validation)
- **Wrap-style** for control flow (retry, fallback, caching)

```typescript
// Node-style: sequential validation
const validator = createMiddleware({
  name: "Validator",
  beforeModel: (state) => {
    if (!isValid(state)) {
      return { jumpTo: "end" };
    }
    return;
  },
});

// Wrap-style: retry logic
const retrier = createMiddleware({
  name: "Retrier",
  wrapModelCall: (request, handler) => {
    // Can call handler multiple times
    for (let i = 0; i < 3; i++) {
      try {
        return handler(request);
      } catch (e) {
        if (i === 2) throw e;
      }
    }
  },
});
```

### 4. Document Custom Properties

Clearly document any custom state or context properties:

```typescript
/**
 * Tracks model calls and enforces limits
 *
 * Custom state:
 * - modelCallCount: number - Tracks calls made
 * - userId: string - User making requests
 *
 * Context:
 * - maxCalls: number - Maximum allowed calls
 */
const callTrackerMiddleware = createMiddleware({
  name: "CallTracker",
  stateSchema: z.object({
    modelCallCount: z.number().default(0),
    userId: z.string(),
  }),
  contextSchema: z.object({
    maxCalls: z.number(),
  }),
  // ... hooks
});
```

### 5. Test Independently

Unit test middleware before integrating:

```typescript
import { test, expect } from "bun:test";

test("logging middleware logs correctly", () => {
  const logs: string[] = [];

  const middleware = createMiddleware({
    name: "TestLogging",
    beforeModel: (state) => {
      logs.push(`Called with ${state.messages.length} messages`);
      return;
    },
  });

  // Test the middleware
  const state = { messages: [{ role: "user", content: "test" }] };
  middleware.beforeModel(state);

  expect(logs.length).toBe(1);
  expect(logs[0]).toContain("1 messages");
});
```

### 6. Consider Execution Order

Place critical middleware first in the list:

```typescript
const agent = createAgent({
  model: "gpt-4o",
  middleware: [
    authMiddleware,      // First - validate auth
    rateLimitMiddleware, // Second - check rate limits
    loggingMiddleware,   // Third - log requests
    // ... other middleware
  ],
  tools: [...],
});
```

### 7. Use Built-in When Possible

Don't reinvent the wheel:

```typescript
// Good - use built-in
import { summarizationMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  middleware: [summarizationMiddleware({ model: "gpt-4o-mini" })],
});

// Bad - custom implementation of same thing
const myCustomSummarizer = createMiddleware({
  name: "CustomSummarizer",
  // ... reimplementing summarization
});
```

## API Reference

### createMiddleware

Create custom middleware with hooks:

```typescript
import { createMiddleware } from "langchain";

const middleware = createMiddleware({
  name: string,                    // Middleware name
  stateSchema?: z.ZodObject,       // Custom state schema
  contextSchema?: z.ZodObject,     // Context schema
  beforeAgent?: (state) => void | StateUpdate,
  beforeModel?: (state, runtime?) => void | StateUpdate,
  afterModel?: (state, runtime?) => void | StateUpdate,
  afterAgent?: (state) => void | StateUpdate,
  wrapModelCall?: (request, handler) => any,
  wrapToolCall?: (request, handler) => any,
});
```

### Hook Signatures

**Node-style hooks:**

```typescript
beforeAgent(state: State): void | StateUpdate
beforeModel(state: State, runtime?: Runtime): void | StateUpdate
afterModel(state: State, runtime?: Runtime): void | StateUpdate
afterAgent(state: State): void | StateUpdate
```

**Wrap-style hooks:**

```typescript
wrapModelCall(request: ModelRequest, handler: Handler): any
wrapToolCall(request: ToolRequest, handler: Handler): any
```

### StateUpdate

Return type for node-style hooks:

```typescript
type StateUpdate = {
  messages?: Message[];
  [key: string]: any;          // Custom state properties
  jumpTo?: "end" | "tools" | "model";
};
```

### Runtime

Available in node-style hooks:

```typescript
interface Runtime {
  context: any;     // Context from config
  // ... other runtime properties
}
```

## Examples

- `examples/built-in-middleware-complete.ts` - All built-in middleware
- `examples/custom-middleware-complete.ts` - Custom middleware patterns

## Common Patterns

### Pattern: Rate Limiting

```typescript
const rateLimitMiddleware = createMiddleware({
  name: "RateLimiting",
  contextSchema: z.object({ userId: z.string() }),
  stateSchema: z.object({ requestCount: z.number().default(0) }),
  beforeModel: async (state, runtime) => {
    const allowed = await checkRateLimit(
      runtime.context.userId,
      state.requestCount
    );
    if (!allowed) {
      return {
        messages: [new AIMessage("Rate limit exceeded")],
        jumpTo: "end",
      };
    }
    return { requestCount: state.requestCount + 1 };
  },
});
```

### Pattern: Caching

```typescript
const cache = new Map();

const cachingMiddleware = createMiddleware({
  name: "Caching",
  wrapModelCall: (request, handler) => {
    const key = JSON.stringify(request.messages);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = handler(request);
    cache.set(key, result);

    return result;
  },
});
```

### Pattern: Metrics Tracking

```typescript
const metricsMiddleware = createMiddleware({
  name: "Metrics",
  stateSchema: z.object({
    startTime: z.number().optional(),
    modelCalls: z.number().default(0),
    tokenCount: z.number().default(0),
  }),
  beforeAgent: (state) => {
    return { startTime: Date.now() };
  },
  beforeModel: (state) => {
    return { modelCalls: state.modelCalls + 1 };
  },
  afterAgent: (state) => {
    const duration = Date.now() - (state.startTime || 0);
    console.log(`Duration: ${duration}ms`);
    console.log(`Model calls: ${state.modelCalls}`);
    console.log(`Tokens: ${state.tokenCount}`);
    return;
  },
});
```

## Troubleshooting

### Issue: Middleware not running

**Problem:** Custom middleware hooks aren't being called

**Solution:** Ensure middleware is added to the agent
```typescript
const agent = createAgent({
  model: "gpt-4o",
  middleware: [myMiddleware], // Don't forget this!
  tools: [...],
});
```

### Issue: State updates not persisting

**Problem:** State changes in middleware don't persist

**Solution:** Return state updates from hooks
```typescript
// Wrong
beforeModel: (state) => {
  state.count = state.count + 1; // Mutation doesn't work
}

// Correct
beforeModel: (state) => {
  return { count: state.count + 1 }; // Return updates
}
```

### Issue: Context not available

**Problem:** `runtime.context` is undefined

**Solution:** Pass context through invoke config
```typescript
await agent.invoke(
  { messages: [...] },
  {
    context: {
      userId: "user-123",
    },
  }
);
```

### Issue: Jump not working

**Problem:** `jumpTo` doesn't exit early

**Solution:** Ensure you're returning the object correctly
```typescript
beforeModel: (state) => {
  if (shouldExit) {
    return {
      messages: [new AIMessage("Exiting")],
      jumpTo: "end", // Make sure this is included
    };
  }
  return; // Don't forget to return undefined for normal flow
}
```

---

**Next Steps:**
- Try the examples in `examples/`
- Run tests with: `bun test lessons/langchain/core-concepts/middleware/tests/`
- Check out the [demo](./demo.ts) for a full walkthrough
- Read the [official docs](https://docs.langchain.com/oss/javascript/langchain/middleware)
