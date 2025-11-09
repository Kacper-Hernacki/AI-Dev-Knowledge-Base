/**
 * Agent Progress Streaming Example
 * Demonstrates streaming agent state updates after each step
 */

import { z } from "zod";
import { createAgent, tool } from "langchain";

/**
 * Demonstrate basic agent progress streaming
 */
export async function demonstrateAgentProgress() {
  console.log("\n🔄 Agent Progress Streaming");
  console.log("=".repeat(50));

  // Create a simple tool
  const getWeather = tool(
    async ({ city }) => {
      return `The weather in ${city} is always sunny!`;
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
    console.log("\n1️⃣ Streaming agent steps:");
    console.log("   Question: What is the weather in San Francisco?");
    console.log("");

    let stepCount = 0;
    for await (const chunk of await agent.stream(
      {
        messages: [
          { role: "user", content: "what is the weather in sf" },
        ],
      },
      { streamMode: "updates" }
    )) {
      stepCount++;
      const [step, content] = Object.entries(chunk)[0];

      console.log(`   Step ${stepCount}: ${step}`);

      if (step === "model") {
        const message = content.messages[0];
        if (message.tool_calls && message.tool_calls.length > 0) {
          console.log(`   → Tool called: ${message.tool_calls[0].name}`);
          console.log(`   → Arguments: ${JSON.stringify(message.tool_calls[0].args)}`);
        } else if (message.content) {
          console.log(`   → Response: ${message.content.slice(0, 60)}...`);
        }
      } else if (step === "tools") {
        const message = content.messages[0];
        console.log(`   → Tool result: ${message.content}`);
      }
      console.log("");
    }

    console.log(`✅ Completed in ${stepCount} steps!`);
  } catch (error) {
    console.error("❌ Agent progress demo failed:", error);
  }
}

/**
 * Demonstrate streaming with multiple tool calls
 */
export async function demonstrateMultipleToolCalls() {
  console.log("\n🔄 Multiple Tool Calls Streaming");
  console.log("=".repeat(50));

  const getWeather = tool(
    async ({ city }) => {
      return `The weather in ${city} is 72°F and sunny.`;
    },
    {
      name: "get_weather",
      description: "Get weather for a given city.",
      schema: z.object({
        city: z.string(),
      }),
    }
  );

  const getTime = tool(
    async ({ city }) => {
      return `The time in ${city} is 3:00 PM.`;
    },
    {
      name: "get_time",
      description: "Get current time for a given city.",
      schema: z.object({
        city: z.string(),
      }),
    }
  );

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [getWeather, getTime],
  });

  try {
    console.log("\n1️⃣ Asking for weather and time:");
    console.log("   Question: What's the weather and time in NYC?");
    console.log("");

    for await (const chunk of await agent.stream(
      {
        messages: [
          { role: "user", content: "What's the weather and time in NYC?" },
        ],
      },
      { streamMode: "updates" }
    )) {
      const [step, content] = Object.entries(chunk)[0];
      console.log(`   📍 ${step.toUpperCase()}`);

      if (step === "model" && content.messages[0].tool_calls) {
        content.messages[0].tool_calls.forEach((tc: any) => {
          console.log(`      → Calling: ${tc.name}(${JSON.stringify(tc.args)})`);
        });
      } else if (step === "tools") {
        content.messages.forEach((msg: any) => {
          console.log(`      → ${msg.name}: ${msg.content}`);
        });
      }
    }

    console.log("\n✅ Multi-tool streaming completed!");
  } catch (error) {
    console.error("❌ Multiple tool calls demo failed:", error);
  }
}

/**
 * Demonstrate progress tracking patterns
 */
export function demonstrateProgressPatterns() {
  console.log("\n📋 Agent Progress Patterns");
  console.log("=".repeat(50));

  console.log("\n💡 What gets streamed:");
  console.log("  • Each node execution (model, tools)");
  console.log("  • State updates after each step");
  console.log("  • Tool call requests and results");
  console.log("  • Final agent response");

  console.log("\n🎯 Use Cases:");
  console.log("  • Progress indicators in UI");
  console.log("  • Debugging agent execution");
  console.log("  • Real-time logging");
  console.log("  • Step-by-step visualization");

  console.log("\n⚙️  Stream Mode: 'updates'");
  console.log("  { streamMode: 'updates' }");
  console.log("  → Returns: Map of node name to state update");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateAgentProgress();
  await demonstrateMultipleToolCalls();
  demonstrateProgressPatterns();
}
