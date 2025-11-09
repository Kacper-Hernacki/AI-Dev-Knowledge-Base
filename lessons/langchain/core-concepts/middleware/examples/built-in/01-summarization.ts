/**
 * Summarization Middleware Example
 * Automatically summarize conversation history when approaching token limits
 */

import { createAgent, summarizationMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

/**
 * Demonstrate basic summarization middleware
 */
export async function demonstrateSummarizationMiddleware() {
  console.log("\n📝 Summarization Middleware");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [
      summarizationMiddleware({
        model: "claude-3-5-haiku-20241022",
        maxTokensBeforeSummary: 500, // Low for demo
        messagesToKeep: 2,
      }),
    ],
    checkpointer,
  });

  const config = { configurable: { thread_id: "summary_demo_1" } };

  try {
    console.log("\n1️⃣ Building long conversation:");

    const messages = [
      "My name is Alice",
      "I'm a software engineer",
      "I work with Python and TypeScript",
      "I love building AI applications",
      "I also enjoy hiking",
      "What do you know about me?",
    ];

    for (const [i, content] of messages.entries()) {
      console.log(`\n   Turn ${i + 1}: ${content}`);
      const response = await agent.invoke(
        { messages: [{ role: "user", content }] },
        config
      );

      const lastMsg = response.messages[response.messages.length - 1];
      console.log(`   AI: ${lastMsg.content.slice(0, 80)}...`);
      console.log(`   Messages in state: ${response.messages.length}`);
    }

    console.log("\n✅ Summarization middleware auto-managed conversation!");
  } catch (error) {
    console.error("❌ Summarization demo failed:", error);
  }
}

/**
 * Demonstrate configuration options
 */
export function demonstrateSummarizationConfig() {
  console.log("\n⚙️  Summarization Configuration");
  console.log("=".repeat(50));

  console.log("\n💡 Configuration Options:");
  console.log("  • model: Model for generating summaries");
  console.log("  • maxTokensBeforeSummary: Token threshold (default: 4000)");
  console.log("  • messagesToKeep: Recent messages to preserve (default: 20)");
  console.log("  • tokenCounter: Custom token counting function");
  console.log("  • summaryPrompt: Custom prompt template");
  console.log("  • summaryPrefix: Prefix for summary messages");

  console.log("\n📋 Example Configurations:");

  console.log("\n  Budget-conscious:");
  console.log("    summarizationMiddleware({");
  console.log("      model: 'claude-3-5-haiku-20241022',");
  console.log("      maxTokensBeforeSummary: 2000,");
  console.log("      messagesToKeep: 10,");
  console.log("    })");

  console.log("\n  High-fidelity:");
  console.log("    summarizationMiddleware({");
  console.log("      model: 'claude-3-5-sonnet-20241022',");
  console.log("      maxTokensBeforeSummary: 8000,");
  console.log("      messagesToKeep: 30,");
  console.log("    })");

  console.log("\n✅ Use summarization for long-running conversations!");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateSummarizationMiddleware();
  demonstrateSummarizationConfig();
}
