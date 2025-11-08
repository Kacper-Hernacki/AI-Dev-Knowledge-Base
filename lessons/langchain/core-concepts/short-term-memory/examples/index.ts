/**
 * Short-Term Memory Examples Index
 * Central export point for all memory examples
 */

// Example imports
export * from "./01-basic-checkpointer.js";
export * from "./02-postgres-checkpointer.js";
export * from "./03-custom-state.js";
export * from "./04-trim-messages.js";
export * from "./05-delete-messages.js";
export * from "./06-summarize-messages.js";
export * from "./07-memory-in-tools.js";
export * from "./08-memory-in-prompts.js";
export * from "./09-hooks.js";

/**
 * Run all examples in sequence
 */
export async function runAllExamples() {
  const examples = [
    {
      name: "Basic Checkpointer",
      module: await import("./01-basic-checkpointer.js"),
    },
    {
      name: "PostgreSQL Checkpointer",
      module: await import("./02-postgres-checkpointer.js"),
      optional: true,
    },
    {
      name: "Custom State",
      module: await import("./03-custom-state.js"),
    },
    {
      name: "Trim Messages",
      module: await import("./04-trim-messages.js"),
    },
    {
      name: "Delete Messages",
      module: await import("./05-delete-messages.js"),
    },
    {
      name: "Summarize Messages",
      module: await import("./06-summarize-messages.js"),
    },
    {
      name: "Memory in Tools",
      module: await import("./07-memory-in-tools.js"),
    },
    {
      name: "Memory in Prompts",
      module: await import("./08-memory-in-prompts.js"),
    },
    {
      name: "Before/After Hooks",
      module: await import("./09-hooks.js"),
    },
  ];

  console.log("\n" + "=".repeat(60));
  console.log("🚀 Running All Short-Term Memory Examples");
  console.log("=".repeat(60));

  for (const { name, module, optional } of examples) {
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
      if (optional) {
        console.log(`⚠️  Optional example skipped: ${error}`);
      } else {
        console.error(`❌ Example failed: ${error}`);
      }
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
