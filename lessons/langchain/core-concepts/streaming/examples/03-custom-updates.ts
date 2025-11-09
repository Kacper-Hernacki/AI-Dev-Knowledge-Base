/**
 * Custom Updates Example
 * Demonstrates streaming custom updates from tools and middleware
 */

import { z } from "zod";
import { tool, createAgent } from "langchain";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

/**
 * Demonstrate basic custom updates
 */
export async function demonstrateCustomUpdates() {
  console.log("\n📢 Custom Updates Streaming");
  console.log("=".repeat(50));

  // Tool that emits custom progress updates
  const fetchData = tool(
    async ({ source }, config: LangGraphRunnableConfig) => {
      config.writer?.(`🔍 Connecting to ${source}...`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      config.writer?.(`📥 Downloading data from ${source}...`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      config.writer?.(`✅ Data acquired from ${source}`);

      return `Successfully fetched data from ${source}`;
    },
    {
      name: "fetch_data",
      description: "Fetch data from a source.",
      schema: z.object({
        source: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [fetchData],
  });

  try {
    console.log("\n1️⃣ Streaming custom updates:");
    console.log("   Question: Fetch data from the API");
    console.log("");

    for await (const chunk of await agent.stream(
      {
        messages: [{ role: "user", content: "Fetch data from the weather API" }],
      },
      { streamMode: "custom" }
    )) {
      console.log(`   ${chunk}`);
    }

    console.log("\n✅ Custom updates completed!");
  } catch (error) {
    console.error("❌ Custom updates demo failed:", error);
  }
}

/**
 * Demonstrate progress tracking with custom updates
 */
export async function demonstrateProgressTracking() {
  console.log("\n📊 Progress Tracking");
  console.log("=".repeat(50));

  const processRecords = tool(
    async ({ count }, config: LangGraphRunnableConfig) => {
      const total = parseInt(count);

      for (let i = 1; i <= total; i++) {
        config.writer?.(`Processing record ${i}/${total}`);
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (i % 5 === 0) {
          config.writer?.(`✓ Checkpoint: ${i} records processed`);
        }
      }

      config.writer?.(`✅ All ${total} records processed successfully`);

      return `Processed ${total} records`;
    },
    {
      name: "process_records",
      description: "Process a batch of records.",
      schema: z.object({
        count: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [processRecords],
  });

  try {
    console.log("\n1️⃣ Tracking progress:");
    console.log("   Question: Process 15 records");
    console.log("");

    for await (const chunk of await agent.stream(
      {
        messages: [{ role: "user", content: "Process 15 records" }],
      },
      { streamMode: "custom" }
    )) {
      console.log(`   ${chunk}`);
    }

    console.log("\n✅ Progress tracking completed!");
  } catch (error) {
    console.error("❌ Progress tracking demo failed:", error);
  }
}

/**
 * Demonstrate multi-stage updates
 */
export async function demonstrateMultiStageUpdates() {
  console.log("\n🔄 Multi-Stage Updates");
  console.log("=".repeat(50));

  const analyzeData = tool(
    async ({ dataset }, config: LangGraphRunnableConfig) => {
      // Stage 1: Validation
      config.writer?.(`🔍 Stage 1/3: Validating ${dataset}...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      config.writer?.(`✓ Validation complete`);

      // Stage 2: Processing
      config.writer?.(`⚙️  Stage 2/3: Processing ${dataset}...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      config.writer?.(`✓ Processing complete`);

      // Stage 3: Analysis
      config.writer?.(`📊 Stage 3/3: Analyzing results...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      config.writer?.(`✓ Analysis complete`);

      return `Analysis of ${dataset} completed successfully`;
    },
    {
      name: "analyze_data",
      description: "Analyze a dataset through multiple stages.",
      schema: z.object({
        dataset: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [analyzeData],
  });

  try {
    console.log("\n1️⃣ Multi-stage analysis:");
    console.log("   Question: Analyze the sales dataset");
    console.log("");

    for await (const chunk of await agent.stream(
      {
        messages: [{ role: "user", content: "Analyze the sales dataset" }],
      },
      { streamMode: "custom" }
    )) {
      console.log(`   ${chunk}`);
    }

    console.log("\n✅ Multi-stage updates completed!");
  } catch (error) {
    console.error("❌ Multi-stage updates failed:", error);
  }
}

/**
 * Demonstrate custom update patterns
 */
export function demonstrateCustomPatterns() {
  console.log("\n📋 Custom Update Patterns");
  console.log("=".repeat(50));

  console.log("\n💡 What you can stream:");
  console.log("  • Progress percentages");
  console.log("  • Status messages");
  console.log("  • Stage completions");
  console.log("  • Error/warning messages");
  console.log("  • Resource usage stats");
  console.log("  • Custom application data");

  console.log("\n🎯 Use Cases:");
  console.log("  • Long-running operations");
  console.log("  • Multi-step processes");
  console.log("  • Data processing pipelines");
  console.log("  • File upload/download");
  console.log("  • External API calls");

  console.log("\n⚙️  Stream Mode: 'custom'");
  console.log("  { streamMode: 'custom' }");
  console.log("  → Use: config.writer?.('your message')");

  console.log("\n🔧 Implementation Tips:");
  console.log("  • Emit meaningful status updates");
  console.log("  • Include progress indicators");
  console.log("  • Use consistent formatting");
  console.log("  • Handle errors gracefully");

  console.log("\n⚠️  Important Note:");
  console.log("  • Tools with writer can't be invoked outside LangGraph");
  console.log("  • Always provide writer function in config");
  console.log("  • Design tools to work with/without writer");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateCustomUpdates();
  await demonstrateProgressTracking();
  await demonstrateMultiStageUpdates();
  demonstrateCustomPatterns();
}
