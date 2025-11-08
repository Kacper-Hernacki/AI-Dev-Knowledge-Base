/**
 * Integration tests for short-term memory
 */

import { describe, test, expect } from "bun:test";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  Annotation,
} from "@langchain/langgraph";
import { HumanMessage, AIMessage, RemoveMessage } from "@langchain/core/messages";

// Skip if no API key
const skipIfNoKey = !process.env.ANTHROPIC_API_KEY;

describe("Memory Integration", () => {
  test.skip("should persist conversation with MemorySaver", async () => {
    const checkpointer = new MemorySaver();
    const model = new ChatAnthropic({
      model: "claude-3-5-sonnet-latest",
      temperature: 0,
    });

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("agent", async (state) => {
        const response = await model.invoke(state.messages);
        return { messages: [response] };
      })
      .addEdge("__start__", "agent")
      .addEdge("agent", "__end__");

    const agent = workflow.compile({ checkpointer });
    const config = { configurable: { thread_id: "test_thread_1" } };

    // First turn
    const response1 = await agent.invoke(
      {
        messages: [{ role: "user", content: "My name is Alice" }],
      },
      config
    );

    expect(response1.messages.length).toBeGreaterThan(1);

    // Second turn - should remember
    const response2 = await agent.invoke(
      {
        messages: [{ role: "user", content: "What's my name?" }],
      },
      config
    );

    const lastMsg = response2.messages[response2.messages.length - 1];
    const content = typeof lastMsg.content === "string" ? lastMsg.content.toLowerCase() : "";

    expect(content).toContain("alice");
  }, 30000);

  test.skip("should isolate threads", async () => {
    const checkpointer = new MemorySaver();
    const model = new ChatAnthropic({
      model: "claude-3-5-sonnet-latest",
      temperature: 0,
    });

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("agent", async (state) => {
        const response = await model.invoke(state.messages);
        return { messages: [response] };
      })
      .addEdge("__start__", "agent")
      .addEdge("agent", "__end__");

    const agent = workflow.compile({ checkpointer });

    // Thread 1
    await agent.invoke(
      {
        messages: [{ role: "user", content: "My name is Alice" }],
      },
      { configurable: { thread_id: "thread_1" } }
    );

    // Thread 2 - should not know about Alice
    const response = await agent.invoke(
      {
        messages: [{ role: "user", content: "Do you know my name?" }],
      },
      { configurable: { thread_id: "thread_2" } }
    );

    const lastMsg = response.messages[response.messages.length - 1];
    const content = typeof lastMsg.content === "string" ? lastMsg.content.toLowerCase() : "";

    // Should not mention Alice
    expect(content).not.toContain("alice");
  });

  test.skip("should handle custom state", async () => {
    const CustomStateAnnotation = Annotation.Root({
      ...MessagesAnnotation.spec,
      userId: Annotation<string>(),
      count: Annotation<number>({
        reducer: (prev, curr) => (curr !== undefined ? curr : prev),
        default: () => 0,
      }),
    });

    const checkpointer = new MemorySaver();
    const model = new ChatAnthropic({
      model: "claude-3-5-sonnet-latest",
      temperature: 0,
    });

    const workflow = new StateGraph(CustomStateAnnotation)
      .addNode("agent", async (state) => {
        const response = await model.invoke(state.messages);
        return {
          messages: [response],
          count: state.count + 1,
        };
      })
      .addEdge("__start__", "agent")
      .addEdge("agent", "__end__");

    const agent = workflow.compile({ checkpointer });

    const response1 = await agent.invoke(
      {
        messages: [{ role: "user", content: "Hello" }],
        userId: "user_123",
      },
      { configurable: { thread_id: "custom_thread" } }
    );

    expect(response1.userId).toBe("user_123");
    expect(response1.count).toBe(1);

    const response2 = await agent.invoke(
      {
        messages: [{ role: "user", content: "Hi again" }],
      },
      { configurable: { thread_id: "custom_thread" } }
    );

    expect(response2.count).toBe(2);
  });

  test.skip("should delete messages from state", async () => {
    const checkpointer = new MemorySaver();
    const model = new ChatAnthropic({
      model: "claude-3-5-sonnet-latest",
      temperature: 0,
    });

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("agent", async (state) => {
        const response = await model.invoke(state.messages);
        return { messages: [response] };
      })
      .addNode("cleanup", (state) => {
        if (state.messages.length > 4) {
          // Remove first 2 messages
          return {
            messages: state.messages
              .slice(0, 2)
              .map((m) => new RemoveMessage({ id: m.id! })),
          };
        }
        return {};
      })
      .addEdge("__start__", "agent")
      .addEdge("agent", "cleanup")
      .addEdge("cleanup", "__end__");

    const agent = workflow.compile({ checkpointer });
    const config = { configurable: { thread_id: "delete_thread" } };

    // Add multiple messages
    await agent.invoke(
      { messages: [{ role: "user", content: "Message 1" }] },
      config
    );
    await agent.invoke(
      { messages: [{ role: "user", content: "Message 2" }] },
      config
    );
    const response = await agent.invoke(
      { messages: [{ role: "user", content: "Message 3" }] },
      config
    );

    // Should have cleaned up old messages
    expect(response.messages.length).toBeLessThanOrEqual(4);
  });

  test.skip("should work with before/after hooks", async () => {
    let beforeCalled = false;
    let afterCalled = false;

    const checkpointer = new MemorySaver();
    const model = new ChatAnthropic({
      model: "claude-3-5-sonnet-latest",
      temperature: 0,
    });

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("before", (state) => {
        beforeCalled = true;
        return {};
      })
      .addNode("agent", async (state) => {
        const response = await model.invoke(state.messages);
        return { messages: [response] };
      })
      .addNode("after", (state) => {
        afterCalled = true;
        return {};
      })
      .addEdge("__start__", "before")
      .addEdge("before", "agent")
      .addEdge("agent", "after")
      .addEdge("after", "__end__");

    const agent = workflow.compile({ checkpointer });

    await agent.invoke(
      {
        messages: [{ role: "user", content: "Test hooks" }],
      },
      { configurable: { thread_id: "hooks_thread" } }
    );

    expect(beforeCalled).toBe(true);
    expect(afterCalled).toBe(true);
  });
});
