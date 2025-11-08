/**
 * Manual Message Summarization Example
 * Demonstrates implementing custom summarization logic manually
 *
 * NOTE: For production use, see 07-summarization-middleware.ts which uses
 * LangChain's built-in summarizationMiddleware - a cleaner, more maintainable approach.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  RemoveMessage,
} from "@langchain/core/messages";

/**
 * Demonstrate manual message summarization
 * This shows how summarization works under the hood
 */
export async function demonstrateSummarization() {
  console.log("\n📝 Manual Message Summarization");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Create agent with summarization logic
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addNode("summarize", async (state) => {
      const messages = state.messages;

      // Trigger summarization if we have many messages
      if (messages.length > 8) {
        console.log(
          `  📊 Summarizing ${messages.length} messages...`
        );

        // Filter out any existing system messages (Anthropic requires system messages only at position 0)
        const nonSystemMessages = messages.filter(
          (m) => m._getType() !== "system"
        );

        // Get messages to summarize (exclude last 2 to keep recent context)
        const toSummarize = nonSystemMessages.slice(0, -2);

        // Create summarization prompt
        const summaryPrompt = `Summarize the following conversation concisely:\n\n${toSummarize
          .map((m) => `${m._getType()}: ${m.content}`)
          .join("\n")}`;

        const summary = await model.invoke([
          new HumanMessage(summaryPrompt),
        ]);

        console.log(`  ✅ Created summary`);

        // Remove ALL messages and add them back in correct order (SystemMessage must be first for Anthropic)
        const messagesToKeep = nonSystemMessages.slice(-2);
        return {
          messages: [
            ...nonSystemMessages.map((m) => new RemoveMessage({ id: m.id })),
            new SystemMessage(
              `Previous conversation summary: ${summary.content}`
            ),
            // Re-create the messages we want to keep as new instances
            ...messagesToKeep.map((m) => {
              if (m._getType() === "human")
                return new HumanMessage({ content: m.content });
              if (m._getType() === "ai")
                return new AIMessage({ content: m.content });
              return m;
            }),
          ],
        };
      }

      return {};
    })
    .addEdge("__start__", "agent")
    .addEdge("agent", "summarize")
    .addEdge("summarize", "__end__");

  const agent = workflow.compile({ checkpointer });
  const config = { configurable: { thread_id: "summarize_demo_1" } };

  try {
    console.log("\n1️⃣ Building long conversation:");

    const turns = [
      "My name is Alice and I'm a software engineer",
      "I work with Python and TypeScript mainly",
      "I've been programming for 5 years",
      "I love building AI applications",
      "I also enjoy hiking and photography",
      "What do you know about me?",
    ];

    for (const [index, content] of turns.entries()) {
      console.log(`\n   Turn ${index + 1}: ${content}`);
      const response = await agent.invoke(
        { messages: [{ role: "user", content }] },
        config
      );

      console.log(`   Messages in state: ${response.messages.length}`);

      // Check if first message is a summary
      const firstMsg = response.messages[0];
      if (
        firstMsg.getType() === "system" &&
        typeof firstMsg.content === "string" &&
        firstMsg.content.includes("summary")
      ) {
        console.log(`   📝 Summary created!`);
      }

      const lastMsg = response.messages[response.messages.length - 1];
      console.log(`   AI: ${lastMsg.content}`);
    }

    console.log("\n✅ Conversation summarized to manage context!");
  } catch (error) {
    console.error("❌ Summarization demo failed:", error);
  }
}

/**
 * Demonstrate advanced summarization strategies
 */
export async function demonstrateSummarizationStrategies() {
  console.log("\n🎯 Summarization Strategies");
  console.log("=".repeat(50));

  console.log("\n💡 Summarization Approaches:");
  console.log("  1. Full history summary");
  console.log("     • Summarize all messages periodically");
  console.log("     • Replace with single summary message");
  console.log("");
  console.log("  2. Rolling summary");
  console.log("     • Keep recent messages");
  console.log("     • Summarize older messages");
  console.log("     • Append new summary to existing one");
  console.log("");
  console.log("  3. Hierarchical summary");
  console.log("     • Summarize conversation segments");
  console.log("     • Create summary of summaries");
  console.log("     • Multi-level abstraction");

  console.log("\n⚙️  Configuration Options:");
  console.log("  • maxTokensBeforeSummary - When to trigger");
  console.log("  • messagesToKeep - Recent messages to preserve");
  console.log("  • summaryModel - Model for summarization");
  console.log("  • summaryPrompt - Custom summarization instructions");

  console.log("\n📋 Best Practices:");
  console.log("  • Use faster/cheaper model for summaries");
  console.log("  • Keep recent messages for immediate context");
  console.log("  • Test summary quality with your use case");
  console.log("  • Monitor token usage and latency");
}

/**
 * Demonstrate incremental summarization
 */
export async function demonstrateIncrementalSummarization() {
  console.log("\n🔄 Incremental Summarization");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  let existingSummary = "";

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addNode("incrementalSummary", async (state) => {
      const messages = state.messages;

      if (messages.length > 6) {
        console.log("  📊 Creating incremental summary...");

        // Filter out any existing system messages
        const nonSystemMessages = messages.filter(
          (m) => m._getType() !== "system"
        );

        // Get new messages since last summary
        const newMessages = nonSystemMessages.slice(-4, -2);

        const prompt = existingSummary
          ? `Previous summary: ${existingSummary}\n\nNew messages:\n${newMessages
              .map((m) => `${m._getType()}: ${m.content}`)
              .join("\n")}\n\nUpdate the summary to include new information:`
          : `Summarize these messages:\n${newMessages
              .map((m) => `${m._getType()}: ${m.content}`)
              .join("\n")}`;

        const summary = await model.invoke([new HumanMessage(prompt)]);
        existingSummary =
          typeof summary.content === "string"
            ? summary.content
            : "Summary";

        console.log("  ✅ Summary updated");

        // Remove ALL messages and add them back in correct order (SystemMessage must be first for Anthropic)
        const messagesToKeep = nonSystemMessages.slice(-2);
        return {
          messages: [
            ...nonSystemMessages.map((m) => new RemoveMessage({ id: m.id })),
            new SystemMessage(`Conversation summary: ${existingSummary}`),
            // Re-create the messages we want to keep as new instances
            ...messagesToKeep.map((m) => {
              if (m._getType() === "human")
                return new HumanMessage({ content: m.content });
              if (m._getType() === "ai")
                return new AIMessage({ content: m.content });
              return m;
            }),
          ],
        };
      }

      return {};
    })
    .addEdge("__start__", "agent")
    .addEdge("agent", "incrementalSummary")
    .addEdge("incrementalSummary", "__end__");

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n1️⃣ Demonstrating incremental summary:");

    const turns = [
      "I'm planning a trip to Japan",
      "I want to visit Tokyo and Kyoto",
      "I love Japanese food, especially ramen",
      "I'm interested in temples and shrines",
    ];

    for (const content of turns) {
      await agent.invoke(
        { messages: [{ role: "user", content }] },
        { configurable: { thread_id: "incremental_1" } }
      );
    }

    console.log("\n✅ Summary grows incrementally with conversation!");
  } catch (error) {
    console.error("❌ Incremental summarization demo failed:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateSummarization();
  await demonstrateSummarizationStrategies();
  await demonstrateIncrementalSummarization();
}
