/**
 * Structured Output Demo
 * Interactive demonstration of all structured output features
 */

import {
  extractContactInfoZod,
  extractContactInfoJSON,
  extractComplexData,
} from "./examples/01-provider-strategy";

import {
  analyzeProductReview,
  analyzeProductReviewJSON,
  handleUnionTypes,
  complexValidation,
} from "./examples/02-tool-strategy";

import {
  schemaValidationError,
  multipleOutputsError,
  customErrorMessage,
  conditionalErrorHandling,
  noErrorHandling,
  complexErrorScenarios,
} from "./examples/03-error-handling";

import {
  customSuccessMessage,
  differentMessagesPerSchema,
  dynamicToolMessage,
  compareDefaultVsCustom,
} from "./examples/04-custom-content";

/**
 * Main demo runner
 */
async function runDemo() {
  console.log("\n");
  console.log("═".repeat(60));
  console.log("  LANGCHAIN STRUCTURED OUTPUT - COMPREHENSIVE DEMO");
  console.log("═".repeat(60));

  console.log("\n\n");
  console.log("█".repeat(60));
  console.log("█  PART 1: PROVIDER STRATEGY");
  console.log("█".repeat(60));

  try {
    await extractContactInfoZod();
    await extractContactInfoJSON();
    await extractComplexData();
  } catch (error) {
    console.error("\n❌ Provider strategy demo error:", error);
  }

  console.log("\n\n");
  console.log("█".repeat(60));
  console.log("█  PART 2: TOOL CALLING STRATEGY");
  console.log("█".repeat(60));

  try {
    await analyzeProductReview();
    await analyzeProductReviewJSON();
    await handleUnionTypes();
    await complexValidation();
  } catch (error) {
    console.error("\n❌ Tool strategy demo error:", error);
  }

  console.log("\n\n");
  console.log("█".repeat(60));
  console.log("█  PART 3: ERROR HANDLING");
  console.log("█".repeat(60));

  try {
    await schemaValidationError();
    await multipleOutputsError();
    await customErrorMessage();
    await conditionalErrorHandling();
    await noErrorHandling();
    await complexErrorScenarios();
  } catch (error) {
    console.error("\n❌ Error handling demo error:", error);
  }

  console.log("\n\n");
  console.log("█".repeat(60));
  console.log("█  PART 4: CUSTOM TOOL MESSAGE CONTENT");
  console.log("█".repeat(60));

  try {
    await customSuccessMessage();
    await differentMessagesPerSchema();
    await dynamicToolMessage();
    await compareDefaultVsCustom();
  } catch (error) {
    console.error("\n❌ Custom content demo error:", error);
  }

  console.log("\n\n");
  console.log("═".repeat(60));
  console.log("  DEMO COMPLETE!");
  console.log("═".repeat(60));
  console.log("\n📚 Next Steps:");
  console.log("  1. Review lesson.md for detailed explanations");
  console.log("  2. Run tests: bun run structured-output:test");
  console.log("  3. Explore individual examples in examples/");
  console.log("  4. Try modifying schemas and inputs");
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
