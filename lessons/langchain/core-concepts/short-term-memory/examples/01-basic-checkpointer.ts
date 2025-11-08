/**
 * Basic Checkpointer Example
 * Demonstrates how to add short-term memory using MemorySaver
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

/**
 * Demonstrate basic memory with MemorySaver
 */
export async function demonstrateBasicMemory() {
  console.log("\n💾 Basic Memory with MemorySaver");
  console.log("=".repeat(50));

  // Create a checkpointer to persist conversation history
  const checkpointer = new MemorySaver();

  // Initialize the model
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Create agent with checkpointer
  const agent = createReactAgent({
    llm: model,
    tools: [],
    checkpointSaver: checkpointer,
  });

  // Configure thread for conversation
  const config = { configurable: { thread_id: "conversation_1" } };

  try {
    console.log("\n1️⃣ First message - introducing myself:");
    const response1 = await agent.invoke(
      { messages: [{ role: "user", content: "Hi! I'm Alice." }] },
      config
    );
    console.log(
      `  AI: ${response1.messages[response1.messages.length - 1].content}`
    );

    console.log("\n2️⃣ Second message - asking about my name:");
    const response2 = await agent.invoke(
      { messages: [{ role: "user", content: "What's my name?" }] },
      config
    );
    console.log(
      `  AI: ${response2.messages[response2.messages.length - 1].content}`
    );

    console.log("\n3️⃣ Using a different thread (no memory):");
    const response3 = await agent.invoke(
      { messages: [{ role: "user", content: "What's my name?" }] },
      { configurable: { thread_id: "conversation_2" } }
    );
    console.log(
      `  AI: ${response3.messages[response3.messages.length - 1].content}`
    );

    console.log("\n✅ Memory persists within thread but not across threads!");
  } catch (error) {
    console.error("❌ Basic memory demo failed:", error);
  }
}

/**
 * Demonstrate memory with multiple turns
 */
export async function demonstrateMultiTurnConversation() {
  console.log("\n🔄 Multi-Turn Conversation");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  const agent = createReactAgent({
    llm: model,
    tools: [],
    checkpointSaver: checkpointer,
  });

  const config = { configurable: { thread_id: "multi_turn_1" } };

  const turns = [
    "My favorite color is blue.",
    "I also like hiking on weekends.",
    "What do you know about my preferences?",
  ];

  try {
    for (const [index, turn] of turns.entries()) {
      console.log(`\n${index + 1}. User: ${turn}`);
      const response = await agent.invoke(
        { messages: [{ role: "user", content: turn }] },
        config
      );
      console.log(
        `   AI: ${response.messages[response.messages.length - 1].content}`
      );
    }

    console.log("\n✅ Agent remembers all previous turns!");
  } catch (error) {
    console.error("❌ Multi-turn conversation demo failed:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateBasicMemory();
  await demonstrateMultiTurnConversation();
}
