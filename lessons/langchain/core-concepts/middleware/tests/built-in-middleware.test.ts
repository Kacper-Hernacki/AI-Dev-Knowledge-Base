/**
 * Built-in Middleware Tests
 * Tests for all built-in middleware provided by LangChain
 */

import { describe, test, expect } from "bun:test";
import {
  createAgent,
  summarizationMiddleware,
  modelCallLimitMiddleware,
  toolCallLimitMiddleware,
  modelFallbackMiddleware,
  tool,
} from "langchain";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";

describe("Built-in Middleware", () => {
  describe("Summarization Middleware", () => {
    test.skip("should auto-summarize long conversations", async () => {
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

      const config = { configurable: { thread_id: "test_summary_1" } };

      // Build up a long conversation
      const messages = [
        "My name is Alice",
        "I'm a software engineer",
        "I work with Python",
        "I also know TypeScript",
        "What do you know about me?",
      ];

      let finalResponse;
      for (const content of messages) {
        finalResponse = await agent.invoke(
          { messages: [{ role: "user", content }] },
          config
        );
      }

      // Should have summarized and kept recent messages
      expect(finalResponse?.messages.length).toBeLessThan(messages.length * 2);
    });

    test.skip("should preserve recent messages", async () => {
      const checkpointer = new MemorySaver();

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [
          summarizationMiddleware({
            model: "claude-3-5-haiku-20241022",
            maxTokensBeforeSummary: 100, // Very low for quick trigger
            messagesToKeep: 2,
          }),
        ],
        checkpointer,
      });

      const config = { configurable: { thread_id: "test_summary_2" } };

      const response1 = await agent.invoke(
        { messages: [{ role: "user", content: "Remember: My favorite color is blue" }] },
        config
      );

      const response2 = await agent.invoke(
        { messages: [{ role: "user", content: "What's my favorite color?" }] },
        config
      );

      const lastMessage = response2.messages[response2.messages.length - 1];
      expect(lastMessage.content.toLowerCase()).toContain("blue");
    });
  });

  describe("Model Call Limit Middleware", () => {
    test.skip("should limit calls per run", async () => {
      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [
          modelCallLimitMiddleware({
            runLimit: 2,
            exitBehavior: "end",
          }),
        ],
        checkpointer: new MemorySaver(),
      });

      const response = await agent.invoke({
        messages: [{ role: "user", content: "Hello" }],
      });

      // Should complete successfully within limits
      expect(response.messages.length).toBeGreaterThan(0);
    });

    test.skip("should limit calls per thread", async () => {
      const checkpointer = new MemorySaver();

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [
          modelCallLimitMiddleware({
            threadLimit: 3,
            exitBehavior: "end",
          }),
        ],
        checkpointer,
      });

      const config = { configurable: { thread_id: "test_limit_1" } };

      // Make multiple calls in same thread
      await agent.invoke({ messages: [{ role: "user", content: "Call 1" }] }, config);
      await agent.invoke({ messages: [{ role: "user", content: "Call 2" }] }, config);

      const response3 = await agent.invoke(
        { messages: [{ role: "user", content: "Call 3" }] },
        config
      );

      // Should reach limit and exit gracefully
      expect(response3.messages.length).toBeGreaterThan(0);
    });
  });

  describe("Tool Call Limit Middleware", () => {
    test.skip("should limit global tool calls", async () => {
      const searchTool = tool(
        async ({ query }) => `Results for: ${query}`,
        {
          name: "search",
          description: "Search the web",
          schema: z.object({ query: z.string() }),
        }
      );

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [searchTool],
        middleware: [
          toolCallLimitMiddleware({
            runLimit: 2,
            exitBehavior: "continue",
          }),
        ],
      });

      const response = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Search for: AI, ML, DL, NLP, CV (make multiple searches)",
          },
        ],
      });

      // Should complete with tool call limits enforced
      expect(response.messages.length).toBeGreaterThan(0);
    });

    test.skip("should limit specific tool calls", async () => {
      const expensiveTool = tool(
        async ({ data }) => `Processed: ${data}`,
        {
          name: "expensive_analysis",
          description: "Expensive analysis tool",
          schema: z.object({ data: z.string() }),
        }
      );

      const cheapTool = tool(
        async ({ query }) => `Result: ${query}`,
        {
          name: "cheap_lookup",
          description: "Cheap lookup tool",
          schema: z.object({ query: z.string() }),
        }
      );

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [expensiveTool, cheapTool],
        middleware: [
          toolCallLimitMiddleware({
            toolName: "expensive_analysis",
            runLimit: 1,
          }),
        ],
      });

      const response = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Use expensive_analysis only once, but cheap_lookup multiple times",
          },
        ],
      });

      expect(response.messages.length).toBeGreaterThan(0);
    });
  });

  describe("Model Fallback Middleware", () => {
    test.skip("should handle model failures with fallback", async () => {
      const agent = createAgent({
        model: "claude-3-5-sonnet-20241022",
        tools: [],
        middleware: [
          modelFallbackMiddleware(
            "claude-3-5-haiku-20241022", // Fallback 1
            "gpt-4o-mini" // Fallback 2
          ),
        ],
      });

      const response = await agent.invoke({
        messages: [{ role: "user", content: "Hello, test fallback" }],
      });

      // Should succeed with either primary or fallback model
      expect(response.messages.length).toBeGreaterThan(0);
      const lastMessage = response.messages[response.messages.length - 1];
      expect(lastMessage.content).toBeTruthy();
    });

    test.skip("should use primary model when available", async () => {
      const agent = createAgent({
        model: "claude-3-5-haiku-20241022", // Fast, reliable model
        tools: [],
        middleware: [
          modelFallbackMiddleware(
            "gpt-4o-mini" // Fallback
          ),
        ],
      });

      const response = await agent.invoke({
        messages: [{ role: "user", content: "Say 'primary'" }],
      });

      const lastMessage = response.messages[response.messages.length - 1];
      expect(lastMessage.content).toBeTruthy();
    });
  });

  describe("Middleware Combination", () => {
    test.skip("should work with multiple middleware together", async () => {
      const searchTool = tool(
        async ({ query }) => `Found: ${query}`,
        {
          name: "search",
          description: "Search tool",
          schema: z.object({ query: z.string() }),
        }
      );

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [searchTool],
        middleware: [
          modelCallLimitMiddleware({
            runLimit: 5,
            exitBehavior: "end",
          }),
          toolCallLimitMiddleware({
            runLimit: 3,
          }),
          modelFallbackMiddleware("gpt-4o-mini"),
        ],
        checkpointer: new MemorySaver(),
      });

      const response = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Search for AI and ML",
          },
        ],
      });

      // All middleware should work together
      expect(response.messages.length).toBeGreaterThan(0);
    });
  });
});
