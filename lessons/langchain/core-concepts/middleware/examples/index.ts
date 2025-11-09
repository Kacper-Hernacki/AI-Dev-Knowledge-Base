/**
 * Middleware Examples - Entry Point
 * Exports all middleware examples and demonstrations
 */

// Built-in Middleware Exports
export {
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
} from "./built-in-middleware-complete";

// Custom Middleware Exports
export {
  demonstrateNodeStyleHooks,
  demonstrateWrapStyleHooks,
  demonstrateCustomState,
  demonstrateContextExtension,
  demonstrateAgentJumps,
  demonstrateExecutionOrder,
  demonstrateDynamicToolSelection,
  demonstrateCombiningPatterns,
  summarizeCustomMiddleware,
} from "./custom-middleware-complete";

// Individual Built-in Examples
export {
  demonstrateSummarizationMiddleware,
  demonstrateSummarizationConfig,
} from "./built-in/01-summarization";

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log("\n🚀 Running All Middleware Examples\n");

  const {
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
  } = await import("./built-in-middleware-complete");

  const {
    demonstrateNodeStyleHooks,
    demonstrateWrapStyleHooks,
    demonstrateCustomState,
    demonstrateContextExtension,
    demonstrateAgentJumps,
    demonstrateExecutionOrder,
    demonstrateDynamicToolSelection,
    demonstrateCombiningPatterns,
    summarizeCustomMiddleware,
  } = await import("./custom-middleware-complete");

  // Part 1: Built-in Middleware
  console.log("\n📦 BUILT-IN MIDDLEWARE\n");
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

  // Part 2: Custom Middleware
  console.log("\n\n🔧 CUSTOM MIDDLEWARE\n");
  await demonstrateNodeStyleHooks();
  await demonstrateWrapStyleHooks();
  await demonstrateCustomState();
  await demonstrateContextExtension();
  await demonstrateAgentJumps();
  await demonstrateExecutionOrder();
  await demonstrateDynamicToolSelection();
  await demonstrateCombiningPatterns();
  summarizeCustomMiddleware();

  console.log("\n✅ All examples completed!\n");
}

// Run all examples if executed directly
if (import.meta.main) {
  runAllExamples().catch((error) => {
    console.error("❌ Error running examples:", error);
    process.exit(1);
  });
}
