/**
 * Custom Middleware Tests
 * Tests for custom middleware patterns and hooks
 */

import { describe, test, expect } from "bun:test";
import {
  createAgent,
  createMiddleware,
  tool,
  AIMessage,
  HumanMessage,
} from "langchain";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";

describe("Custom Middleware", () => {
  describe("Node-Style Hooks", () => {
    test.skip("should execute beforeModel hook", async () => {
      let beforeCalled = false;

      const testMiddleware = createMiddleware({
        name: "BeforeTestMiddleware",
        beforeModel: (state) => {
          beforeCalled = true;
          expect(state.messages.length).toBeGreaterThan(0);
          return;
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [testMiddleware],
      });

      await agent.invoke({
        messages: [{ role: "user", content: "Test" }],
      });

      expect(beforeCalled).toBe(true);
    });

    test.skip("should execute afterModel hook", async () => {
      let afterCalled = false;

      const testMiddleware = createMiddleware({
        name: "AfterTestMiddleware",
        afterModel: (state) => {
          afterCalled = true;
          expect(state.messages.length).toBeGreaterThan(0);
          return;
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [testMiddleware],
      });

      await agent.invoke({
        messages: [{ role: "user", content: "Test" }],
      });

      expect(afterCalled).toBe(true);
    });

    test.skip("should execute both before and after hooks", async () => {
      const callOrder: string[] = [];

      const testMiddleware = createMiddleware({
        name: "OrderTestMiddleware",
        beforeModel: (state) => {
          callOrder.push("before");
          return;
        },
        afterModel: (state) => {
          callOrder.push("after");
          return;
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [testMiddleware],
      });

      await agent.invoke({
        messages: [{ role: "user", content: "Test" }],
      });

      expect(callOrder).toEqual(["before", "after"]);
    });
  });

  describe("Wrap-Style Hooks", () => {
    test.skip("should intercept model calls", async () => {
      let wrapCalled = false;

      const testMiddleware = createMiddleware({
        name: "WrapTestMiddleware",
        wrapModelCall: (request, handler) => {
          wrapCalled = true;
          expect(request.messages).toBeDefined();
          return handler(request);
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [testMiddleware],
      });

      await agent.invoke({
        messages: [{ role: "user", content: "Test" }],
      });

      expect(wrapCalled).toBe(true);
    });

    test.skip("should allow request modification", async () => {
      const testMiddleware = createMiddleware({
        name: "ModifyRequestMiddleware",
        wrapModelCall: (request, handler) => {
          // Add a system message
          const modifiedRequest = {
            ...request,
            messages: [
              { role: "system" as const, content: "Be concise" },
              ...request.messages,
            ],
          };
          return handler(modifiedRequest);
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [testMiddleware],
      });

      const response = await agent.invoke({
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(response.messages.length).toBeGreaterThan(0);
    });

    test.skip("should support retry logic", async () => {
      let attempts = 0;

      const retryMiddleware = createMiddleware({
        name: "RetryMiddleware",
        wrapModelCall: (request, handler) => {
          const maxRetries = 3;

          for (let i = 0; i < maxRetries; i++) {
            try {
              attempts++;
              return handler(request);
            } catch (error) {
              if (i === maxRetries - 1) throw error;
              // Retry on next iteration
            }
          }

          throw new Error("Max retries exceeded");
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [retryMiddleware],
      });

      await agent.invoke({
        messages: [{ role: "user", content: "Test" }],
      });

      // Should succeed on first attempt
      expect(attempts).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Custom State Schema", () => {
    test.skip("should track custom state properties", async () => {
      const counterMiddleware = createMiddleware({
        name: "CounterMiddleware",
        stateSchema: z.object({
          callCount: z.number().default(0),
        }),
        afterModel: (state) => {
          return { callCount: state.callCount + 1 };
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [counterMiddleware] as const,
        checkpointer: new MemorySaver(),
      });

      const config = { configurable: { thread_id: "test_state_1" } };

      await agent.invoke(
        { messages: [{ role: "user", content: "Call 1" }] },
        config
      );

      const response2 = await agent.invoke(
        { messages: [{ role: "user", content: "Call 2" }] },
        config
      );

      // Custom state should persist across calls
      expect(response2).toBeDefined();
    });

    test.skip("should support multiple state properties", async () => {
      const statsMiddleware = createMiddleware({
        name: "StatsMiddleware",
        stateSchema: z.object({
          requestCount: z.number().default(0),
          errorCount: z.number().default(0),
          lastUserId: z.string().optional(),
        }),
        beforeModel: (state) => {
          return { requestCount: state.requestCount + 1 };
        },
        afterModel: (state) => {
          return { lastUserId: "test-user" };
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [statsMiddleware] as const,
      });

      const response = await agent.invoke({
        messages: [{ role: "user", content: "Test" }],
      });

      expect(response).toBeDefined();
    });
  });

  describe("Context Extension", () => {
    test.skip("should access runtime context", async () => {
      let contextValue: string | undefined;

      const contextMiddleware = createMiddleware({
        name: "ContextMiddleware",
        contextSchema: z.object({
          userId: z.string(),
          tier: z.enum(["free", "pro", "enterprise"]),
        }),
        beforeModel: (state, runtime) => {
          contextValue = runtime.context.userId;
          expect(runtime.context.tier).toBe("pro");
          return;
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [contextMiddleware] as const,
      });

      await agent.invoke(
        { messages: [{ role: "user", content: "Test" }] },
        {
          context: {
            userId: "test-123",
            tier: "pro" as const,
          },
        }
      );

      expect(contextValue).toBe("test-123");
    });

    test.skip("should use context for conditional logic", async () => {
      const rateLimitMiddleware = createMiddleware({
        name: "RateLimitMiddleware",
        contextSchema: z.object({
          maxRequests: z.number(),
        }),
        stateSchema: z.object({
          requestCount: z.number().default(0),
        }),
        beforeModel: (state, runtime) => {
          if (state.requestCount >= runtime.context.maxRequests) {
            return {
              messages: [new AIMessage("Rate limit exceeded")],
              jumpTo: "end" as const,
            };
          }
          return { requestCount: state.requestCount + 1 };
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [rateLimitMiddleware] as const,
      });

      const response = await agent.invoke(
        { messages: [{ role: "user", content: "Test" }] },
        {
          context: {
            maxRequests: 100,
          },
        }
      );

      expect(response.messages.length).toBeGreaterThan(0);
    });
  });

  describe("Agent Jumps", () => {
    test.skip("should jump to end", async () => {
      const earlyExitMiddleware = createMiddleware({
        name: "EarlyExitMiddleware",
        beforeModel: (state) => {
          // Exit if message contains "stop"
          const lastMessage = state.messages[state.messages.length - 1];
          if (
            lastMessage.content &&
            typeof lastMessage.content === "string" &&
            lastMessage.content.includes("stop")
          ) {
            return {
              messages: [new AIMessage("Stopped early")],
              jumpTo: "end" as const,
            };
          }
          return;
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [earlyExitMiddleware],
      });

      const response = await agent.invoke({
        messages: [{ role: "user", content: "Please stop" }],
      });

      const lastMessage = response.messages[response.messages.length - 1];
      expect(lastMessage.content).toBe("Stopped early");
    });

    test.skip("should handle conditional jumps", async () => {
      const conditionalMiddleware = createMiddleware({
        name: "ConditionalMiddleware",
        stateSchema: z.object({
          maxTurns: z.number().default(3),
          turnCount: z.number().default(0),
        }),
        beforeModel: (state) => {
          if (state.turnCount >= state.maxTurns) {
            return {
              messages: [new AIMessage("Max turns reached")],
              jumpTo: "end" as const,
            };
          }
          return { turnCount: state.turnCount + 1 };
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [conditionalMiddleware] as const,
        checkpointer: new MemorySaver(),
      });

      const config = { configurable: { thread_id: "test_jumps_1" } };

      // Make multiple calls
      await agent.invoke({ messages: [{ role: "user", content: "Turn 1" }] }, config);
      await agent.invoke({ messages: [{ role: "user", content: "Turn 2" }] }, config);
      const response3 = await agent.invoke(
        { messages: [{ role: "user", content: "Turn 3" }] },
        config
      );

      expect(response3.messages.length).toBeGreaterThan(0);
    });
  });

  describe("Execution Order", () => {
    test.skip("should execute middleware in correct order", async () => {
      const callOrder: string[] = [];

      const middleware1 = createMiddleware({
        name: "Middleware1",
        beforeModel: () => {
          callOrder.push("mw1-before");
          return;
        },
        afterModel: () => {
          callOrder.push("mw1-after");
          return;
        },
      });

      const middleware2 = createMiddleware({
        name: "Middleware2",
        beforeModel: () => {
          callOrder.push("mw2-before");
          return;
        },
        afterModel: () => {
          callOrder.push("mw2-after");
          return;
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [middleware1, middleware2],
      });

      await agent.invoke({
        messages: [{ role: "user", content: "Test" }],
      });

      // Before hooks: first to last
      // After hooks: last to first (reverse)
      expect(callOrder[0]).toBe("mw1-before");
      expect(callOrder[1]).toBe("mw2-before");
      expect(callOrder[2]).toBe("mw2-after");
      expect(callOrder[3]).toBe("mw1-after");
    });

    test.skip("should nest wrap hooks correctly", async () => {
      const callOrder: string[] = [];

      const middleware1 = createMiddleware({
        name: "Middleware1",
        wrapModelCall: (request, handler) => {
          callOrder.push("mw1-wrap-before");
          const result = handler(request);
          callOrder.push("mw1-wrap-after");
          return result;
        },
      });

      const middleware2 = createMiddleware({
        name: "Middleware2",
        wrapModelCall: (request, handler) => {
          callOrder.push("mw2-wrap-before");
          const result = handler(request);
          callOrder.push("mw2-wrap-after");
          return result;
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [middleware1, middleware2],
      });

      await agent.invoke({
        messages: [{ role: "user", content: "Test" }],
      });

      // Wrap hooks nest: outer first, inner last
      expect(callOrder[0]).toBe("mw1-wrap-before");
      expect(callOrder[1]).toBe("mw2-wrap-before");
      expect(callOrder[2]).toBe("mw2-wrap-after");
      expect(callOrder[3]).toBe("mw1-wrap-after");
    });
  });

  describe("Dynamic Tool Selection", () => {
    test.skip("should filter tools dynamically", async () => {
      const tool1 = tool(
        async ({ data }) => `Tool1: ${data}`,
        {
          name: "tool1",
          description: "First tool",
          schema: z.object({ data: z.string() }),
        }
      );

      const tool2 = tool(
        async ({ data }) => `Tool2: ${data}`,
        {
          name: "tool2",
          description: "Second tool",
          schema: z.object({ data: z.string() }),
        }
      );

      const selectorMiddleware = createMiddleware({
        name: "ToolSelectorMiddleware",
        contextSchema: z.object({
          allowedTools: z.array(z.string()),
        }),
        wrapModelCall: (request, handler) => {
          const allowedTools = request.runtime.context.allowedTools;
          const filteredTools = request.tools.filter((t) =>
            allowedTools.includes(t.name)
          );

          return handler({ ...request, tools: filteredTools });
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [tool1, tool2],
        middleware: [selectorMiddleware] as const,
      });

      const response = await agent.invoke(
        {
          messages: [{ role: "user", content: "Use any available tool" }],
        },
        {
          context: {
            allowedTools: ["tool1"],
          },
        }
      );

      expect(response.messages.length).toBeGreaterThan(0);
    });
  });

  describe("Complex Middleware Combination", () => {
    test.skip("should combine multiple patterns", async () => {
      const callLog: string[] = [];

      const complexMiddleware = createMiddleware({
        name: "ComplexMiddleware",
        stateSchema: z.object({
          requestCount: z.number().default(0),
          errors: z.array(z.string()).default([]),
        }),
        contextSchema: z.object({
          userId: z.string(),
          maxRequests: z.number(),
        }),
        beforeModel: (state, runtime) => {
          callLog.push("before");

          // Check limits
          if (state.requestCount >= runtime.context.maxRequests) {
            return {
              messages: [new AIMessage("Request limit exceeded")],
              jumpTo: "end" as const,
            };
          }

          return { requestCount: state.requestCount + 1 };
        },
        wrapModelCall: (request, handler) => {
          callLog.push("wrap-before");
          try {
            const result = handler(request);
            callLog.push("wrap-after");
            return result;
          } catch (error) {
            return {
              errors: [error instanceof Error ? error.message : "Unknown error"],
            };
          }
        },
        afterModel: (state) => {
          callLog.push("after");
          return;
        },
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        middleware: [complexMiddleware] as const,
      });

      await agent.invoke(
        { messages: [{ role: "user", content: "Test" }] },
        {
          context: {
            userId: "test-123",
            maxRequests: 10,
          },
        }
      );

      expect(callLog).toContain("before");
      expect(callLog).toContain("wrap-before");
      expect(callLog).toContain("wrap-after");
      expect(callLog).toContain("after");
    });
  });
});
