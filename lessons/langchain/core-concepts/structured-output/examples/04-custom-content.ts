/**
 * Custom Tool Message Content Example
 * Demonstrates customizing tool messages in conversation history
 */

import { z } from "zod";
import { createAgent, toolStrategy } from "langchain";

/**
 * Example 1: Custom Success Message
 */
export async function customSuccessMessage() {
  console.log("\n✅ Custom Success Message");
  console.log("=".repeat(50));

  const MeetingAction = z.object({
    task: z.string().describe("The specific task to be completed"),
    assignee: z.string().describe("Person responsible for the task"),
    priority: z.enum(["low", "medium", "high"]).describe("Priority level"),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(MeetingAction, {
      toolMessageContent: "Action item captured and added to meeting notes!",
    }),
  });

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "From our meeting: Sarah needs to update the project timeline as soon as possible",
      },
    ],
  });

  console.log("\n📥 Input:");
  console.log(
    "  'Sarah needs to update the project timeline as soon as possible'"
  );

  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n📜 Message History:");
  for (const msg of result.messages) {
    const role = msg._getType();
    const content =
      typeof msg.content === "string" ? msg.content.slice(0, 60) : "...";
    console.log(`  ${role}: ${content}${content.length >= 60 ? "..." : ""}`);
  }

  console.log("\n✅ Custom message appears in conversation");
  console.log("✅ Better user experience");
  console.log("✅ Contextual feedback");
}

/**
 * Example 2: Different Messages Per Schema
 */
export async function differentMessagesPerSchema() {
  console.log("\n📋 Different Messages Per Schema");
  console.log("=".repeat(50));

  const BugReport = z.object({
    severity: z.enum(["low", "medium", "high", "critical"]),
    component: z.string(),
    description: z.string(),
  });

  const FeatureRequest = z.object({
    title: z.string(),
    priority: z.enum(["nice-to-have", "important", "critical"]),
    userStory: z.string(),
  });

  // Create two agents with different messages
  const bugAgent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(BugReport, {
      toolMessageContent: "🐛 Bug report filed and assigned to engineering team",
    }),
  });

  const featureAgent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(FeatureRequest, {
      toolMessageContent: "💡 Feature request added to product roadmap",
    }),
  });

  // Test bug report
  console.log("\n📝 Test 1: Bug Report");
  const bugResult = await bugAgent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Critical bug: Login button doesn't work on mobile Safari. Users can't access their accounts.",
      },
    ],
  });

  console.log("\n📤 Bug Report Output:");
  console.log(JSON.stringify(bugResult.structuredResponse, null, 2));

  const bugToolMsg = bugResult.messages.find((m) => m._getType() === "tool");
  console.log(`\n💬 Tool Message: "${bugToolMsg?.content}"`);

  // Test feature request
  console.log("\n\n📝 Test 2: Feature Request");
  const featureResult = await featureAgent.invoke({
    messages: [
      {
        role: "user",
        content:
          "We need dark mode support. As a user, I want to toggle between light and dark themes to reduce eye strain.",
      },
    ],
  });

  console.log("\n📤 Feature Request Output:");
  console.log(JSON.stringify(featureResult.structuredResponse, null, 2));

  const featureToolMsg = featureResult.messages.find(
    (m) => m._getType() === "tool"
  );
  console.log(`\n💬 Tool Message: "${featureToolMsg?.content}"`);

  console.log("\n✅ Context-specific messages");
  console.log("✅ Improved clarity");
  console.log("✅ Better workflow tracking");
}

/**
 * Example 3: Dynamic Tool Message Content
 */
export async function dynamicToolMessage() {
  console.log("\n🔄 Dynamic Tool Message Content");
  console.log("=".repeat(50));

  const DataValidation = z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(DataValidation, {
      toolMessageContent: (result) => {
        if (result.isValid) {
          return "✅ Data validation passed successfully";
        } else {
          const errorCount = result.errors?.length || 0;
          const warningCount = result.warnings?.length || 0;
          return `❌ Validation failed: ${errorCount} error(s), ${warningCount} warning(s)`;
        }
      },
    }),
  });

  // Test valid data
  console.log("\n📝 Test 1: Valid Data");
  const validResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Validate: Email is valid@email.com, password is secure, age is 25",
      },
    ],
  });

  console.log("\n📤 Validation Result:");
  console.log(JSON.stringify(validResult.structuredResponse, null, 2));

  const validToolMsg = validResult.messages.find((m) => m._getType() === "tool");
  console.log(`\n💬 Tool Message: "${validToolMsg?.content}"`);

  // Test invalid data
  console.log("\n\n📝 Test 2: Invalid Data");
  const invalidResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Validate: Email is missing, password too short, age is negative",
      },
    ],
  });

  console.log("\n📤 Validation Result:");
  console.log(JSON.stringify(invalidResult.structuredResponse, null, 2));

  const invalidToolMsg = invalidResult.messages.find(
    (m) => m._getType() === "tool"
  );
  console.log(`\n💬 Tool Message: "${invalidToolMsg?.content}"`);

  console.log("\n✅ Dynamic message generation");
  console.log("✅ Based on structured output");
  console.log("✅ Conditional formatting");
}

/**
 * Example 4: Comparison - Default vs Custom Messages
 */
export async function compareDefaultVsCustom() {
  console.log("\n⚖️  Comparison: Default vs Custom Messages");
  console.log("=".repeat(50));

  const TaskItem = z.object({
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.string().optional(),
  });

  // Agent with default message
  const defaultAgent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(TaskItem),
  });

  // Agent with custom message
  const customAgent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(TaskItem, {
      toolMessageContent: "📝 Task added to your list!",
    }),
  });

  const userInput = "Add task: Review pull request, not done yet, due Friday";

  console.log("\n📥 Input:", userInput);

  // Default message
  console.log("\n🔸 With Default Message:");
  const defaultResult = await defaultAgent.invoke({
    messages: [{ role: "user", content: userInput }],
  });

  const defaultToolMsg = defaultResult.messages.find(
    (m) => m._getType() === "tool"
  );
  console.log(`💬 "${defaultToolMsg?.content?.toString().slice(0, 80)}..."`);

  // Custom message
  console.log("\n🔹 With Custom Message:");
  const customResult = await customAgent.invoke({
    messages: [{ role: "user", content: userInput }],
  });

  const customToolMsg = customResult.messages.find(
    (m) => m._getType() === "tool"
  );
  console.log(`💬 "${customToolMsg?.content}"`);

  console.log("\n✅ Custom messages are cleaner");
  console.log("✅ More user-friendly");
  console.log("✅ Easier to understand");
}

// Run if executed directly
if (import.meta.main) {
  await customSuccessMessage();
  await differentMessagesPerSchema();
  await dynamicToolMessage();
  await compareDefaultVsCustom();
}
