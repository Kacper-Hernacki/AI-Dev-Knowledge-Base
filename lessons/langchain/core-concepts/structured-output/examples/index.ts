/**
 * Structured Output Examples - Entry Point
 * Exports all structured output examples and demonstrations
 */

// Provider Strategy Exports
export {
  extractContactInfoZod,
  extractContactInfoJSON,
  extractComplexData,
} from "./01-provider-strategy";

// Tool Strategy Exports
export {
  analyzeProductReview,
  analyzeProductReviewJSON,
  handleUnionTypes,
  complexValidation,
} from "./02-tool-strategy";

// Error Handling Exports
export {
  schemaValidationError,
  multipleOutputsError,
  customErrorMessage,
  conditionalErrorHandling,
  noErrorHandling,
  complexErrorScenarios,
} from "./03-error-handling";

// Custom Content Exports
export {
  customSuccessMessage,
  differentMessagesPerSchema,
  dynamicToolMessage,
  compareDefaultVsCustom,
} from "./04-custom-content";

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log("\n🚀 Running All Structured Output Examples\n");

  // Import all functions
  const providerExamples = await import("./01-provider-strategy");
  const toolExamples = await import("./02-tool-strategy");
  const errorExamples = await import("./03-error-handling");
  const contentExamples = await import("./04-custom-content");

  // Part 1: Provider Strategy
  console.log("\n📦 PART 1: PROVIDER STRATEGY\n");
  await providerExamples.extractContactInfoZod();
  await providerExamples.extractContactInfoJSON();
  await providerExamples.extractComplexData();

  // Part 2: Tool Strategy
  console.log("\n\n🔧 PART 2: TOOL CALLING STRATEGY\n");
  await toolExamples.analyzeProductReview();
  await toolExamples.analyzeProductReviewJSON();
  await toolExamples.handleUnionTypes();
  await toolExamples.complexValidation();

  // Part 3: Error Handling
  console.log("\n\n❌ PART 3: ERROR HANDLING\n");
  await errorExamples.schemaValidationError();
  await errorExamples.multipleOutputsError();
  await errorExamples.customErrorMessage();
  await errorExamples.conditionalErrorHandling();
  await errorExamples.noErrorHandling();
  await errorExamples.complexErrorScenarios();

  // Part 4: Custom Content
  console.log("\n\n💬 PART 4: CUSTOM TOOL MESSAGE CONTENT\n");
  await contentExamples.customSuccessMessage();
  await contentExamples.differentMessagesPerSchema();
  await contentExamples.dynamicToolMessage();
  await contentExamples.compareDefaultVsCustom();

  console.log("\n✅ All examples completed!\n");
}

// Run all examples if executed directly
if (import.meta.main) {
  runAllExamples().catch((error) => {
    console.error("❌ Error running examples:", error);
    process.exit(1);
  });
}
