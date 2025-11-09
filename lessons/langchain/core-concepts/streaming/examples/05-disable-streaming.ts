/**
 * Disable Streaming Example
 * Demonstrates how to disable token streaming for specific models
 */

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent, tool } from "langchain";

/**
 * Demonstrate disabling streaming
 */
export async function demonstrateDisableStreaming() {
  console.log("\n🚫 Disable Token Streaming");
  console.log("=".repeat(50));

  // Create model with streaming disabled
  const modelNoStream = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
    streaming: false, // Disable streaming
  });

  const agent = createAgent({
    model: modelNoStream,
    tools: [],
  });

  try {
    console.log("\n1️⃣ With streaming disabled:");
    console.log("   Question: Count to 5");
    console.log("\n   Waiting for complete response...");

    const startTime = Date.now();

    for await (const [token, metadata] of await agent.stream(
      {
        messages: [{ role: "user", content: "Count to 5" }],
      },
      { streamMode: "messages" }
    )) {
      // When streaming is disabled, you get the complete response at once
      if (token.contentBlocks) {
        for (const block of token.contentBlocks) {
          if (block.type === "text") {
            console.log(`\n   Response: ${block.text}`);
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n   ⏱️  Received in: ${duration}ms (all at once)`);

    console.log("\n✅ Non-streaming mode demonstrated!");
  } catch (error) {
    console.error("❌ Disable streaming demo failed:", error);
  }
}

/**
 * Compare streaming vs non-streaming
 */
export async function compareStreamingModes() {
  console.log("\n⚖️  Streaming vs Non-Streaming Comparison");
  console.log("=".repeat(50));

  const prompt = "Tell me a very short story in 2 sentences";

  // Streaming enabled
  console.log("\n1️⃣ WITH streaming:");
  console.log("   ───────────────────────────────────────────────");

  const modelWithStream = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
    streaming: true,
  });

  const agentWithStream = createAgent({
    model: modelWithStream,
    tools: [],
  });

  process.stdout.write("   ");
  let firstTokenTime = 0;
  let tokenCount = 0;
  const streamStart = Date.now();

  for await (const [token] of await agentWithStream.stream(
    {
      messages: [{ role: "user", content: prompt }],
    },
    { streamMode: "messages" }
  )) {
    if (token.contentBlocks) {
      for (const block of token.contentBlocks) {
        if (block.type === "text" && block.text) {
          if (tokenCount === 0) {
            firstTokenTime = Date.now() - streamStart;
          }
          tokenCount++;
          process.stdout.write(block.text);
        }
      }
    }
  }

  const streamDuration = Date.now() - streamStart;

  console.log("\n   ───────────────────────────────────────────────");
  console.log(`   ⏱️  First token: ${firstTokenTime}ms`);
  console.log(`   ⏱️  Total time: ${streamDuration}ms`);
  console.log(`   📦 Token chunks: ${tokenCount}`);

  // Streaming disabled
  console.log("\n2️⃣ WITHOUT streaming:");
  console.log("   ───────────────────────────────────────────────");

  const modelNoStream = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
    streaming: false,
  });

  const agentNoStream = createAgent({
    model: modelNoStream,
    tools: [],
  });

  const noStreamStart = Date.now();

  for await (const [token] of await agentNoStream.stream(
    {
      messages: [{ role: "user", content: prompt }],
    },
    { streamMode: "messages" }
  )) {
    if (token.contentBlocks) {
      for (const block of token.contentBlocks) {
        if (block.type === "text") {
          console.log(`   ${block.text}`);
        }
      }
    }
  }

  const noStreamDuration = Date.now() - noStreamStart;

  console.log("   ───────────────────────────────────────────────");
  console.log(`   ⏱️  Response time: ${noStreamDuration}ms`);
  console.log(`   📦 Single chunk: 1`);

  console.log("\n✅ Comparison completed!");
}

/**
 * Demonstrate use case for disabled streaming
 */
export async function demonstrateMultiAgentScenario() {
  console.log("\n🤖 Multi-Agent Scenario");
  console.log("=".repeat(50));

  console.log("\n💡 Use Case: Background Agents");
  console.log("   When you have multiple agents and only want");
  console.log("   to stream output from the main agent:");

  // Background agent (no streaming)
  const backgroundAgent = createAgent({
    model: new ChatAnthropic({
      model: "claude-3-5-haiku-20241022",
      streaming: false, // Background work, no streaming needed
    }),
    tools: [],
  });

  // Main agent (with streaming)
  const mainAgent = createAgent({
    model: new ChatAnthropic({
      model: "claude-3-5-haiku-20241022",
      streaming: true, // User-facing, streaming enabled
    }),
    tools: [],
  });

  try {
    console.log("\n1️⃣ Background agent (no streaming):");
    console.log("   Processing...");

    await backgroundAgent.invoke({
      messages: [
        {
          role: "user",
          content: "Summarize: AI is transforming technology",
        },
      ],
    });

    console.log("   ✓ Complete");

    console.log("\n2️⃣ Main agent (with streaming):");
    console.log("   ───────────────────────────────────────────────");
    process.stdout.write("   ");

    for await (const [token] of await mainAgent.stream(
      {
        messages: [{ role: "user", content: "What is AI?" }],
      },
      { streamMode: "messages" }
    )) {
      if (token.contentBlocks) {
        for (const block of token.contentBlocks) {
          if (block.type === "text" && block.text) {
            process.stdout.write(block.text);
          }
        }
      }
    }

    console.log("\n   ───────────────────────────────────────────────");
    console.log("\n✅ Multi-agent scenario completed!");
  } catch (error) {
    console.error("\n❌ Multi-agent scenario failed:", error);
  }
}

/**
 * Demonstrate streaming control patterns
 */
export function demonstrateStreamingControlPatterns() {
  console.log("\n📋 Streaming Control Patterns");
  console.log("=".repeat(50));

  console.log("\n💡 When to Disable Streaming:");
  console.log("  • Background processing");
  console.log("  • Batch operations");
  console.log("  • Non-user-facing agents");
  console.log("  • Testing and debugging");
  console.log("  • API endpoints with caching");

  console.log("\n💡 When to Enable Streaming:");
  console.log("  • Direct user interactions");
  console.log("  • Long responses");
  console.log("  • Real-time feedback needed");
  console.log("  • Interactive chat applications");

  console.log("\n⚙️  Configuration:");
  console.log("  const model = new ChatAnthropic({");
  console.log("    model: 'claude-3-5-haiku-20241022',");
  console.log("    streaming: false, // Disable streaming");
  console.log("  });");

  console.log("\n⚖️  Trade-offs:");
  console.log("  WITH streaming:");
  console.log("    ✓ Better UX (progressive display)");
  console.log("    ✓ Faster perceived response");
  console.log("    ✗ More processing overhead");
  console.log("    ✗ Complex error handling");
  console.log("");
  console.log("  WITHOUT streaming:");
  console.log("    ✓ Simpler implementation");
  console.log("    ✓ Easier error handling");
  console.log("    ✓ Less network overhead");
  console.log("    ✗ Longer perceived wait time");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateDisableStreaming();
  await compareStreamingModes();
  await demonstrateMultiAgentScenario();
  demonstrateStreamingControlPatterns();
}
