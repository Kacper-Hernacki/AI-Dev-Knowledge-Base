/**
 * Before/After Model Hooks Example
 * Demonstrates using hooks to process state before and after model calls
 */

import { ChatAnthropic } from "@langchain/anthropic";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  Annotation,
} from "@langchain/langgraph";
import { RemoveMessage, trimMessages } from "@langchain/core/messages";

/**
 * Demonstrate before model hooks
 */
export async function demonstrateBeforeModelHooks() {
  console.log("\n⬅️  Before Model Hooks");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Create workflow with before-model processing
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("beforeModel", async (state) => {
      console.log(`  ⚙️  Before model: Processing ${state.messages.length} messages`);

      // Trim messages before model call
      const trimmed = await trimMessages(state.messages, {
        maxTokens: 200,
        strategy: "last",
        tokenCounter: (msgs) => msgs.length,
        startOn: "human",
        endOn: ["human", "tool"],
      });

      console.log(`  ✂️  Trimmed to ${trimmed.length} messages`);

      return { messages: trimmed };
    })
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addEdge("__start__", "beforeModel")
    .addEdge("beforeModel", "agent")
    .addEdge("agent", "__end__");

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n1️⃣ Building conversation:");

    const turns = [
      "Message 1: Hello!",
      "Message 2: How are you?",
      "Message 3: Tell me about AI",
      "Message 4: What's machine learning?",
      "Message 5: Summarize our conversation",
    ];

    for (const content of turns) {
      console.log(`\n   User: ${content}`);
      await agent.invoke(
        { messages: [{ role: "user", content }] },
        { configurable: { thread_id: "before_hook_1" } }
      );
    }

    console.log("\n✅ Before hooks process messages before model!");
  } catch (error) {
    console.error("❌ Before model hooks demo failed:", error);
  }
}

/**
 * Demonstrate after model hooks
 */
export async function demonstrateAfterModelHooks() {
  console.log("\n➡️  After Model Hooks");
  console.log("=".repeat(50));

  const RequestCountAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    requestCount: Annotation<number>({
      reducer: (prev, curr) => (curr !== undefined ? curr : prev),
      default: () => 0,
    }),
  });

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Create workflow with after-model processing
  const workflow = new StateGraph(RequestCountAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addNode("afterModel", (state) => {
      console.log(`  ⚙️  After model: Processing response`);

      // Increment request counter
      const newCount = state.requestCount + 1;
      console.log(`  📊 Request count: ${newCount}`);

      // Validate response
      const lastMessage = state.messages[state.messages.length - 1];
      const content =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : "";

      // Filter sensitive content
      if (content.toLowerCase().includes("confidential")) {
        console.log("  🚫 Removing sensitive content");
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

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n1️⃣ Normal message:");
    const response1 = await agent.invoke(
      {
        messages: [{ role: "user", content: "Hello!" }],
      },
      { configurable: { thread_id: "after_hook_1" } }
    );
    console.log(`  Request count: ${response1.requestCount}`);

    console.log("\n2️⃣ Another message:");
    const response2 = await agent.invoke(
      {
        messages: [{ role: "user", content: "How are you?" }],
      },
      { configurable: { thread_id: "after_hook_1" } }
    );
    console.log(`  Request count: ${response2.requestCount}`);

    console.log("\n✅ After hooks process responses after model!");
  } catch (error) {
    console.error("❌ After model hooks demo failed:", error);
  }
}

/**
 * Demonstrate combined before/after hooks
 */
export async function demonstrateCombinedHooks() {
  console.log("\n🔄 Combined Before/After Hooks");
  console.log("=".repeat(50));

  const MetricsAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    inputTokens: Annotation<number>({
      reducer: (prev, curr) => prev + (curr || 0),
      default: () => 0,
    }),
    outputTokens: Annotation<number>({
      reducer: (prev, curr) => prev + (curr || 0),
      default: () => 0,
    }),
  });

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  const workflow = new StateGraph(MetricsAnnotation)
    .addNode("beforeModel", (state) => {
      // Estimate input tokens
      const inputSize = state.messages.reduce((sum, msg) => {
        const content =
          typeof msg.content === "string" ? msg.content : "";
        return sum + content.length;
      }, 0);

      console.log(`  📥 Before: ~${inputSize} input chars`);

      return { inputTokens: inputSize };
    })
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addNode("afterModel", (state) => {
      // Estimate output tokens
      const lastMessage = state.messages[state.messages.length - 1];
      const outputSize =
        typeof lastMessage.content === "string"
          ? lastMessage.content.length
          : 0;

      console.log(`  📤 After: ~${outputSize} output chars`);
      console.log(`  📊 Total: ~${state.inputTokens + outputSize} chars`);

      return { outputTokens: outputSize };
    })
    .addEdge("__start__", "beforeModel")
    .addEdge("beforeModel", "agent")
    .addEdge("agent", "afterModel")
    .addEdge("afterModel", "__end__");

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n1️⃣ Tracking metrics:");

    await agent.invoke(
      {
        messages: [
          { role: "user", content: "Tell me about TypeScript" },
        ],
      },
      { configurable: { thread_id: "combined_1" } }
    );

    const response = await agent.invoke(
      {
        messages: [
          { role: "user", content: "What are its benefits?" },
        ],
      },
      { configurable: { thread_id: "combined_1" } }
    );

    console.log(`\n  📊 Total input: ${response.inputTokens}`);
    console.log(`  📊 Total output: ${response.outputTokens}`);

    console.log("\n✅ Combined hooks provide full request lifecycle!");
  } catch (error) {
    console.error("❌ Combined hooks demo failed:", error);
  }
}

/**
 * Demonstrate hook patterns and use cases
 */
export function demonstrateHookPatterns() {
  console.log("\n📋 Hook Patterns and Use Cases");
  console.log("=".repeat(50));

  console.log("\n⬅️  Before Model Hooks:");
  console.log("  • Trim/filter messages");
  console.log("  • Validate input");
  console.log("  • Add context from state");
  console.log("  • Inject system prompts");
  console.log("  • Log requests");

  console.log("\n➡️  After Model Hooks:");
  console.log("  • Filter/validate responses");
  console.log("  • Update metrics");
  console.log("  • Remove sensitive content");
  console.log("  • Log responses");
  console.log("  • Trigger side effects");

  console.log("\n🔄 Combined Patterns:");
  console.log("  • Request/response logging");
  console.log("  • Token usage tracking");
  console.log("  • Content moderation pipeline");
  console.log("  • Performance monitoring");
  console.log("  • Error handling");

  console.log("\n⚙️  Implementation Tips:");
  console.log("  • Keep hooks focused and single-purpose");
  console.log("  • Use state annotations for hook data");
  console.log("  • Handle errors gracefully");
  console.log("  • Test hooks independently");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateBeforeModelHooks();
  await demonstrateAfterModelHooks();
  await demonstrateCombinedHooks();
  demonstrateHookPatterns();
}
