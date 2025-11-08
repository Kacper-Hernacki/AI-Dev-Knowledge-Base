/**
 * Trim Messages Example
 * Demonstrates managing context window by trimming messages
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { trimMessages } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";

/**
 * Demonstrate message trimming to manage context window
 */
export async function demonstrateTrimMessages() {
  console.log("\n✂️  Trim Messages");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Create agent with message trimming
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      // Trim messages before calling model
      const trimmed = await trimMessages(state.messages, {
        maxTokens: 100,
        strategy: "last",
        tokenCounter: (msgs) => {
          // Simple token counter - count total length of content
          return msgs.reduce((total, msg) => {
            const content =
              typeof msg.content === "string" ? msg.content : "";
            return total + content.length;
          }, 0);
        },
        startOn: "human",
        endOn: ["human", "tool"],
      });

      console.log(`  📊 Original messages: ${state.messages.length}`);
      console.log(`  📊 Trimmed messages: ${trimmed.length}`);

      const response = await model.invoke(trimmed);
      return { messages: [response] };
    })
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  const agent = workflow.compile({ checkpointer });
  const config = { configurable: { thread_id: "trim_demo_1" } };

  try {
    console.log("\n1️⃣ Adding multiple messages:");

    const messages = [
      "This is my first message with some content.",
      "Here's another message adding more text to the conversation.",
      "And one more message to make the context longer.",
      "Let's add even more context to trigger trimming.",
      "What were my first messages about?",
    ];

    for (const [index, content] of messages.entries()) {
      console.log(`\n   Turn ${index + 1}: ${content}`);
      const response = await agent.invoke(
        { messages: [{ role: "user", content }] },
        config
      );
      const lastMsg = response.messages[response.messages.length - 1];
      console.log(`   AI: ${lastMsg.content}`);
    }

    console.log("\n✅ Messages trimmed to fit context window!");
    console.log("💡 Older messages are removed to stay within limits");
  } catch (error) {
    console.error("❌ Trim messages demo failed:", error);
  }
}

/**
 * Demonstrate different trimming strategies
 */
export async function demonstrateTrimStrategies() {
  console.log("\n🎯 Trim Strategies");
  console.log("=".repeat(50));

  const messages = [
    new AIMessage("System message: Welcome!"),
    new AIMessage("Message 1"),
    new AIMessage("Message 2"),
    new AIMessage("Message 3"),
    new AIMessage("Message 4"),
    new AIMessage("Message 5"),
  ];

  console.log(`\n📝 Original: ${messages.length} messages`);

  try {
    // Strategy 1: Keep last N messages
    console.log("\n1️⃣ Strategy: Keep last 3 messages");
    const lastThree = await trimMessages(messages, {
      maxTokens: 3,
      strategy: "last",
      tokenCounter: (msgs) => msgs.length,
    });
    console.log(`   Result: ${lastThree.length} messages`);
    console.log(
      `   Content: ${lastThree.map((m) => m.content).join(", ")}`
    );

    // Strategy 2: Keep first N messages
    console.log("\n2️⃣ Strategy: Keep first 2 messages");
    const firstTwo = await trimMessages(messages, {
      maxTokens: 2,
      strategy: "first",
      tokenCounter: (msgs) => msgs.length,
    });
    console.log(`   Result: ${firstTwo.length} messages`);
    console.log(
      `   Content: ${firstTwo.map((m) => m.content).join(", ")}`
    );

    console.log("\n💡 Trimming Strategies:");
    console.log("  • 'last' - Keep most recent messages");
    console.log("  • 'first' - Keep oldest messages (preserve context)");
    console.log("  • Use 'startOn' to ensure valid message sequences");
    console.log("  • Use 'endOn' to maintain conversation flow");
  } catch (error) {
    console.error("❌ Trim strategies demo failed:", error);
  }
}

/**
 * Demonstrate token-based trimming
 */
export async function demonstrateTokenTrimming() {
  console.log("\n🔢 Token-Based Trimming");
  console.log("=".repeat(50));

  console.log("\n💡 Token Counting Options:");
  console.log("  1. Simple character count (demo)");
  console.log("  2. Token counting library (e.g., tiktoken)");
  console.log("  3. Model-specific tokenizers");

  console.log("\n📋 Best Practices:");
  console.log("  • Set maxTokens to 70-80% of model's limit");
  console.log("  • Always keep system messages");
  console.log("  • Maintain tool call/response pairs");
  console.log("  • Test with your specific use case");

  try {
    const messages = Array.from({ length: 10 }, (_, i) =>
      new AIMessage(`Message ${i + 1} with varying length content`)
    );

    const trimmed = await trimMessages(messages, {
      maxTokens: 200,
      strategy: "last",
      tokenCounter: (msgs) => {
        return msgs.reduce((total, msg) => {
          const content =
            typeof msg.content === "string" ? msg.content : "";
          return total + content.length;
        }, 0);
      },
    });

    console.log(`\n✅ Trimmed from ${messages.length} to ${trimmed.length} messages`);
  } catch (error) {
    console.error("❌ Token trimming demo failed:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateTrimMessages();
  await demonstrateTrimStrategies();
  await demonstrateTokenTrimming();
}
