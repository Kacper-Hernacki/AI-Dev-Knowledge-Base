/**
 * Custom State Schema Example
 * Demonstrates extending agent state with custom fields
 */

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver, MessagesAnnotation, StateGraph, Annotation } from "@langchain/langgraph";

/**
 * Define custom state schema with additional fields
 */
const CustomStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userId: Annotation<string>(),
  preferences: Annotation<Record<string, any>>({
    reducer: (prev, curr) => ({ ...prev, ...curr }),
  }),
  sessionCount: Annotation<number>({
    reducer: (prev, curr) => (curr !== undefined ? curr : prev),
    default: () => 0,
  }),
});

/**
 * Demonstrate custom state with extended fields
 */
export async function demonstrateCustomState() {
  console.log("\n🎨 Custom State Schema");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Create a simple agent with custom state
  const workflow = new StateGraph(CustomStateAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return {
        messages: [response],
        sessionCount: state.sessionCount + 1,
      };
    })
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  const agent = workflow.compile({ checkpointer });

  const config = { configurable: { thread_id: "custom_state_1" } };

  try {
    console.log("\n1️⃣ Initialize with custom state:");
    const response1 = await agent.invoke(
      {
        messages: [{ role: "user", content: "Hello!" }],
        userId: "user_123",
        preferences: { theme: "dark", language: "en" },
      },
      config
    );
    console.log(
      `  AI: ${response1.messages[response1.messages.length - 1].content}`
    );
    console.log(`  Session count: ${response1.sessionCount}`);
    console.log(`  User ID: ${response1.userId}`);
    console.log(`  Preferences:`, response1.preferences);

    console.log("\n2️⃣ State persists across turns:");
    const response2 = await agent.invoke(
      {
        messages: [{ role: "user", content: "What's my user ID?" }],
      },
      config
    );
    console.log(
      `  AI: ${response2.messages[response2.messages.length - 1].content}`
    );
    console.log(`  Session count: ${response2.sessionCount}`);
    console.log(`  User ID: ${response2.userId}`);

    console.log("\n3️⃣ Update preferences:");
    const response3 = await agent.invoke(
      {
        messages: [{ role: "user", content: "Switch to light theme" }],
        preferences: { theme: "light" },
      },
      config
    );
    console.log(`  Preferences:`, response3.preferences);

    console.log("\n✅ Custom state fields are persisted!");
  } catch (error) {
    console.error("❌ Custom state demo failed:", error);
  }
}

/**
 * Demonstrate state with complex types
 */
export async function demonstrateComplexState() {
  console.log("\n🔧 Complex State Types");
  console.log("=".repeat(50));

  const UserProfileAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    profile: Annotation<{
      name: string;
      email: string;
      age: number;
      settings: {
        notifications: boolean;
        theme: string;
      };
    }>({
      reducer: (prev, curr) => ({ ...prev, ...curr }),
    }),
    activityLog: Annotation<Array<{ timestamp: Date; action: string }>>({
      reducer: (prev, curr) => [...(prev || []), ...(curr || [])],
      default: () => [],
    }),
  });

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  const workflow = new StateGraph(UserProfileAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return {
        messages: [response],
        activityLog: [
          { timestamp: new Date(), action: "message_received" },
        ],
      };
    })
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n📝 Initialize complex state:");
    const response = await agent.invoke(
      {
        messages: [{ role: "user", content: "Hello!" }],
        profile: {
          name: "Alice",
          email: "alice@example.com",
          age: 30,
          settings: {
            notifications: true,
            theme: "dark",
          },
        },
      },
      { configurable: { thread_id: "complex_state_1" } }
    );

    console.log(`  Profile name: ${response.profile?.name}`);
    console.log(`  Profile email: ${response.profile?.email}`);
    console.log(`  Activity log entries: ${response.activityLog?.length}`);

    console.log("\n✅ Complex nested state structures work!");
  } catch (error) {
    console.error("❌ Complex state demo failed:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateCustomState();
  await demonstrateComplexState();
}
