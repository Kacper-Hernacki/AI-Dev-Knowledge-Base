/**
 * Integration tests for streaming
 */

import { describe, test, expect } from "bun:test";
import { z } from "zod";
import { createAgent, tool } from "langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

// Skip if no API key
const skipIfNoKey = !process.env.ANTHROPIC_API_KEY;

describe("Streaming", () => {
  test.skip("should stream agent progress updates", async () => {
    const getWeather = tool(
      async ({ city }) => {
        return `The weather in ${city} is sunny`;
      },
      {
        name: "get_weather",
        description: "Get weather",
        schema: z.object({ city: z.string() }),
      }
    );

    const agent = createAgent({
      model: "claude-3-5-haiku-20241022",
      tools: [getWeather],
    });

    const steps: string[] = [];

    for await (const chunk of await agent.stream(
      {
        messages: [{ role: "user", content: "what's the weather in SF" }],
      },
      { streamMode: "updates" }
    )) {
      const [step] = Object.entries(chunk)[0];
      steps.push(step);
    }

    expect(steps.length).toBeGreaterThan(0);
    expect(steps).toContain("model");
  }, 30000);

  test.skip("should stream tokens from LLM", async () => {
    const agent = createAgent({
      model: "claude-3-5-haiku-20241022",
      tools: [],
    });

    let tokenCount = 0;

    for await (const [token, metadata] of await agent.stream(
      {
        messages: [{ role: "user", content: "Count to 5" }],
      },
      { streamMode: "messages" }
    )) {
      if (token.contentBlocks) {
        tokenCount += token.contentBlocks.length;
      }
    }

    expect(tokenCount).toBeGreaterThan(0);
  }, 30000);

  test.skip("should stream custom updates from tools", async () => {
    const mockTool = tool(
      async (_, config: LangGraphRunnableConfig) => {
        config.writer?.("Step 1 complete");
        config.writer?.("Step 2 complete");
        return "Done";
      },
      {
        name: "mock_tool",
        description: "Mock tool",
        schema: z.object({}),
      }
    );

    const agent = createAgent({
      model: "claude-3-5-haiku-20241022",
      tools: [mockTool],
    });

    const customUpdates: string[] = [];

    for await (const chunk of await agent.stream(
      {
        messages: [{ role: "user", content: "Run the mock tool" }],
      },
      { streamMode: "custom" }
    )) {
      customUpdates.push(chunk);
    }

    expect(customUpdates.length).toBeGreaterThan(0);
    expect(customUpdates).toContain("Step 1 complete");
    expect(customUpdates).toContain("Step 2 complete");
  }, 30000);

  test.skip("should handle multiple stream modes", async () => {
    const agent = createAgent({
      model: "claude-3-5-haiku-20241022",
      tools: [],
    });

    const modes = new Set<string>();

    for await (const [streamMode, chunk] of await agent.stream(
      {
        messages: [{ role: "user", content: "Hello" }],
      },
      { streamMode: ["updates", "messages"] }
    )) {
      modes.add(streamMode);
    }

    expect(modes.has("updates")).toBe(true);
    expect(modes.has("messages")).toBe(true);
  }, 30000);

  test.skip("should work with streaming disabled", async () => {
    const modelNoStream = new ChatAnthropic({
      model: "claude-3-5-haiku-20241022",
      streaming: false,
    });

    const agent = createAgent({
      model: modelNoStream,
      tools: [],
    });

    let chunkCount = 0;

    for await (const [token] of await agent.stream(
      {
        messages: [{ role: "user", content: "Hello" }],
      },
      { streamMode: "messages" }
    )) {
      chunkCount++;
    }

    // With streaming disabled, should get complete response in one chunk
    expect(chunkCount).toBe(1);
  }, 30000);

  test.skip("should stream tool calls and results", async () => {
    const calculate = tool(
      async ({ a, b }) => {
        return `${a} + ${b} = ${a + b}`;
      },
      {
        name: "calculate",
        description: "Add two numbers",
        schema: z.object({
          a: z.number(),
          b: z.number(),
        }),
      }
    );

    const agent = createAgent({
      model: "claude-3-5-haiku-20241022",
      tools: [calculate],
    });

    let hasToolCall = false;
    let hasToolResult = false;

    for await (const chunk of await agent.stream(
      {
        messages: [{ role: "user", content: "Calculate 5 + 3" }],
      },
      { streamMode: "updates" }
    )) {
      const [step, content] = Object.entries(chunk)[0];

      if (step === "model" && content.messages[0].tool_calls) {
        hasToolCall = true;
      }

      if (step === "tools") {
        hasToolResult = true;
      }
    }

    expect(hasToolCall).toBe(true);
    expect(hasToolResult).toBe(true);
  }, 30000);
});
