/**
 * Memory in Tools Example
 * Demonstrates reading and writing short-term memory from tools
 */

import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  Command,
  Annotation,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

/**
 * Define custom state with user context
 */
const CustomStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userId: Annotation<string | undefined>(),
  userName: Annotation<string | undefined>(),
  preferences: Annotation<Record<string, any>>({
    reducer: (prev, curr) => ({ ...prev, ...curr }),
    default: () => ({}),
  }),
});

/**
 * Demonstrate reading memory in tools
 */
export async function demonstrateReadMemoryInTools() {
  console.log("\n📖 Read Memory in Tools");
  console.log("=".repeat(50));

  // Tool that reads from agent state
  const getUserInfo = tool(
    async (_, config) => {
      const userId = config?.configurable?.userId;
      const userName = config?.configurable?.userName;

      console.log(`  🔍 Tool reading state - User ID: ${userId}`);

      return `User information: ID=${userId}, Name=${userName || "Unknown"}`;
    },
    {
      name: "get_user_info",
      description: "Get current user information from state",
      schema: z.object({}),
    }
  );

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  const workflow = new StateGraph(CustomStateAnnotation)
    .addNode("agent", async (state, config) => {
      const response = await model.bindTools([getUserInfo]).invoke(
        state.messages
      );
      return { messages: [response] };
    })
    .addNode("tools", new ToolNode([getUserInfo]))
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if ("tool_calls" in lastMessage && lastMessage.tool_calls?.length) {
        return "tools";
      }
      return "__end__";
    })
    .addEdge("tools", "agent");

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n1️⃣ Invoke tool with state context:");
    const response = await agent.invoke(
      {
        messages: [
          { role: "user", content: "Get my user information" },
        ],
        userId: "user_123",
        userName: "Alice",
      },
      {
        configurable: {
          thread_id: "tool_read_1",
          userId: "user_123",
          userName: "Alice",
        },
      }
    );

    const lastMsg = response.messages[response.messages.length - 1];
    console.log(`  ✅ Result: ${lastMsg.content}`);

    console.log("\n✅ Tool successfully read from agent state!");
  } catch (error) {
    console.error("❌ Read memory in tools demo failed:", error);
  }
}

/**
 * Demonstrate writing memory from tools
 */
export async function demonstrateWriteMemoryFromTools() {
  console.log("\n✍️  Write Memory from Tools");
  console.log("=".repeat(50));

  // Tool that updates agent state
  const updateUserPreferences = tool(
    async ({ theme, language }, config) => {
      console.log(
        `  💾 Tool writing to state - Theme: ${theme}, Language: ${language}`
      );

      // Return Command to update state
      return new Command({
        update: {
          preferences: { theme, language },
        },
      });
    },
    {
      name: "update_preferences",
      description: "Update user preferences in state",
      schema: z.object({
        theme: z.string().describe("UI theme preference"),
        language: z.string().describe("Language preference"),
      }),
    }
  );

  // Tool that reads preferences
  const getPreferences = tool(
    async (_, config) => {
      const preferences = (config?.configurable as any)?.preferences || {};
      console.log(`  📖 Tool reading preferences:`, preferences);
      return `Current preferences: ${JSON.stringify(preferences)}`;
    },
    {
      name: "get_preferences",
      description: "Get current user preferences",
      schema: z.object({}),
    }
  );

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  const tools = [updateUserPreferences, getPreferences];

  const workflow = new StateGraph(CustomStateAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.bindTools(tools).invoke(state.messages);
      return { messages: [response] };
    })
    .addNode("tools", new ToolNode(tools))
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if ("tool_calls" in lastMessage && lastMessage.tool_calls?.length) {
        return "tools";
      }
      return "__end__";
    })
    .addEdge("tools", "agent");

  const agent = workflow.compile({ checkpointer });

  try {
    const config = { configurable: { thread_id: "tool_write_1" } };

    console.log("\n1️⃣ Update preferences via tool:");
    await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: "Set my theme to dark and language to English",
          },
        ],
      },
      config
    );

    console.log("\n2️⃣ Read preferences in next turn:");
    const response = await agent.invoke(
      {
        messages: [
          { role: "user", content: "What are my current preferences?" },
        ],
      },
      config
    );

    console.log("\n✅ Tools can write to state using Command!");
  } catch (error) {
    console.error("❌ Write memory from tools demo failed:", error);
  }
}

/**
 * Demonstrate complex tool state interactions
 */
export async function demonstrateComplexToolState() {
  console.log("\n🔧 Complex Tool State Interactions");
  console.log("=".repeat(50));

  console.log("\n💡 Tool State Patterns:");
  console.log("  1. Read state via config.configurable");
  console.log("  2. Write state via Command({ update: {...} })");
  console.log("  3. Access custom state fields");
  console.log("  4. Update state based on tool logic");

  console.log("\n📋 Use Cases:");
  console.log("  • Store user preferences from tool actions");
  console.log("  • Track tool execution history");
  console.log("  • Share data between multiple tools");
  console.log("  • Build stateful tool workflows");

  console.log("\n⚙️  Best Practices:");
  console.log("  • Use Command for state updates");
  console.log("  • Keep state updates predictable");
  console.log("  • Document state schema clearly");
  console.log("  • Validate state changes");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateReadMemoryInTools();
  await demonstrateWriteMemoryFromTools();
  await demonstrateComplexToolState();
}
