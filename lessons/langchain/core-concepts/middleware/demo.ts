/**
 * Middleware Demo
 * Interactive demonstration of built-in and custom middleware
 */

import {
  demonstrateSummarization,
  demonstrateModelCallLimit,
  demonstrateToolCallLimit,
  demonstrateModelFallback,
  demonstratePIIDetection,
  demonstrateAnthropicCaching,
  demonstrateTodoList,
  demonstrateLLMToolSelector,
  demonstrateContextEditing,
  demonstrateHumanInTheLoop,
  summarizeBuiltInMiddleware,
} from "./examples/built-in-middleware-complete";

import {
  demonstrateNodeStyleHooks,
  demonstrateWrapStyleHooks,
  demonstrateCustomState,
  demonstrateContextExtension,
  demonstrateAgentJumps,
  demonstrateExecutionOrder,
  demonstrateDynamicToolSelection,
  demonstrateCombiningPatterns,
  summarizeCustomMiddleware,
} from "./examples/custom-middleware-complete";

/**
 * Main demo runner
 */
async function runDemo() {
  console.log("\n");
  console.log("═".repeat(60));
  console.log("  LANGCHAIN MIDDLEWARE - COMPREHENSIVE DEMO");
  console.log("═".repeat(60));

  console.log("\n\n");
  console.log("█".repeat(60));
  console.log("█  PART 1: BUILT-IN MIDDLEWARE");
  console.log("█".repeat(60));

  try {
    await demonstrateSummarization();
    await demonstrateModelCallLimit();
    await demonstrateToolCallLimit();
    await demonstrateModelFallback();
    await demonstratePIIDetection();
    await demonstrateAnthropicCaching();
    await demonstrateTodoList();
    await demonstrateLLMToolSelector();
    await demonstrateContextEditing();
    await demonstrateHumanInTheLoop();
    summarizeBuiltInMiddleware();
  } catch (error) {
    console.error("\n❌ Built-in middleware demo error:", error);
  }

  console.log("\n\n");
  console.log("█".repeat(60));
  console.log("█  PART 2: CUSTOM MIDDLEWARE");
  console.log("█".repeat(60));

  try {
    await demonstrateNodeStyleHooks();
    await demonstrateWrapStyleHooks();
    await demonstrateCustomState();
    await demonstrateContextExtension();
    await demonstrateAgentJumps();
    await demonstrateExecutionOrder();
    await demonstrateDynamicToolSelection();
    await demonstrateCombiningPatterns();
    summarizeCustomMiddleware();
  } catch (error) {
    console.error("\n❌ Custom middleware demo error:", error);
  }

  console.log("\n\n");
  console.log("═".repeat(60));
  console.log("  DEMO COMPLETE!");
  console.log("═".repeat(60));
  console.log("\n📚 Next Steps:");
  console.log("  1. Review lesson.md for detailed explanations");
  console.log("  2. Run tests: bun run middleware:test");
  console.log("  3. Explore individual examples in examples/");
  console.log("  4. Check out examples/built-in/ for focused demos");
  console.log("\n");
}

// Run demo if executed directly
if (import.meta.main) {
  runDemo().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { runDemo };
