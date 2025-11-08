/**
 * Memory in Prompts Example
 * Demonstrates accessing state to create dynamic prompts
 */

import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  Annotation,
} from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";

/**
 * Define custom state with user context
 */
const UserContextAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userName: Annotation<string | undefined>(),
  userRole: Annotation<string | undefined>(),
  conversationTopic: Annotation<string | undefined>(),
});

/**
 * Demonstrate dynamic prompts based on state
 */
export async function demonstrateDynamicPrompts() {
  console.log("\n🎨 Dynamic Prompts from State");
  console.log("=".repeat(50));

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  // Create workflow with dynamic prompt injection
  const workflow = new StateGraph(UserContextAnnotation)
    .addNode("agent", async (state, config) => {
      // Build dynamic system message from state
      const userName = state.userName || "User";
      const userRole = state.userRole || "user";
      const topic = state.conversationTopic || "general";

      const systemPrompt = new SystemMessage(
        `You are a helpful assistant. Current context:
- User: ${userName}
- Role: ${userRole}
- Topic: ${topic}

Tailor your responses to the user's role and current topic.`
      );

      console.log(`  🎯 Dynamic prompt for ${userName} (${userRole})`);

      // Inject system message at the beginning
      const messagesWithPrompt = [systemPrompt, ...state.messages];

      const response = await model.invoke(messagesWithPrompt);
      return { messages: [response] };
    })
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n1️⃣ Developer context:");
    const response1 = await agent.invoke(
      {
        messages: [
          { role: "user", content: "Explain what APIs are" },
        ],
        userName: "Alice",
        userRole: "developer",
        conversationTopic: "programming",
      },
      { configurable: { thread_id: "prompt_1" } }
    );
    console.log(
      `  AI: ${response1.messages[response1.messages.length - 1].content}`
    );

    console.log("\n2️⃣ Beginner context:");
    const response2 = await agent.invoke(
      {
        messages: [
          { role: "user", content: "Explain what APIs are" },
        ],
        userName: "Bob",
        userRole: "beginner",
        conversationTopic: "learning",
      },
      { configurable: { thread_id: "prompt_2" } }
    );
    console.log(
      `  AI: ${response2.messages[response2.messages.length - 1].content}`
    );

    console.log("\n✅ Prompts adapt based on state context!");
  } catch (error) {
    console.error("❌ Dynamic prompts demo failed:", error);
  }
}

/**
 * Demonstrate context-aware prompt generation
 */
export async function demonstrateContextAwarePrompts() {
  console.log("\n🔍 Context-Aware Prompt Generation");
  console.log("=".repeat(50));

  const PreferencesAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    tone: Annotation<string>({
      default: () => "professional",
    }),
    verbosity: Annotation<string>({
      default: () => "normal",
    }),
    expertise: Annotation<string>({
      default: () => "intermediate",
    }),
  });

  const checkpointer = new MemorySaver();
  const model = new ChatAnthropic({
    model: "claude-3-5-haiku-20241022",
    temperature: 0,
  });

  const workflow = new StateGraph(PreferencesAnnotation)
    .addNode("agent", async (state) => {
      // Generate prompt based on preferences
      const toneInstructions = {
        professional: "Be formal and professional",
        casual: "Be friendly and casual",
        technical: "Be precise and technical",
      };

      const verbosityInstructions = {
        concise: "Keep responses brief and to the point",
        normal: "Provide balanced responses",
        detailed: "Give comprehensive, detailed explanations",
      };

      const expertiseInstructions = {
        beginner: "Explain concepts from basics",
        intermediate: "Assume some prior knowledge",
        expert: "Use advanced terminology freely",
      };

      const systemPrompt = new SystemMessage(
        `Assistant instructions:
${toneInstructions[state.tone as keyof typeof toneInstructions] || "Be helpful"}
${verbosityInstructions[state.verbosity as keyof typeof verbosityInstructions] || ""}
${expertiseInstructions[state.expertise as keyof typeof expertiseInstructions] || ""}`
      );

      console.log(
        `  ⚙️  Tone: ${state.tone}, Verbosity: ${state.verbosity}, Expertise: ${state.expertise}`
      );

      const messagesWithPrompt = [systemPrompt, ...state.messages];
      const response = await model.invoke(messagesWithPrompt);
      return { messages: [response] };
    })
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  const agent = workflow.compile({ checkpointer });

  try {
    console.log("\n1️⃣ Concise + Technical style:");
    const response1 = await agent.invoke(
      {
        messages: [
          { role: "user", content: "What is REST?" },
        ],
        tone: "technical",
        verbosity: "concise",
        expertise: "expert",
      },
      { configurable: { thread_id: "context_1" } }
    );
    console.log(
      `  AI: ${response1.messages[response1.messages.length - 1].content}`
    );

    console.log("\n2️⃣ Detailed + Casual style:");
    const response2 = await agent.invoke(
      {
        messages: [
          { role: "user", content: "What is REST?" },
        ],
        tone: "casual",
        verbosity: "detailed",
        expertise: "beginner",
      },
      { configurable: { thread_id: "context_2" } }
    );
    console.log(
      `  AI: ${response2.messages[response2.messages.length - 1].content}`
    );

    console.log("\n✅ Prompts generated from user preferences!");
  } catch (error) {
    console.error("❌ Context-aware prompts demo failed:", error);
  }
}

/**
 * Demonstrate prompt template patterns
 */
export async function demonstratePromptPatterns() {
  console.log("\n📋 Prompt Template Patterns");
  console.log("=".repeat(50));

  console.log("\n💡 Common Patterns:");
  console.log("  1. User-specific instructions");
  console.log("     • Personalize based on user profile");
  console.log("     • Adapt to user's expertise level");
  console.log("");
  console.log("  2. Context injection");
  console.log("     • Add relevant context from state");
  console.log("     • Include conversation metadata");
  console.log("");
  console.log("  3. Dynamic constraints");
  console.log("     • Apply user preferences");
  console.log("     • Enforce business rules");
  console.log("");
  console.log("  4. Tool-specific prompts");
  console.log("     • Guide tool selection");
  console.log("     • Provide tool usage examples");

  console.log("\n⚙️  Implementation Tips:");
  console.log("  • Use state to store user preferences");
  console.log("  • Build prompts dynamically in agent node");
  console.log("  • Keep prompts concise but informative");
  console.log("  • Test with different state values");

  console.log("\n📊 Use Cases:");
  console.log("  • Multi-tenant applications");
  console.log("  • Personalized AI assistants");
  console.log("  • Role-based access control");
  console.log("  • Domain-specific customization");
}

// Run if executed directly
if (import.meta.main) {
  await demonstrateDynamicPrompts();
  await demonstrateContextAwarePrompts();
  await demonstratePromptPatterns();
}
