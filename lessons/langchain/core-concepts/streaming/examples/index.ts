/**
 * Streaming Examples Index
 * Central export point for all streaming examples
 */

// Example imports
export * from "./01-agent-progress.js";
export * from "./02-token-streaming.js";
export * from "./03-custom-updates.js";
export * from "./04-multiple-modes.js";
export * from "./05-disable-streaming.js";

/**
 * Run all examples in sequence
 */
export async function runAllExamples() {
  const examples = [
    {
      name: "Agent Progress Streaming",
      module: await import("./01-agent-progress.js"),
    },
    {
      name: "Token Streaming",
      module: await import("./02-token-streaming.js"),
    },
    {
      name: "Custom Updates",
      module: await import("./03-custom-updates.js"),
    },
    {
      name: "Multiple Stream Modes",
      module: await import("./04-multiple-modes.js"),
    },
    {
      name: "Disable Streaming",
      module: await import("./05-disable-streaming.js"),
    },
  ];

  console.log("\n" + "=".repeat(60));
  console.log("🚀 Running All Streaming Examples");
  console.log("=".repeat(60));

  for (const { name, module } of examples) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📚 ${name}`);
    console.log("─".repeat(60));

    try {
      // Run all exported demonstrate* functions
      const functions = Object.keys(module).filter((key) =>
        key.startsWith("demonstrate")
      );

      for (const fnName of functions) {
        if (typeof module[fnName] === "function") {
          await module[fnName]();
        }
      }
    } catch (error) {
      console.error(`❌ Example failed: ${error}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All Examples Completed!");
  console.log("=".repeat(60));
}

// Run all if executed directly
if (import.meta.main) {
  await runAllExamples();
}
