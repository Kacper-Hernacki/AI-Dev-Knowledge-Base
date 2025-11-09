# Streaming in LangChain

## Table of Contents

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Stream Modes](#stream-modes)
- [Agent Progress](#agent-progress)
- [Token Streaming](#token-streaming)
- [Custom Updates](#custom-updates)
- [Multiple Modes](#multiple-modes)
- [Controlling Streaming](#controlling-streaming)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Introduction

Streaming is crucial for enhancing the responsiveness of applications built on LLMs. By displaying output progressively, even before a complete response is ready, streaming significantly improves user experience (UX), particularly when dealing with the latency of LLMs.

### What is Streaming?

LangChain's streaming system lets you surface live feedback from agent runs:

- **Agent Progress** - State updates after each agent step
- **LLM Tokens** - Stream tokens as they're generated
- **Custom Updates** - Emit user-defined signals from tools
- **Multiple Modes** - Combine different streaming modes

### Why Streaming Matters

Without streaming:
```typescript
// User waits for complete response
await agent.invoke({ messages: "Write a long essay" });
// Response appears all at once after 30 seconds
```

With streaming:
```typescript
// User sees progressive output
for await (const [token] of await agent.stream(
  { messages: "Write a long essay" },
  { streamMode: "messages" }
)) {
  // Display tokens as they arrive - much better UX!
  displayToken(token);
}
```

## Quick Start

### Basic Token Streaming

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  tools: [],
});

// Stream tokens as they're generated
for await (const [token, metadata] of await agent.stream(
  {
    messages: [{ role: "user", content: "Tell me a story" }],
  },
  { streamMode: "messages" }
)) {
  if (token.contentBlocks) {
    for (const block of token.contentBlocks) {
      if (block.type === "text") {
        process.stdout.write(block.text); // Display immediately
      }
    }
  }
}
```

### Agent Progress Streaming

```typescript
// Stream agent step updates
for await (const chunk of await agent.stream(
  {
    messages: [{ role: "user", content: "What's the weather?" }],
  },
  { streamMode: "updates" }
)) {
  const [step, content] = Object.entries(chunk)[0];
  console.log(`Step: ${step}`); // "model", "tools", etc.
}
```

## Stream Modes

LangChain supports three streaming modes:

| Mode | Purpose | Returns |
|------|---------|---------|
| `"updates"` | Agent step progress | Map of node name to state update |
| `"messages"` | LLM token streaming | `[token, metadata]` tuples |
| `"custom"` | Tool progress updates | Custom string messages |

### Choosing a Mode

```typescript
// Agent progress only
{ streamMode: "updates" }

// Token streaming only
{ streamMode: "messages" }

// Custom updates only
{ streamMode: "custom" }

// Multiple modes
{ streamMode: ["updates", "messages", "custom"] }
```

## Agent Progress

Stream state updates after each agent step.

### Basic Agent Progress

```typescript
import { z } from "zod";
import { createAgent, tool } from "langchain";

const getWeather = tool(
  async ({ city }) => {
    return `The weather in ${city} is sunny!`;
  },
  {
    name: "get_weather",
    description: "Get weather for a city",
    schema: z.object({ city: z.string() }),
  }
);

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  tools: [getWeather],
});

for await (const chunk of await agent.stream(
  {
    messages: [{ role: "user", content: "What's the weather in SF?" }],
  },
  { streamMode: "updates" }
)) {
  const [step, content] = Object.entries(chunk)[0];
  console.log(`Node: ${step}`);
  // Output: "model", "tools", "model"
}
```

### What Gets Streamed

With `streamMode: "updates"`, you receive:

1. **Model Node** - LLM responses and tool call requests
2. **Tools Node** - Tool execution results
3. **Final Model Node** - Final response after tools

**Example Flow:**
```
Step 1: model → AIMessage with tool call
Step 2: tools → ToolMessage with result
Step 3: model → Final AIMessage response
```

### Use Cases

- Progress indicators in UI
- Debugging agent execution
- Real-time logging
- Step-by-step visualization

## Token Streaming

Stream LLM tokens as they're generated for immediate feedback.

### Basic Token Streaming

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  tools: [],
});

for await (const [token, metadata] of await agent.stream(
  {
    messages: [{ role: "user", content: "Write a poem" }],
  },
  { streamMode: "messages" }
)) {
  // token contains contentBlocks with text chunks
  if (token.contentBlocks) {
    for (const block of token.contentBlocks) {
      if (block.type === "text") {
        process.stdout.write(block.text); // Typewriter effect
      }
    }
  }
}
```

### Token Metadata

Each token comes with metadata:

```typescript
for await (const [token, metadata] of await agent.stream(
  { messages: "Hello" },
  { streamMode: "messages" }
)) {
  console.log(metadata.langgraph_node); // Which node is streaming
  console.log(token.contentBlocks);      // The content blocks
}
```

### Content Block Types

```typescript
if (block.type === "text") {
  // Text content
  console.log(block.text);
} else if (block.type === "tool_use") {
  // Tool call
  console.log(block.name);  // Tool name
  console.log(block.input); // Tool arguments
}
```

### Use Cases

- Typewriter effect in chat UI
- Progressive content display
- Reduced perceived latency
- Real-time feedback

## Custom Updates

Stream custom updates from tools during execution.

### Basic Custom Updates

```typescript
import { z } from "zod";
import { tool, createAgent } from "langchain";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

const fetchData = tool(
  async ({ source }, config: LangGraphRunnableConfig) => {
    // Emit custom updates
    config.writer?.(`Connecting to ${source}...`);
    await someAsyncOperation();

    config.writer?.(`Downloading data...`);
    await download();

    config.writer?.(`Complete!`);

    return `Data from ${source}`;
  },
  {
    name: "fetch_data",
    description: "Fetch data from a source",
    schema: z.object({ source: z.string() }),
  }
);

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  tools: [fetchData],
});

for await (const chunk of await agent.stream(
  {
    messages: [{ role: "user", content: "Fetch data from API" }],
  },
  { streamMode: "custom" }
)) {
  console.log(chunk); // Your custom messages
}
```

**Output:**
```
Connecting to API...
Downloading data...
Complete!
```

### Progress Tracking

```typescript
const processRecords = tool(
  async ({ count }, config: LangGraphRunnableConfig) => {
    const total = parseInt(count);

    for (let i = 1; i <= total; i++) {
      config.writer?.(`Processing ${i}/${total}`);
      await processRecord(i);
    }

    return `Processed ${total} records`;
  },
  {
    name: "process_records",
    description: "Process records",
    schema: z.object({ count: z.string() }),
  }
);
```

**Output:**
```
Processing 1/10
Processing 2/10
...
Processing 10/10
```

### Important Notes

- Tools with `writer` can't be invoked outside LangGraph
- Always check if `config.writer` exists before using
- Design tools to work with/without writer

```typescript
// Good pattern
config.writer?.("Progress update");

// Will error outside LangGraph if writer is required
config.writer("Progress update"); // Don't do this
```

### Use Cases

- Long-running operations
- Multi-step processes
- File uploads/downloads
- External API calls
- Data processing pipelines

## Multiple Modes

Stream multiple modes simultaneously for comprehensive monitoring.

### Streaming All Modes

```typescript
for await (const [streamMode, chunk] of await agent.stream(
  {
    messages: [{ role: "user", content: "Analyze data" }],
  },
  { streamMode: ["updates", "messages", "custom"] }
)) {
  switch (streamMode) {
    case "updates":
      const [step, content] = Object.entries(chunk)[0];
      console.log(`Step: ${step}`);
      break;

    case "messages":
      const [token, metadata] = chunk;
      // Handle tokens
      break;

    case "custom":
      console.log(`Progress: ${chunk}`);
      break;
  }
}
```

### Building a Monitor

```typescript
const monitor = {
  steps: [] as string[],
  tokens: 0,
  customUpdates: [] as string[],
  startTime: Date.now(),
};

for await (const [streamMode, chunk] of await agent.stream(
  { messages: "Process data" },
  { streamMode: ["updates", "messages", "custom"] }
)) {
  if (streamMode === "updates") {
    const [step] = Object.entries(chunk)[0];
    monitor.steps.push(step);
  } else if (streamMode === "messages") {
    const [token] = chunk;
    if (token.contentBlocks) {
      monitor.tokens += token.contentBlocks.length;
    }
  } else if (streamMode === "custom") {
    monitor.customUpdates.push(chunk);
  }
}

const duration = Date.now() - monitor.startTime;
console.log(`Completed in ${duration}ms`);
console.log(`Steps: ${monitor.steps.length}`);
console.log(`Tokens: ${monitor.tokens}`);
console.log(`Updates: ${monitor.customUpdates.length}`);
```

### Use Cases

- Complete execution monitoring
- Building dashboards
- Debug views
- Rich progress indicators

### Trade-offs

- **More data** = more processing overhead
- Choose modes based on your needs
- Consider network impact
- Balance detail vs. performance

## Controlling Streaming

### Disable Streaming

Disable token streaming for specific models:

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const modelNoStream = new ChatAnthropic({
  model: "claude-3-5-haiku-20241022",
  streaming: false, // Disable streaming
});

const agent = createAgent({
  model: modelNoStream,
  tools: [],
});

// Tokens arrive all at once instead of incrementally
for await (const [token] of await agent.stream(
  { messages: "Hello" },
  { streamMode: "messages" }
)) {
  // Complete response in one chunk
  console.log(token.contentBlocks);
}
```

### When to Disable Streaming

**Disable for:**
- Background processing
- Batch operations
- Non-user-facing agents
- Testing and debugging
- Cached responses

**Enable for:**
- Direct user interactions
- Long responses
- Interactive chat
- Real-time feedback

### Multi-Agent Scenarios

```typescript
// Background agent - no streaming needed
const backgroundAgent = createAgent({
  model: new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    streaming: false,
  }),
  tools: [],
});

// Main agent - user-facing with streaming
const mainAgent = createAgent({
  model: new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    streaming: true,
  }),
  tools: [],
});

// Use mainAgent for user interactions
// Use backgroundAgent for internal processing
```

## Best Practices

### 1. Choose the Right Mode

```typescript
// For UI feedback
{ streamMode: "messages" }

// For debugging
{ streamMode: "updates" }

// For progress tracking
{ streamMode: "custom" }

// For comprehensive monitoring
{ streamMode: ["updates", "messages", "custom"] }
```

### 2. Handle Errors Gracefully

```typescript
try {
  for await (const [token] of await agent.stream(
    { messages: "Hello" },
    { streamMode: "messages" }
  )) {
    displayToken(token);
  }
} catch (error) {
  console.error("Streaming failed:", error);
  showErrorMessage();
}
```

### 3. Buffer Tokens for Smooth Display

```typescript
let buffer = "";

for await (const [token] of await agent.stream(
  { messages: "Write a story" },
  { streamMode: "messages" }
)) {
  if (token.contentBlocks) {
    for (const block of token.contentBlocks) {
      if (block.type === "text") {
        buffer += block.text;

        // Display in complete words
        const words = buffer.split(" ");
        if (words.length > 1) {
          display(words.slice(0, -1).join(" ") + " ");
          buffer = words[words.length - 1];
        }
      }
    }
  }
}

// Display remaining buffer
if (buffer) {
  display(buffer);
}
```

### 4. Track Metadata

```typescript
for await (const [token, metadata] of await agent.stream(
  { messages: "Hello" },
  { streamMode: "messages" }
)) {
  console.log(`Node: ${metadata.langgraph_node}`);
  console.log(`Token: ${token.contentBlocks}`);
}
```

### 5. Design Tools with Optional Writer

```typescript
const myTool = tool(
  async (input, config: LangGraphRunnableConfig) => {
    // Optional progress updates
    config.writer?.("Starting...");

    const result = await doWork(input);

    config.writer?.("Complete!");

    return result;
  },
  {
    name: "my_tool",
    description: "Does work",
    schema: z.object({ input: z.string() }),
  }
);
```

## API Reference

### Stream Modes

```typescript
type StreamMode = "updates" | "messages" | "custom";

// Single mode
{ streamMode: "messages" }

// Multiple modes
{ streamMode: ["updates", "messages", "custom"] }
```

### Stream Return Types

**updates mode:**
```typescript
for await (const chunk of stream) {
  const [nodeName, stateUpdate] = Object.entries(chunk)[0];
  // nodeName: string (e.g., "model", "tools")
  // stateUpdate: { messages: Message[] }
}
```

**messages mode:**
```typescript
for await (const [token, metadata] of stream) {
  // token: { contentBlocks: ContentBlock[] }
  // metadata: { langgraph_node: string }
}
```

**custom mode:**
```typescript
for await (const update of stream) {
  // update: string (your custom message)
}
```

**multiple modes:**
```typescript
for await (const [mode, data] of stream) {
  // mode: "updates" | "messages" | "custom"
  // data: varies by mode
}
```

### Content Block Types

```typescript
type ContentBlock = TextBlock | ToolUseBlock;

interface TextBlock {
  type: "text";
  text: string;
}

interface ToolUseBlock {
  type: "tool_use";
  name: string;
  input: Record<string, any>;
  id: string;
}
```

### Writer Function

```typescript
import { LangGraphRunnableConfig } from "@langchain/langgraph";

const tool = tool(
  async (input, config: LangGraphRunnableConfig) => {
    // writer is optional
    config.writer?.("Progress message");
    // writer signature: (message: string) => void
  },
  // ... tool config
);
```

## Examples

- `examples/01-agent-progress.ts` - Agent step streaming
- `examples/02-token-streaming.ts` - LLM token streaming
- `examples/03-custom-updates.ts` - Custom progress updates
- `examples/04-multiple-modes.ts` - Multiple streaming modes
- `examples/05-disable-streaming.ts` - Controlling streaming

## Common Patterns

### Pattern: Real-time Chat UI

```typescript
async function streamChat(message: string) {
  for await (const [token] of await agent.stream(
    { messages: [{ role: "user", content: message }] },
    { streamMode: "messages" }
  )) {
    if (token.contentBlocks) {
      for (const block of token.contentBlocks) {
        if (block.type === "text") {
          updateChatUI(block.text); // Append to UI
        }
      }
    }
  }
}
```

### Pattern: Progress Bar

```typescript
const progressTool = tool(
  async ({ items }, config: LangGraphRunnableConfig) => {
    const total = items.length;

    for (let i = 0; i < total; i++) {
      const progress = Math.round(((i + 1) / total) * 100);
      config.writer?.(`Progress: ${progress}%`);
      await processItem(items[i]);
    }

    return "Complete";
  },
  // ... tool config
);

for await (const update of await agent.stream(
  { messages: "Process my items" },
  { streamMode: "custom" }
)) {
  updateProgressBar(update); // Update UI progress bar
}
```

### Pattern: Debug Monitor

```typescript
const debug = {
  steps: [] as string[],
  tokens: [] as string[],
  updates: [] as string[],
};

for await (const [mode, data] of await agent.stream(
  { messages: query },
  { streamMode: ["updates", "messages", "custom"] }
)) {
  switch (mode) {
    case "updates":
      const [step] = Object.entries(data)[0];
      debug.steps.push(step);
      console.log(`[STEP] ${step}`);
      break;

    case "messages":
      const [token] = data;
      if (token.contentBlocks) {
        token.contentBlocks.forEach((block: any) => {
          if (block.type === "text") {
            debug.tokens.push(block.text);
            console.log(`[TOKEN] ${block.text}`);
          }
        });
      }
      break;

    case "custom":
      debug.updates.push(data);
      console.log(`[CUSTOM] ${data}`);
      break;
  }
}

// Full execution trace available in debug object
console.log(JSON.stringify(debug, null, 2));
```

## Troubleshooting

### Issue: No Tokens Streaming

**Problem:** Tokens arrive all at once

**Solution:** Ensure streaming is enabled
```typescript
const model = new ChatAnthropic({
  model: "claude-3-5-haiku-20241022",
  streaming: true, // Must be true
});
```

### Issue: Writer Not Working

**Problem:** `config.writer` is undefined

**Solution:** Only use writer inside LangGraph execution
```typescript
// Won't work
await myTool.invoke({ input: "test" });

// Works
await agent.invoke({ messages: "use my tool" });
```

### Issue: Too Much Data

**Problem:** Streaming all modes is overwhelming

**Solution:** Choose only the modes you need
```typescript
// Instead of all modes
{ streamMode: ["updates", "messages", "custom"] }

// Just what you need
{ streamMode: "messages" }
```

---

**Next Steps:**
- Try the examples in `examples/`
- Run tests with: `bun test lessons/langchain/core-concepts/streaming/tests/`
- Check out the [demo](./demo.ts) for a full walkthrough
