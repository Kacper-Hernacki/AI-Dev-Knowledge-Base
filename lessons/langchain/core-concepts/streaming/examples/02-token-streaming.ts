/**
 * Token Streaming Example
 * Demonstrates streaming LLM tokens as they are generated
 */

import { z } from "zod";
import { createAgent, tool } from "langchain";

/**
 * Demonstrate basic token streaming
 */
export async function demonstrateTokenStreaming() {
  console.log("\n✨ Token Streaming");
  console.log("=".repeat(50));

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
  });

  try {
    console.log("\n1️⃣ Streaming tokens:");
    console.log("   Question: Tell me a short story about a robot");
    console.log("\n   Response:");
    console.log("   ───────────────────────────────────────────────");

    process.stdout.write("   ");

    for await (const [token, metadata] of await agent.stream(
      {
        messages: [
          {
            role: "user",
            content: "Tell me a very short story about a robot in 2 sentences",
          },
        ],
      },
      { streamMode: "messages" }
    )) {
      // Stream each token as it arrives
      if (token.contentBlocks) {
        for (const block of token.contentBlocks) {
          if (block.type === "text" && block.text) {
            process.stdout.write(block.text);
          }
        }
      }
    }

    console.log("\n   ───────────────────────────────────────────────");
    console.log("\n✅ Token streaming completed!");
  } catch (error) {
    console.error("\n❌ Token streaming demo failed:", error);
  }
}

/**
 * Demonstrate token streaming with tools
 */
export async function demonstrateTokenStreamingWithTools() {
  console.log("\n✨ Token Streaming with Tools");
  console.log("=".repeat(50));

  const getWeather = tool(
    async ({ city }) => {
      return `The weather in ${city} is 72°F and sunny with light clouds.`;
    },
    {
      name: "get_weather",
      description: "Get weather for a given city.",
      schema: z.object({
        city: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [getWeather],
  });

  try {
    console.log("\n1️⃣ Streaming with tool calls:");
    console.log("   Question: What's the weather in Tokyo?");
    console.log("");

    let inResponse = false;

    for await (const [token, metadata] of await agent.stream(
      {
        messages: [
          { role: "user", content: "What's the weather in Tokyo?" },
        ],
      },
      { streamMode: "messages" }
    )) {
      const node = metadata.langgraph_node;

      // Different handling based on which node is streaming
      if (node === "model") {
        if (!inResponse && token.contentBlocks) {
          console.log("   📝 AI Response:");
          console.log("   ───────────────────────────────────────────────");
          process.stdout.write("   ");
          inResponse = true;
        }

        if (token.contentBlocks) {
          for (const block of token.contentBlocks) {
            if (block.type === "text" && block.text) {
              process.stdout.write(block.text);
            } else if (block.type === "tool_use") {
              if (!inResponse) {
                console.log(`   🔧 Tool call: ${block.name}`);
                console.log(`      Args: ${JSON.stringify(block.input)}`);
              }
            }
          }
        }
      } else if (node === "tools" && inResponse) {
        console.log("\n   ───────────────────────────────────────────────");
        inResponse = false;
      }
    }

    if (inResponse) {
      console.log("\n   ───────────────────────────────────────────────");
    }

    console.log("\n✅ Token streaming with tools completed!");
  } catch (error) {
    console.error("\n❌ Token streaming with tools failed:", error);
  }
}

/**
 * Demonstrate monitoring token metadata
 */
export async function demonstrateTokenMetadata() {
  console.log("\n📊 Token Metadata");
  console.log("=".repeat(50));

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
  });

  try {
    console.log("\n1️⃣ Collecting metadata:");

    let tokenCount = 0;
    let chunkCount = 0;
    const nodes = new Set<string>();

    for await (const [token, metadata] of await agent.stream(
      {
        messages: [
          { role: "user", content: "Count to 5" },
        ],
      },
      { streamMode: "messages" }
    )) {
      chunkCount++;
      nodes.add(metadata.langgraph_node);

      if (token.contentBlocks) {
        for (const block of token.contentBlocks) {
          if (block.type === "text" && block.text) {
            tokenCount += block.text.length;
          }
        }
      }
    }

    console.log(`   📦 Chunks received: ${chunkCount}`);
    console.log(`   🔤 Characters streamed: ${tokenCount}`);
    console.log(`   🏷️  Nodes involved: ${Array.from(nodes).join(", ")}`);

    console.log("\n✅ Metadata collection completed!");
  } catch (error) {
    console.error("❌ Token metadata demo failed:", error);
  }
}

/**
 * Demonstrate token streaming patterns
 */
export function demonstrateTokenPatterns() {
  console.log("\n📋 Token Streaming Patterns");
  console.log("=".repeat(50));

  console.log("\n💡 What gets streamed:");
  console.log("  • Individual text tokens/chunks");
  console.log("  • Content blocks (text, tool_use)");
  console.log("  • Node metadata (which node is streaming)");
  console.log("  • Real-time generation progress");

  console.log("\n🎯 Use Cases:");
  console.log("  • Typewriter effect in UI");
  console.log("  • Immediate user feedback");
  console.log("  • Progressive content display");
  console.log("  • Reduced perceived latency");

  console.log("\n⚙️  Stream Mode: 'messages'");
  console.log("  { streamMode: 'messages' }");
  console.log("  → Returns: [token, metadata] tuples");

  console.log("\n🔧 Implementation Tips:");
  console.log("  • Buffer tokens for smooth display");
  console.log("  • Handle different content block types");
  console.log("  • Track which node is streaming");
  console.log("  • Implement proper error handling");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateTokenStreaming();
  await demonstrateTokenStreamingWithTools();
  await demonstrateTokenMetadata();
  demonstrateTokenPatterns();
}
