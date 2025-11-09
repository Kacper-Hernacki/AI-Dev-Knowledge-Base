/**
 * Multiple Stream Modes Example
 * Demonstrates streaming multiple modes simultaneously
 */

import { z } from "zod";
import { tool, createAgent } from "langchain";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

/**
 * Demonstrate streaming multiple modes
 */
export async function demonstrateMultipleModes() {
  console.log("\n🔀 Multiple Stream Modes");
  console.log("=".repeat(50));

  const searchDatabase = tool(
    async ({ query }, config: LangGraphRunnableConfig) => {
      config.writer?.(`🔍 Searching for: "${query}"`);
      await new Promise((resolve) => setTimeout(resolve, 300));

      config.writer?.(`✓ Found 3 results for "${query}"`);

      return `Found results for ${query}: Document A, Document B, Document C`;
    },
    {
      name: "search_database",
      description: "Search the database for information.",
      schema: z.object({
        query: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [searchDatabase],
  });

  try {
    console.log("\n1️⃣ Streaming all modes:");
    console.log("   Question: Search for information about AI");
    console.log("");

    for await (const [streamMode, chunk] of await agent.stream(
      {
        messages: [
          { role: "user", content: "Search for information about AI" },
        ],
      },
      { streamMode: ["updates", "messages", "custom"] }
    )) {
      if (streamMode === "custom") {
        console.log(`   [CUSTOM] ${chunk}`);
      } else if (streamMode === "updates") {
        const [step] = Object.entries(chunk)[0];
        console.log(`   [UPDATE] Node: ${step}`);
      } else if (streamMode === "messages") {
        const [token, metadata] = chunk;
        if (token.contentBlocks) {
          for (const block of token.contentBlocks) {
            if (block.type === "text" && block.text) {
              process.stdout.write(`   [TOKEN] ${block.text}`);
            }
          }
        }
      }
    }

    console.log("\n\n✅ Multiple modes completed!");
  } catch (error) {
    console.error("\n❌ Multiple modes demo failed:", error);
  }
}

/**
 * Demonstrate selective mode handling
 */
export async function demonstrateSelectiveModes() {
  console.log("\n🎯 Selective Mode Handling");
  console.log("=".repeat(50));

  const getData = tool(
    async ({ source }, config: LangGraphRunnableConfig) => {
      config.writer?.(`Fetching from ${source}`);
      await new Promise((resolve) => setTimeout(resolve, 200));
      return `Data from ${source}`;
    },
    {
      name: "get_data",
      description: "Get data from a source.",
      schema: z.object({
        source: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [getData],
  });

  try {
    console.log("\n1️⃣ Handling different modes selectively:");
    console.log("   Question: Get data from the API");
    console.log("");

    let response = "";

    for await (const [streamMode, chunk] of await agent.stream(
      {
        messages: [{ role: "user", content: "Get data from the weather API" }],
      },
      { streamMode: ["updates", "custom"] }
    )) {
      switch (streamMode) {
        case "custom":
          console.log(`   ℹ️  ${chunk}`);
          break;

        case "updates":
          const [step, content] = Object.entries(chunk)[0];
          if (step === "model" && content.messages[0].content) {
            response = content.messages[0].content;
          }
          console.log(`   ⚙️  Step: ${step}`);
          break;
      }
    }

    console.log(`\n   📝 Final response: ${response.slice(0, 60)}...`);
    console.log("\n✅ Selective handling completed!");
  } catch (error) {
    console.error("\n❌ Selective modes demo failed:", error);
  }
}

/**
 * Demonstrate building a comprehensive monitor
 */
export async function demonstrateComprehensiveMonitor() {
  console.log("\n📊 Comprehensive Monitoring");
  console.log("=".repeat(50));

  const processData = tool(
    async ({ dataset }, config: LangGraphRunnableConfig) => {
      config.writer?.(`Processing ${dataset}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      config.writer?.(`Completed ${dataset}`);
      return `Processed ${dataset}`;
    },
    {
      name: "process_data",
      description: "Process a dataset.",
      schema: z.object({
        dataset: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [processData],
  });

  try {
    console.log("\n1️⃣ Building comprehensive monitor:");
    console.log("   Question: Process the sales dataset");
    console.log("");

    const monitor = {
      steps: [] as string[],
      tokens: 0,
      customUpdates: [] as string[],
      startTime: Date.now(),
    };

    for await (const [streamMode, chunk] of await agent.stream(
      {
        messages: [{ role: "user", content: "Process the sales dataset" }],
      },
      { streamMode: ["updates", "messages", "custom"] }
    )) {
      if (streamMode === "custom") {
        monitor.customUpdates.push(chunk);
        console.log(`   💬 ${chunk}`);
      } else if (streamMode === "updates") {
        const [step] = Object.entries(chunk)[0];
        monitor.steps.push(step);
      } else if (streamMode === "messages") {
        const [token] = chunk;
        if (token.contentBlocks) {
          monitor.tokens += token.contentBlocks.length;
        }
      }
    }

    const duration = Date.now() - monitor.startTime;

    console.log("\n   📊 Monitoring Summary:");
    console.log(`      • Duration: ${duration}ms`);
    console.log(`      • Steps: ${monitor.steps.length}`);
    console.log(`      • Token chunks: ${monitor.tokens}`);
    console.log(`      • Custom updates: ${monitor.customUpdates.length}`);

    console.log("\n✅ Comprehensive monitoring completed!");
  } catch (error) {
    console.error("\n❌ Comprehensive monitoring failed:", error);
  }
}

/**
 * Demonstrate multiple mode patterns
 */
export function demonstrateMultipleModePatterns() {
  console.log("\n📋 Multiple Mode Patterns");
  console.log("=".repeat(50));

  console.log("\n💡 Combining Stream Modes:");
  console.log("  • updates: Agent step progress");
  console.log("  • messages: Token-by-token output");
  console.log("  • custom: Tool progress updates");

  console.log("\n🎯 Use Cases:");
  console.log("  • Complete execution monitoring");
  console.log("  • Building dashboards");
  console.log("  • Debug views with all info");
  console.log("  • Rich progress indicators");

  console.log("\n⚙️  Configuration:");
  console.log("  { streamMode: ['updates', 'messages', 'custom'] }");
  console.log("  → Returns: [mode, data] tuples");

  console.log("\n🔧 Implementation Tips:");
  console.log("  • Use switch/case for mode handling");
  console.log("  • Aggregate data across modes");
  console.log("  • Buffer tokens for display");
  console.log("  • Track timing information");

  console.log("\n⚖️  Trade-offs:");
  console.log("  • More data = more processing");
  console.log("  • Choose modes based on needs");
  console.log("  • Consider network overhead");
  console.log("  • Balance detail vs. performance");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateMultipleModes();
  await demonstrateSelectiveModes();
  await demonstrateComprehensiveMonitor();
  demonstrateMultipleModePatterns();
}
