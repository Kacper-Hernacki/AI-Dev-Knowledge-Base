/**
 * Summarization Middleware Example
 * Demonstrates using LangChain's built-in summarizationMiddleware
 *
 * This is the recommended, production-ready approach for managing
 * conversation history through automatic summarization.
 */

import { createAgent, summarizationMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

/**
 * Demonstrate automatic summarization with middleware
 */
export async function demonstrateSummarizationMiddleware() {
  console.log("\n🎯 Summarization Middleware (Recommended)");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();

  // Create agent with summarization middleware
  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    middleware: [
      summarizationMiddleware({
        model: "claude-3-5-haiku-20241022",
        maxTokensBeforeSummary: 1000, // Lower for demo purposes
        messagesToKeep: 2, // Keep last 2 messages
      }),
    ],
    checkpointer,
  });

  const config = { configurable: { thread_id: "middleware_demo_1" } };

  try {
    console.log("\n1️⃣ Building conversation:");

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

      const lastMsg = response.messages[response.messages.length - 1];
      console.log(`   AI: ${lastMsg.content}`);
      console.log(`   Total messages: ${response.messages.length}`);
    }

    console.log("\n✅ Middleware automatically managed conversation length!");
  } catch (error) {
    console.error("❌ Summarization middleware demo failed:", error);
  }
}

/**
 * Demonstrate different middleware configurations
 */
export async function demonstrateMiddlewareConfigurations() {
  console.log("\n⚙️  Middleware Configuration Options");
  console.log("=".repeat(50));

  console.log("\n💡 Configuration Parameters:");
  console.log("  • model: Model to use for generating summaries");
  console.log("     - Can be cheaper/faster than main model");
  console.log("     - Example: Use GPT-4 for chat, GPT-3.5 for summaries");
  console.log("");
  console.log("  • maxTokensBeforeSummary: Token threshold");
  console.log("     - Triggers summarization when exceeded");
  console.log("     - Default: 4000 tokens");
  console.log("     - Adjust based on model context limits");
  console.log("");
  console.log("  • messagesToKeep: Recent messages to preserve");
  console.log("     - Keeps immediate context intact");
  console.log("     - Default: 20 messages");
  console.log("     - Balance between context and tokens");

  console.log("\n📋 Example Configurations:");

  console.log("\n  1. Budget-conscious (cheaper summarization):");
  console.log("     summarizationMiddleware({");
  console.log("       model: 'claude-3-5-haiku-20241022',");
  console.log("       maxTokensBeforeSummary: 2000,");
  console.log("       messagesToKeep: 10,");
  console.log("     })");

  console.log("\n  2. High-fidelity (better summaries):");
  console.log("     summarizationMiddleware({");
  console.log("       model: 'claude-3-5-sonnet-20241022',");
  console.log("       maxTokensBeforeSummary: 8000,");
  console.log("       messagesToKeep: 30,");
  console.log("     })");

  console.log("\n  3. Aggressive compression:");
  console.log("     summarizationMiddleware({");
  console.log("       model: 'claude-3-5-haiku-20241022',");
  console.log("       maxTokensBeforeSummary: 1000,");
  console.log("       messagesToKeep: 5,");
  console.log("     })");
}

/**
 * Demonstrate combining multiple middleware
 */
export async function demonstrateMultipleMiddleware() {
  console.log("\n🔗 Combining Multiple Middleware");
  console.log("=".repeat(50));

  console.log("\n💡 Middleware are composable - you can combine them:");
  console.log("");
  console.log("  import {");
  console.log("    createAgent,");
  console.log("    summarizationMiddleware,");
  console.log("    humanInTheLoopMiddleware,");
  console.log("    piiRedactionMiddleware,");
  console.log("  } from 'langchain';");
  console.log("");
  console.log("  const agent = createAgent({");
  console.log("    model: 'claude-3-5-sonnet-20241022',");
  console.log("    tools: [readEmail, sendEmail],");
  console.log("    middleware: [");
  console.log("      // Remove PII before processing");
  console.log("      piiRedactionMiddleware({");
  console.log("        patterns: ['email', 'phone', 'ssn'],");
  console.log("      }),");
  console.log("      // Manage conversation length");
  console.log("      summarizationMiddleware({");
  console.log("        model: 'claude-3-5-haiku-20241022',");
  console.log("        maxTokensBeforeSummary: 4000,");
  console.log("      }),");
  console.log("      // Require approval for sensitive actions");
  console.log("      humanInTheLoopMiddleware({");
  console.log("        interruptOn: {");
  console.log("          sendEmail: {");
  console.log("            allowedDecisions: ['approve', 'edit', 'reject'],");
  console.log("          },");
  console.log("        },");
  console.log("      }),");
  console.log("    ],");
  console.log("  });");

  console.log("\n📊 Middleware execution order:");
  console.log("  • Middleware run in the order specified");
  console.log("  • Each can transform messages or state");
  console.log("  • Consider dependencies when ordering");
}

/**
 * Compare manual vs middleware approaches
 */
export async function compareApproaches() {
  console.log("\n⚖️  Manual vs Middleware Comparison");
  console.log("=".repeat(50));

  console.log("\n❌ Manual Summarization (06-summarize-messages.ts):");
  console.log("  • More code to maintain");
  console.log("  • Custom logic can be error-prone");
  console.log("  • Need to handle edge cases manually");
  console.log("  • Good for learning how it works");
  console.log("  • Useful for very custom requirements");

  console.log("\n✅ Middleware Approach (Recommended):");
  console.log("  • Less code - built-in and tested");
  console.log("  • Production-ready out of the box");
  console.log("  • Configurable via simple parameters");
  console.log("  • Composable with other middleware");
  console.log("  • Maintained by LangChain team");

  console.log("\n🎯 When to use each:");
  console.log("  Manual:");
  console.log("    • Learning purposes");
  console.log("    • Highly custom summarization logic");
  console.log("    • Special business requirements");
  console.log("");
  console.log("  Middleware:");
  console.log("    • Production applications");
  console.log("    • Standard summarization needs");
  console.log("    • Faster development");
  console.log("    • Reliability and maintenance");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateSummarizationMiddleware();
  await demonstrateMiddlewareConfigurations();
  await demonstrateMultipleMiddleware();
  await compareApproaches();
}
