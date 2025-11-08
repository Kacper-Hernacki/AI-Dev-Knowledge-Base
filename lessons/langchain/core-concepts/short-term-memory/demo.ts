/**
 * Short-Term Memory Demo - Interactive demonstration
 * Run with: bun --env-file=.env lessons/langchain/core-concepts/short-term-memory/demo.ts
 */

import { runAllExamples } from "./examples/index.js";

async function main() {
  console.log("\n🧠 Welcome to the LangChain Short-Term Memory Demo!");
  console.log("=".repeat(60));
  console.log("\nThis demo will showcase:");
  console.log("  1. Basic MemorySaver checkpointer");
  console.log("  2. PostgreSQL persistence (production)");
  console.log("  3. Custom state schemas");
  console.log("  4. Message trimming strategies");
  console.log("  5. Message deletion patterns");
  console.log("  6. Manual conversation summarization");
  console.log("  7. Memory access in tools");
  console.log("  8. Dynamic prompts from state");
  console.log("  9. Before/after model hooks");
  console.log(" 10. Summarization middleware (recommended)");
  console.log("\n" + "=".repeat(60));

  try {
    await runAllExamples();

    console.log("\n" + "=".repeat(60));
    console.log("✅ Demo completed successfully!");
    console.log("\nNext steps:");
    console.log("  • Read lesson.md for comprehensive documentation");
    console.log("  • Explore examples/ for specific use cases");
    console.log("  • Run tests with: bun test lessons/langchain/core-concepts/short-term-memory/tests/");
    console.log("  • Check out https://docs.langchain.com for more patterns");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);
