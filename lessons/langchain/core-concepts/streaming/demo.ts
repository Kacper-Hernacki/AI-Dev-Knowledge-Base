/**
 * Streaming Demo - Interactive demonstration
 * Run with: bun --env-file=.env lessons/langchain/core-concepts/streaming/demo.ts
 */

import { runAllExamples } from "./examples/index.js";

async function main() {
  console.log("\n🌊 Welcome to the LangChain Streaming Demo!");
  console.log("=".repeat(60));
  console.log("\nThis demo will showcase:");
  console.log("  1. Agent progress streaming");
  console.log("  2. LLM token streaming");
  console.log("  3. Custom updates from tools");
  console.log("  4. Multiple stream modes");
  console.log("  5. Controlling streaming behavior");
  console.log("\n" + "=".repeat(60));

  try {
    await runAllExamples();

    console.log("\n" + "=".repeat(60));
    console.log("✅ Demo completed successfully!");
    console.log("\nNext steps:");
    console.log("  • Read lesson.md for comprehensive documentation");
    console.log("  • Explore examples/ for specific use cases");
    console.log("  • Run tests with: bun test lessons/langchain/core-concepts/streaming/tests/");
    console.log("  • Check out https://docs.langchain.com for more patterns");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);
