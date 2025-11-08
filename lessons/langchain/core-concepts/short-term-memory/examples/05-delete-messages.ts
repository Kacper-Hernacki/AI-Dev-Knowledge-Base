/**
 * Delete Messages Example
 * Demonstrates removing specific messages from conversation history
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { RemoveMessage } from "@langchain/core/messages";

/**
 * Demonstrate deleting messages from state
 */
export async function demonstrateDeleteMessages() {
  console.log("\n🗑️  Delete Messages");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Create agent with message deletion logic
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addNode("cleanup", (state) => {
      // Delete old messages if history is too long
      const messages = state.messages;
      if (messages.length > 6) {
        console.log(`  🗑️  Cleaning up: ${messages.length} messages, removing first 2`);
        // Remove the first 2 messages (keep system message if present)
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

  const agent = workflow.compile({ checkpointer });
  const config = { configurable: { thread_id: "delete_demo_1" } };

  try {
    console.log("\n1️⃣ Building conversation history:");

    const turns = [
      "My name is Alice",
      "I like programming",
      "I also enjoy hiking",
      "And I love reading sci-fi",
      "What do you know about me?",
    ];

    for (const [index, content] of turns.entries()) {
      console.log(`\n   Turn ${index + 1}: ${content}`);
      const response = await agent.invoke(
        { messages: [{ role: "user", content }] },
        config
      );
      console.log(`   Messages in state: ${response.messages.length}`);
      const lastMsg = response.messages[response.messages.length - 1];
      console.log(`   AI: ${lastMsg.content}`);
    }

    console.log("\n✅ Old messages automatically deleted!");
    console.log("💡 Keeps conversation history manageable");
  } catch (error) {
    console.error("❌ Delete messages demo failed:", error);
  }
}

/**
 * Demonstrate selective message deletion
 */
export async function demonstrateSelectiveDelete() {
  console.log("\n🎯 Selective Message Deletion");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Agent that removes messages containing sensitive info
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addNode("filter", (state) => {
      // Remove messages with sensitive keywords
      const sensitiveKeywords = ["password", "secret", "confidential"];
      const messagesToRemove: RemoveMessage[] = [];

      for (const msg of state.messages) {
        const content =
          typeof msg.content === "string" ? msg.content.toLowerCase() : "";
        if (
          sensitiveKeywords.some((keyword) => content.includes(keyword))
        ) {
          console.log(`  🚫 Removing sensitive message: ${msg.id}`);
          messagesToRemove.push(new RemoveMessage({ id: msg.id! }));
        }
      }

      return messagesToRemove.length > 0
        ? { messages: messagesToRemove }
        : {};
    })
    .addEdge("__start__", "agent")
    .addEdge("agent", "filter")
    .addEdge("filter", "__end__");

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n1️⃣ Send message with sensitive info:");
    const response1 = await agent.invoke(
      {
        messages: [
          { role: "user", content: "My password is secret123" },
        ],
      },
      { configurable: { thread_id: "filter_demo_1" } }
    );
    console.log(`   Messages after filter: ${response1.messages.length}`);

    console.log("\n2️⃣ Send normal message:");
    const response2 = await agent.invoke(
      { messages: [{ role: "user", content: "What's the weather?" }] },
      { configurable: { thread_id: "filter_demo_1" } }
    );
    console.log(`   Messages in state: ${response2.messages.length}`);

    console.log("\n✅ Sensitive messages filtered out!");
  } catch (error) {
    console.error("❌ Selective delete demo failed:", error);
  }
}

/**
 * Demonstrate message deletion by ID
 */
export async function demonstrateDeleteById() {
  console.log("\n🔍 Delete Messages by ID");
  console.log("=".repeat(50));

  console.log("\n💡 RemoveMessage API:");
  console.log("  • new RemoveMessage({ id: messageId })");
  console.log("  • Works with messagesStateReducer");
  console.log("  • Permanently removes from state");
  console.log("  • Returns empty state if no messages to remove");

  console.log("\n⚠️  Important Considerations:");
  console.log("  • Ensure valid message history after deletion");
  console.log("  • Some providers require user message first");
  console.log("  • Tool calls need corresponding tool messages");
  console.log("  • System messages should typically be preserved");

  console.log("\n📋 Use Cases:");
  console.log("  • Remove sensitive information");
  console.log("  • Clean up conversation history");
  console.log("  • Delete failed or erroneous messages");
  console.log("  • Implement sliding window of recent messages");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateDeleteMessages();
  await demonstrateSelectiveDelete();
  await demonstrateDeleteById();
}
