# Short-Term Memory in LangChain

## Table of Contents

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Checkpointers](#checkpointers)
- [Custom State](#custom-state)
- [Message Management](#message-management)
- [Memory Access](#memory-access)
- [Hooks](#hooks)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Introduction

Short-term memory enables your AI agents to remember previous interactions within a single thread or conversation. This is essential for creating coherent, context-aware conversational experiences.

### What is Short-Term Memory?

Short-term memory in LangChain:
- **Thread-level persistence** - Conversations are organized into threads
- **State management** - Manages conversation history and custom data
- **Context window management** - Handles token limits and message overflow
- **Production-ready** - Scalable persistence with databases

### Why Short-Term Memory Matters

Without memory:
```typescript
// Each request is independent - no context
await agent.invoke({ messages: [{ role: "user", content: "My name is Alice" }] });
await agent.invoke({ messages: [{ role: "user", content: "What's my name?" }] });
// Agent doesn't know - context lost!
```

With memory:
```typescript
const checkpointer = new MemorySaver();
const agent = createReactAgent({ llm: model, tools: [], checkpointSaver: checkpointer });

const config = { configurable: { thread_id: "thread_1" } };
await agent.invoke({ messages: [{ role: "user", content: "My name is Alice" }] }, config);
await agent.invoke({ messages: [{ role: "user", content: "What's my name?" }] }, config);
// Agent remembers: "Your name is Alice"
```

## Quick Start

### Basic Memory Setup

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

// 1. Create a checkpointer
const checkpointer = new MemorySaver();

// 2. Initialize model
const model = new ChatAnthropic({
  model: "claude-3-5-haiku-20241022",
  temperature: 0,
});

// 3. Create agent with memory
const agent = createReactAgent({
  llm: model,
  tools: [],
  checkpointSaver: checkpointer,
});

// 4. Use with thread ID
const config = { configurable: { thread_id: "conversation_1" } };

await agent.invoke(
  { messages: [{ role: "user", content: "Hi! I'm Alice." }] },
  config
);

await agent.invoke(
  { messages: [{ role: "user", content: "What's my name?" }] },
  config
);
// Response: "Your name is Alice."
```

### Key Points

- **Checkpointer** - Persists conversation state
- **Thread ID** - Isolates conversations
- **Automatic** - Memory updates automatically
- **Stateful** - Full conversation context available

## Core Concepts

### Threads

A thread organizes multiple interactions in a session, similar to email conversations.

```typescript
// Thread 1
await agent.invoke(
  { messages: [{ role: "user", content: "I like pizza" }] },
  { configurable: { thread_id: "thread_1" } }
);

// Thread 2 - completely separate
await agent.invoke(
  { messages: [{ role: "user", content: "I like pasta" }] },
  { configurable: { thread_id: "thread_2" } }
);

// Back to thread 1 - remembers pizza preference
await agent.invoke(
  { messages: [{ role: "user", content: "What do I like?" }] },
  { configurable: { thread_id: "thread_1" } }
);
```

### State

State contains all information about a conversation:

```typescript
{
  messages: [...],     // Conversation history
  // + any custom fields
}
```

The state is:
- **Persisted** by the checkpointer
- **Updated** after each step
- **Read** at the start of each step
- **Isolated** per thread

### Context Window Challenge

Most LLMs have limited context windows. Long conversations cause:
- **Token limits** - Can't fit all history
- **Performance issues** - Slower, more expensive
- **Attention problems** - Model gets "distracted"

Solutions:
1. **Trim messages** - Keep recent messages
2. **Delete messages** - Remove specific messages
3. **Summarize messages** - Compress history

## Checkpointers

Checkpointers persist conversation state to storage.

### MemorySaver (Development)

In-memory checkpointer for development and testing.

```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const agent = createReactAgent({
  llm: model,
  tools: [],
  checkpointSaver: checkpointer,
});
```

**Characteristics:**
- ✅ Simple setup
- ✅ Fast
- ❌ Data lost on restart
- ❌ Not for production

### PostgresSaver (Production)

Database-backed checkpointer for production.

```typescript
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const DB_URI = "postgresql://postgres:postgres@localhost:5432/langchain_memory";
const checkpointer = PostgresSaver.fromConnString(DB_URI);
await checkpointer.setup();

const agent = createReactAgent({
  llm: model,
  tools: [],
  checkpointSaver: checkpointer,
});
```

**Setup PostgreSQL locally:**

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create database
createdb langchain_memory

# Connection string format
postgresql://user:password@host:port/database
```

**Characteristics:**
- ✅ Persistent storage
- ✅ Survives restarts
- ✅ Scalable
- ✅ Production-ready
- ⚙️ Requires database setup

### SQLite Saver

File-based persistence (alternative to PostgreSQL).

```typescript
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

const checkpointer = await SqliteSaver.fromConnString("./checkpoints.db");
```

## Custom State

Extend agent state with custom fields beyond messages.

### Basic Custom State

```typescript
import { z } from "zod";
import { MessagesAnnotation, Annotation, StateGraph } from "@langchain/langgraph";

const CustomStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userId: Annotation<string>(),
  preferences: Annotation<Record<string, any>>({
    reducer: (prev, curr) => ({ ...prev, ...curr }),
  }),
});

const workflow = new StateGraph(CustomStateAnnotation)
  .addNode("agent", async (state) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addEdge("__start__", "agent")
  .addEdge("__end__", "agent");

const agent = workflow.compile({ checkpointer });

// Use custom state
const response = await agent.invoke({
  messages: [{ role: "user", content: "Hello" }],
  userId: "user_123",
  preferences: { theme: "dark" },
}, config);

console.log(response.userId); // "user_123"
console.log(response.preferences); // { theme: "dark" }
```

### State Reducers

Reducers define how state updates are merged:

```typescript
const CustomStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  // Replace strategy (default)
  userId: Annotation<string>(),

  // Merge strategy for objects
  preferences: Annotation<Record<string, any>>({
    reducer: (prev, curr) => ({ ...prev, ...curr }),
  }),

  // Increment strategy
  requestCount: Annotation<number>({
    reducer: (prev, curr) => (curr !== undefined ? curr : prev),
    default: () => 0,
  }),

  // Append strategy for arrays
  tags: Annotation<string[]>({
    reducer: (prev, curr) => [...(prev || []), ...(curr || [])],
    default: () => [],
  }),
});
```

### Complex State Types

```typescript
const UserProfileAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  profile: Annotation<{
    name: string;
    email: string;
    settings: {
      notifications: boolean;
      theme: string;
    };
  }>({
    reducer: (prev, curr) => ({ ...prev, ...curr }),
  }),
});
```

## Message Management

Managing conversation history to fit context windows.

### Trim Messages

Keep recent messages, discard old ones.

```typescript
import { trimMessages } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", async (state) => {
    // Trim before model call
    const trimmed = await trimMessages(state.messages, {
      maxTokens: 384,
      strategy: "last",
      startOn: "human",
      endOn: ["human", "tool"],
      tokenCounter: (msgs) => msgs.length,
    });

    const response = await model.invoke(trimmed);
    return { messages: [response] };
  })
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");

const agent = workflow.compile({ checkpointer });
```

**Trim Options:**

```typescript
{
  maxTokens: 384,              // Token limit
  strategy: "last" | "first",  // Keep last or first messages
  startOn: "human",            // Ensure specific start
  endOn: ["human", "tool"],    // Ensure specific end
  tokenCounter: (msgs) => ..., // Custom token counting
}
```

**Token Counting:**

```typescript
// Simple character count
tokenCounter: (msgs) => {
  return msgs.reduce((total, msg) => {
    const content = typeof msg.content === "string" ? msg.content : "";
    return total + content.length;
  }, 0);
}

// Using tiktoken library
import { encoding_for_model } from "tiktoken";

tokenCounter: (msgs) => {
  const enc = encoding_for_model("gpt-4");
  return msgs.reduce((total, msg) => {
    const content = typeof msg.content === "string" ? msg.content : "";
    return total + enc.encode(content).length;
  }, 0);
}
```

### Delete Messages

Permanently remove messages from state.

```typescript
import { RemoveMessage } from "@langchain/core/messages";

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", async (state) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addNode("cleanup", (state) => {
    const messages = state.messages;
    if (messages.length > 6) {
      // Remove first 2 messages
      return {
        messages: messages
          .slice(0, 2)
          .map((m) => new RemoveMessage({ id: m.id! })),
      };
    }
    return {};
  })
  .addEdge("__start__", "agent")
  .addEdge("agent", "cleanup")
  .addEdge("cleanup", "__end__");
```

**Delete Patterns:**

```typescript
// Delete by range
const removeMessages = messages
  .slice(0, 2)
  .map((m) => new RemoveMessage({ id: m.id! }));

// Delete by condition
const removeMessages = messages
  .filter((msg) => {
    const content = typeof msg.content === "string" ? msg.content : "";
    return content.includes("sensitive");
  })
  .map((m) => new RemoveMessage({ id: m.id! }));

// Delete specific IDs
const idsToDelete = ["msg_1", "msg_3"];
const removeMessages = messages
  .filter((m) => m.id && idsToDelete.includes(m.id))
  .map((m) => new RemoveMessage({ id: m.id! }));
```

**Important:** Ensure valid message sequences after deletion:
- Some providers require messages to start with human/system
- Tool calls need corresponding tool result messages
- System messages should typically be preserved

### Summarize Messages

Compress history into summaries.

```typescript
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", async (state) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addNode("summarize", async (state) => {
    const messages = state.messages;

    if (messages.length > 8) {
      // Get messages to summarize (keep last 2)
      const toSummarize = messages.slice(0, -2);

      const prompt = `Summarize this conversation:\n\n${toSummarize
        .map((m) => `${m.getType()}: ${m.content}`)
        .join("\n")}`;

      const summary = await model.invoke([new HumanMessage(prompt)]);

      return {
        messages: [
          new SystemMessage(`Previous conversation: ${summary.content}`),
          ...messages.slice(-2),
        ],
      };
    }

    return {};
  })
  .addEdge("__start__", "agent")
  .addEdge("agent", "summarize")
  .addEdge("summarize", "__end__");
```

**Summarization Strategies:**

1. **Full History** - Summarize all, keep none
2. **Rolling Window** - Keep recent, summarize old
3. **Incremental** - Update existing summary
4. **Hierarchical** - Summarize chunks, then summarize summaries

**Using Summarizer Utility:**

```typescript
import { Summarizer } from "./core/summarizer.js";

const summarizer = new Summarizer({
  model,
  maxTokensBeforeSummary: 4000,
  messagesToKeep: 10,
});

// Check if summarization needed
if (summarizer.shouldSummarize(messages)) {
  const result = await summarizer.summarize(messages);
  console.log(result.summary);
}

// Or get messages with summary automatically
const messagesWithSummary = await summarizer.createMessagesWithSummary(messages);
```

## Memory Access

Access and modify memory in different parts of your agent.

### In Tools

#### Read Memory in Tools

Access state via `config.configurable`:

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const getUserInfo = tool(
  async (_, config) => {
    const userId = config?.configurable?.userId;
    const userName = config?.configurable?.userName;

    return `User: ${userName} (ID: ${userId})`;
  },
  {
    name: "get_user_info",
    description: "Get current user information",
    schema: z.object({}),
  }
);

// Use tool with state context
await agent.invoke(
  { messages: [{ role: "user", content: "Get my info" }] },
  {
    configurable: {
      thread_id: "thread_1",
      userId: "user_123",
      userName: "Alice",
    },
  }
);
```

#### Write Memory from Tools

Update state using `Command`:

```typescript
import { tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

const updatePreferences = tool(
  async ({ theme, language }) => {
    // Return Command to update state
    return new Command({
      update: {
        preferences: { theme, language },
      },
    });
  },
  {
    name: "update_preferences",
    description: "Update user preferences",
    schema: z.object({
      theme: z.string(),
      language: z.string(),
    }),
  }
);
```

**Important Pattern:** Tools write to state using `Command`, not by returning state directly.

### In Prompts

Create dynamic prompts based on state:

```typescript
const workflow = new StateGraph(UserContextAnnotation)
  .addNode("agent", async (state, config) => {
    const userName = state.userName || "User";
    const userRole = state.userRole || "user";

    // Dynamic system message from state
    const systemPrompt = new SystemMessage(
      `You are a helpful assistant.
       Current user: ${userName}
       User role: ${userRole}

       Tailor responses to the user's role.`
    );

    const messages = [systemPrompt, ...state.messages];
    const response = await model.invoke(messages);
    return { messages: [response] };
  })
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");
```

**Use Cases:**
- Personalized instructions
- Role-based behavior
- Context injection
- Dynamic constraints

## Hooks

Process state before and after model calls.

### Before Model Hooks

Execute before the model is called:

```typescript
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("beforeModel", async (state) => {
    console.log(`Processing ${state.messages.length} messages`);

    // Trim messages
    const trimmed = await trimMessages(state.messages, {
      maxTokens: 200,
      strategy: "last",
      tokenCounter: (msgs) => msgs.length,
    });

    return { messages: trimmed };
  })
  .addNode("agent", async (state) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addEdge("__start__", "beforeModel")
  .addEdge("beforeModel", "agent")
  .addEdge("agent", "__end__");
```

**Common Uses:**
- Trim/filter messages
- Validate input
- Add context
- Inject system prompts
- Log requests

### After Model Hooks

Execute after the model responds:

```typescript
const MetricsAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  requestCount: Annotation<number>({
    reducer: (prev, curr) => (curr !== undefined ? curr : prev),
    default: () => 0,
  }),
});

const workflow = new StateGraph(MetricsAnnotation)
  .addNode("agent", async (state) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addNode("afterModel", (state) => {
    const newCount = state.requestCount + 1;
    console.log(`Request count: ${newCount}`);

    // Validate response
    const lastMessage = state.messages[state.messages.length - 1];
    const content = typeof lastMessage.content === "string"
      ? lastMessage.content
      : "";

    // Filter sensitive content
    if (content.includes("confidential")) {
      return {
        requestCount: newCount,
        messages: [new RemoveMessage({ id: lastMessage.id! })],
      };
    }

    return { requestCount: newCount };
  })
  .addEdge("__start__", "agent")
  .addEdge("agent", "afterModel")
  .addEdge("afterModel", "__end__");
```

**Common Uses:**
- Filter/validate responses
- Update metrics
- Remove sensitive content
- Log responses
- Trigger side effects

### Combined Hooks

Use both for complete request lifecycle:

```typescript
const workflow = new StateGraph(MetricsAnnotation)
  .addNode("beforeModel", (state) => {
    // Pre-processing
    return { inputTokens: calculateTokens(state.messages) };
  })
  .addNode("agent", async (state) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addNode("afterModel", (state) => {
    // Post-processing
    return { outputTokens: calculateOutputTokens(state.messages) };
  })
  .addEdge("__start__", "beforeModel")
  .addEdge("beforeModel", "agent")
  .addEdge("agent", "afterModel")
  .addEdge("afterModel", "__end__");
```

## Best Practices

### 1. Choose the Right Checkpointer

**Development:**
```typescript
const checkpointer = new MemorySaver();
```

**Production:**
```typescript
const checkpointer = PostgresSaver.fromConnString(process.env.DB_URI);
await checkpointer.setup();
```

### 2. Manage Context Windows

Set token limits to 70-80% of model's maximum:

```typescript
const trimConfig = {
  maxTokens: Math.floor(MODEL_MAX_TOKENS * 0.7),
  strategy: "last",
  tokenCounter: accurateTokenCounter,
};
```

### 3. Use Appropriate Memory Strategy

| Conversation Length | Strategy | Reason |
|---------------------|----------|--------|
| Short (< 10 messages) | No management | Fits in context |
| Medium (10-50 messages) | Trim messages | Fast, simple |
| Long (50+ messages) | Summarize | Preserve context |
| Very long (100+ messages) | Hierarchical summary | Best compression |

### 4. Validate Message Sequences

```typescript
import { MemoryManager } from "./core/memory-manager.js";

const validation = MemoryManager.validateSequence(messages);
if (!validation.valid) {
  console.error("Invalid sequence:", validation.errors);
}
```

### 5. Thread Management

```typescript
import { CheckpointerUtils } from "./core/memory-manager.js";

// Generate unique thread IDs
const threadId = CheckpointerUtils.generateThreadId("user_session");

// Include user context
const config = CheckpointerUtils.createThreadConfig(threadId, userId);
```

### 6. State Schema Design

```typescript
// ✅ Good - clear, typed, with reducers
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userId: Annotation<string>(),
  preferences: Annotation<Record<string, any>>({
    reducer: (prev, curr) => ({ ...prev, ...curr }),
  }),
});

// ❌ Avoid - no types, unclear merge behavior
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  data: Annotation<any>(),
});
```

### 7. Error Handling

```typescript
try {
  const response = await agent.invoke(input, config);
} catch (error) {
  if (error.message.includes("context_length_exceeded")) {
    // Aggressive trimming or summarization
    console.log("Context limit exceeded, applying aggressive trimming");
  }
  throw error;
}
```

### 8. Performance Monitoring

```typescript
const MetricsAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  metrics: Annotation<{
    messageCount: number;
    totalTokens: number;
    lastSummarized: Date | null;
  }>({
    reducer: (prev, curr) => ({ ...prev, ...curr }),
    default: () => ({
      messageCount: 0,
      totalTokens: 0,
      lastSummarized: null,
    }),
  }),
});
```

### 9. Security Considerations

```typescript
// Filter sensitive data before storage
const cleanupHook = (state) => {
  const sensitivePatterns = [/password/i, /api[_-]?key/i, /secret/i];

  const cleaned = state.messages.filter((msg) => {
    const content = typeof msg.content === "string" ? msg.content : "";
    return !sensitivePatterns.some((pattern) => pattern.test(content));
  });

  return { messages: cleaned };
};
```

### 10. Testing Memory

```typescript
import { describe, test, expect } from "bun:test";

describe("Memory Persistence", () => {
  test("should remember across turns", async () => {
    const config = { configurable: { thread_id: "test_1" } };

    await agent.invoke(
      { messages: [{ role: "user", content: "My name is Alice" }] },
      config
    );

    const response = await agent.invoke(
      { messages: [{ role: "user", content: "What's my name?" }] },
      config
    );

    expect(response.messages.some(m =>
      m.content?.toString().toLowerCase().includes("alice")
    )).toBe(true);
  });
});
```

## API Reference

### MemoryManager

Utility class for memory operations.

```typescript
import { MemoryManager } from "./core/memory-manager.js";

// Trim messages
const trimmed = await MemoryManager.trim(messages, config);

// Delete by IDs
const removeMessages = MemoryManager.deleteByIds(messages, ["id1", "id2"]);

// Delete by range
const removeMessages = MemoryManager.deleteByRange(messages, 0, 5);

// Delete by condition
const removeMessages = MemoryManager.deleteByCondition(
  messages,
  (msg) => msg.content.includes("sensitive")
);

// Get statistics
const stats = MemoryManager.getStats(messages);

// Validate sequence
const validation = MemoryManager.validateSequence(messages);

// Filter by type
const humanOnly = MemoryManager.filterByType(messages, ["human"]);

// Get recent
const recent = MemoryManager.getRecent(messages, 5);

// Remove duplicates
const unique = MemoryManager.removeDuplicates(messages);
```

### Summarizer

Utility class for summarization.

```typescript
import { Summarizer, SummarizationStrategies } from "./core/summarizer.js";

// Create summarizer
const summarizer = new Summarizer({
  model,
  maxTokensBeforeSummary: 4000,
  messagesToKeep: 10,
  summaryPrompt: "Summarize concisely:",
  incrementalSummary: false,
});

// Check if summarization needed
if (summarizer.shouldSummarize(messages)) {
  const result = await summarizer.summarize(messages);
}

// Get messages with summary
const messagesWithSummary = await summarizer.createMessagesWithSummary(messages);

// Reset summarizer
summarizer.reset();

// Strategies
const fullHistorySummarizer = SummarizationStrategies.fullHistory({ model });
const rollingSummarizer = SummarizationStrategies.rollingWindow({ model, windowSize: 10 });
const hierarchicalSummary = await SummarizationStrategies.hierarchical(messages, model, 20);
```

### CheckpointerUtils

Utility class for checkpointer operations.

```typescript
import { CheckpointerUtils } from "./core/memory-manager.js";

// Create thread config
const config = CheckpointerUtils.createThreadConfig("thread_123", "user_456");

// Generate thread ID
const threadId = CheckpointerUtils.generateThreadId("custom_prefix");

// Check availability
const hasCheckpointer = CheckpointerUtils.isCheckpointerAvailable(checkpointer);
```

### StateUtils

Utility class for state operations.

```typescript
import { StateUtils } from "./core/memory-manager.js";

// Merge state
const merged = StateUtils.mergeState(currentState, updateState);

// Deep merge
const deepMerged = StateUtils.deepMergeState(currentState, updateState);

// Validate state
const validation = StateUtils.validateState(state, ["userId", "userName"]);
```

## Examples

All examples are available in the `examples/` directory:

1. **01-basic-checkpointer.ts** - Basic memory with MemorySaver
2. **02-postgres-checkpointer.ts** - Production PostgreSQL setup
3. **03-custom-state.ts** - Custom state schemas
4. **04-trim-messages.ts** - Message trimming strategies
5. **05-delete-messages.ts** - Message deletion patterns
6. **06-summarize-messages.ts** - Conversation summarization
7. **07-memory-in-tools.ts** - Reading/writing memory in tools
8. **08-memory-in-prompts.ts** - Dynamic prompts from state
9. **09-hooks.ts** - Before/after model hooks

Run the demo:
```bash
bun --env-file=.env lessons/langchain/core-concepts/short-term-memory/demo.ts
```

Run tests:
```bash
bun test lessons/langchain/core-concepts/short-term-memory/tests/
```

## Summary

Short-term memory in LangChain provides:

✅ **Thread-level persistence** - Isolated conversations
✅ **State management** - Custom fields beyond messages
✅ **Context window management** - Trim, delete, summarize
✅ **Production-ready** - PostgreSQL persistence
✅ **Flexible access** - Tools, prompts, hooks
✅ **Type-safe** - Full TypeScript support

Key takeaways:
- Always use checkpointers in production
- Manage context windows proactively
- Choose appropriate memory strategies
- Use custom state for application data
- Test memory behavior thoroughly

## Additional Resources

- [LangChain Documentation](https://docs.langchain.com)
- [LangGraph Checkpointers](https://langchain-ai.github.io/langgraphjs/)
- [Message Management Guide](https://js.langchain.com/docs/how_to/trim_messages/)
- [State Management](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#state)

---

**Next Steps:**
- Explore long-term memory patterns
- Learn about vector store integration
- Study advanced agent architectures
- Build production applications
