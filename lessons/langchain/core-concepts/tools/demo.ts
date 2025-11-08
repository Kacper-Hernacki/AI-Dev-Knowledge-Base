/**
 * Tools Demo - Interactive demonstration of the tools system
 * Run with: bun --env-file=.env lessons/langchain/core-concepts/tools/demo.ts
 */

import { runAllExamples } from "./examples/index.js";
import { runMemoryExamples } from "./examples/memory-store-example.js";

async function main() {
  console.log("\n🚀 Welcome to the LangChain Tools Demo!");
  console.log("=" .repeat(60));
  console.log("\nThis demo will showcase:");
  console.log("  1. Basic tool creation and execution");
  console.log("  2. Custom tools with validation");
  console.log("  3. Context-aware tools");
  console.log("  4. Streaming tools with progress updates");
  console.log("  5. Tool service and registry");
  console.log("  6. Error handling and retries");
  console.log("  7. Parallel execution");
  console.log("  8. Tool validation");
  console.log("  9. Execution statistics");
  console.log(" 10. Memory/Store integration (InMemoryStore)");
  console.log("\n" + "=".repeat(60));

  try {
    await runAllExamples();

    // Add memory examples
    console.log("\n" + "─".repeat(60));
    await runMemoryExamples();

    console.log("\n" + "=".repeat(60));
    console.log("✅ Demo completed successfully!");
    console.log("\nNext steps:");
    console.log("  • Read lesson.md for comprehensive documentation");
    console.log("  • Explore examples/ for more use cases");
    console.log("  • Run memory example separately: bun examples/memory-store-example.ts");
    console.log("  • Run tests with: bun test lessons/langchain/core-concepts/tools/tests/");
    console.log("  • Check out https://docs.langchain.com for more advanced patterns");
    console.log("=" .repeat(60));
  } catch (error) {
    console.error("\n❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);
