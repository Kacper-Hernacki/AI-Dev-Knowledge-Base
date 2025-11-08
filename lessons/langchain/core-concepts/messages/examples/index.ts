/**
 * Examples for messages lesson
 * Demonstrates various message creation, parsing, and management patterns
 */

import {
  MessageBuilder,
  MessageParser,
  MessageService,
  ConversationHistory,
  MultimodalMessageBuilder
} from "../core/index.js";
import {
  MESSAGE_CONFIG,
  calculateCost,
  MIME_TYPES
} from "../config/index.js";

/**
 * Demonstrate basic message creation
 */
export async function demonstrateBasicMessages(): Promise<void> {
  console.log("\n💬 Basic Messages Demo");
  console.log("=".repeat(50));

  try {
    // System message
    const systemMsg = MessageBuilder.system(
      "You are a helpful AI assistant that provides concise answers."
    );
    console.log("\n📋 System Message:");
    console.log(`  Content: ${MessageParser.extractText(systemMsg)}`);
    console.log(`  Type: ${MessageParser.getMessageType(systemMsg)}`);

    // Human message
    const humanMsg = MessageBuilder.human(
      "What is the capital of France?"
    );
    console.log("\n👤 Human Message:");
    console.log(`  Content: ${MessageParser.extractText(humanMsg)}`);
    console.log(`  Type: ${MessageParser.getMessageType(humanMsg)}`);

    // Human message with metadata
    const humanWithMeta = MessageBuilder.humanWithMetadata(
      "Hello, my name is Alice",
      { name: "alice", id: "msg_123" }
    );
    console.log("\n👤 Human Message (with metadata):");
    console.log(`  Content: ${MessageParser.extractText(humanWithMeta)}`);
    console.log(`  Name: ${MessageParser.getMessageName(humanWithMeta)}`);
    console.log(`  ID: ${MessageParser.getMessageId(humanWithMeta)}`);

    // AI message
    const aiMsg = MessageBuilder.ai(
      "The capital of France is Paris."
    );
    console.log("\n🤖 AI Message:");
    console.log(`  Content: ${MessageParser.extractText(aiMsg)}`);
    console.log(`  Type: ${MessageParser.getMessageType(aiMsg)}`);

    // Tool message
    const toolMsg = MessageBuilder.tool(
      "Temperature: 72°F, Conditions: Sunny",
      "call_123",
      "get_weather"
    );
    console.log("\n🔧 Tool Message:");
    console.log(`  Content: ${MessageParser.extractText(toolMsg)}`);
    console.log(`  Tool Call ID: ${(toolMsg as any).tool_call_id}`);
    console.log(`  Tool Name: ${MessageParser.getMessageName(toolMsg)}`);

  } catch (error) {
    console.error("❌ Basic messages demo failed:", error);
  }
}

/**
 * Demonstrate conversation creation
 */
export async function demonstrateConversation(): Promise<void> {
  console.log("\n💭 Conversation Demo");
  console.log("=".repeat(50));

  try {
    // Method 1: Using conversation helper
    const messages1 = MessageBuilder.conversation([
      { role: "system", content: "You are a helpful coding assistant." },
      { role: "user", content: "How do I create a REST API?" },
      { role: "assistant", content: "To create a REST API, you can use frameworks like Express.js..." }
    ]);

    console.log("\n📝 Method 1: Conversation from array");
    console.log(`  Total messages: ${messages1.length}`);
    messages1.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. [${MessageParser.getMessageType(msg).toUpperCase()}]: ${MessageParser.extractText(msg).slice(0, 50)}...`);
    });

    // Method 2: Using MessageService
    const messages2 = MessageService.createConversation(
      [
        { user: "What is TypeScript?", assistant: "TypeScript is a typed superset of JavaScript..." },
        { user: "How do I install it?", assistant: "You can install it using npm install -g typescript" }
      ],
      "You are a TypeScript expert."
    );

    console.log("\n📝 Method 2: MessageService conversation");
    console.log(`  Total messages: ${messages2.length}`);

    // Get conversation stats
    const stats = MessageService.getConversationStats(messages2);
    console.log("\n📊 Conversation Stats:");
    console.log(`  Total messages: ${stats.totalMessages}`);
    console.log(`  By type:`, stats.byType);
    console.log(`  Has multimodal: ${stats.hasMultimodal}`);
    console.log(`  Has tool calls: ${stats.hasToolCalls}`);

  } catch (error) {
    console.error("❌ Conversation demo failed:", error);
  }
}

/**
 * Demonstrate multimodal messages
 */
export async function demonstrateMultimodal(): Promise<void> {
  console.log("\n🖼️  Multimodal Messages Demo");
  console.log("=".repeat(50));

  try {
    // Image from URL
    const imageMsg = MessageBuilder.withImage(
      "Describe what you see in this image",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/481px-Cat03.jpg"
    );

    console.log("\n📸 Image Message:");
    console.log(`  Is multimodal: ${MessageParser.isMultimodal(imageMsg)}`);
    const blocks1 = MessageParser.extractContentBlocks(imageMsg);
    console.log(`  Content blocks: ${blocks1.length}`);
    blocks1.forEach((block, idx) => {
      console.log(`  ${idx + 1}. Type: ${block.type}`);
    });

    // Multiple content types using builder
    const multiMsg = new MultimodalMessageBuilder()
      .addText("Please analyze these files:")
      .addImageUrl("https://example.com/chart.png", MIME_TYPES.IMAGE_PNG)
      .addPDF("https://example.com/report.pdf", "Q4_Report.pdf")
      .build();

    console.log("\n📦 Multi-content Message:");
    console.log(`  Is multimodal: ${MessageParser.isMultimodal(multiMsg)}`);
    const blocks2 = MessageParser.extractContentBlocks(multiMsg);
    console.log(`  Content blocks: ${blocks2.length}`);
    blocks2.forEach((block, idx) => {
      console.log(`  ${idx + 1}. Type: ${block.type}`);
    });

    // Base64 image example (dummy data)
    const base64Msg = MessageBuilder.withImageData(
      "What color is this?",
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      MIME_TYPES.IMAGE_PNG
    );

    console.log("\n🔢 Base64 Image Message:");
    console.log(`  Is multimodal: ${MessageParser.isMultimodal(base64Msg)}`);

  } catch (error) {
    console.error("❌ Multimodal demo failed:", error);
  }
}

/**
 * Demonstrate message parsing
 */
export async function demonstrateMessageParsing(): Promise<void> {
  console.log("\n🔍 Message Parsing Demo");
  console.log("=".repeat(50));

  try {
    // Create a conversation
    const messages = MessageBuilder.conversation([
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Tell me about AI" },
      { role: "assistant", content: "AI stands for Artificial Intelligence..." }
    ]);

    console.log("\n📄 Extracting text from messages:");
    messages.forEach((msg, idx) => {
      const text = MessageParser.extractText(msg);
      const type = MessageParser.getMessageType(msg);
      console.log(`  ${idx + 1}. [${type.toUpperCase()}]: ${text.slice(0, 60)}...`);
    });

    // Filter by type
    console.log("\n🔎 Filter by type:");
    const humanMessages = MessageParser.filterByType(messages, "human");
    console.log(`  Human messages: ${humanMessages.length}`);

    const aiMessages = MessageParser.filterByType(messages, "ai");
    console.log(`  AI messages: ${aiMessages.length}`);

    // Format conversation
    console.log("\n💬 Formatted conversation:");
    const formatted = MessageParser.formatConversation(messages);
    console.log(formatted);

    // Convert to simple objects
    console.log("\n📋 Convert to JSON:");
    const jsonObjects = MessageParser.toSimpleObjects(messages);
    console.log(JSON.stringify(jsonObjects, null, 2).slice(0, 300) + "...");

  } catch (error) {
    console.error("❌ Message parsing demo failed:", error);
  }
}

/**
 * Demonstrate conversation history management
 */
export async function demonstrateConversationHistory(): Promise<void> {
  console.log("\n📚 Conversation History Demo");
  console.log("=".repeat(50));

  try {
    // Create history with max size
    const history = new ConversationHistory([], 10);

    // Add system message
    history.add(MessageBuilder.system("You are a helpful assistant."));
    console.log(`\n➕ Added system message. Total: ${history.count()}`);

    // Add conversation exchanges
    history.add(MessageBuilder.human("What is 2+2?"));
    history.add(MessageBuilder.ai("2+2 equals 4."));
    history.add(MessageBuilder.human("What is 10*10?"));
    history.add(MessageBuilder.ai("10*10 equals 100."));

    console.log(`➕ Added conversation. Total: ${history.count()}`);

    // Get all messages
    console.log("\n📜 All messages:");
    const allMessages = history.getAll();
    allMessages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. [${MessageParser.getMessageType(msg).toUpperCase()}]: ${MessageParser.extractText(msg)}`);
    });

    // Get last N messages
    console.log("\n🔙 Last 2 messages:");
    const lastTwo = history.getLast(2);
    lastTwo.forEach((msg) => {
      console.log(`  [${MessageParser.getMessageType(msg).toUpperCase()}]: ${MessageParser.extractText(msg)}`);
    });

    // Get by type
    console.log("\n👥 Human messages only:");
    const humanMsgs = history.getByType("human");
    humanMsgs.forEach((msg) => {
      console.log(`  ${MessageParser.extractText(msg)}`);
    });

    // Format conversation
    console.log("\n💬 Formatted conversation:");
    console.log(history.format());

  } catch (error) {
    console.error("❌ Conversation history demo failed:", error);
  }
}

/**
 * Demonstrate tool messages with artifacts
 */
export async function demonstrateToolMessages(): Promise<void> {
  console.log("\n🛠️  Tool Messages Demo");
  console.log("=".repeat(50));

  try {
    // Simple tool message
    const toolMsg1 = MessageBuilder.tool(
      "The weather is sunny, 72°F",
      "call_123",
      "get_weather"
    );

    console.log("\n🔧 Simple tool message:");
    console.log(`  Content: ${MessageParser.extractText(toolMsg1)}`);
    console.log(`  Tool call ID: ${(toolMsg1 as any).tool_call_id}`);

    // Tool message with artifact
    const artifact = {
      document_id: "doc_456",
      page: 1,
      source: "research_paper.pdf",
      relevance_score: 0.95
    };

    const toolMsg2 = MessageBuilder.toolWithArtifact(
      "The theory of relativity was developed by Einstein in 1905...",
      "call_456",
      "search_documents",
      artifact
    );

    console.log("\n📦 Tool message with artifact:");
    console.log(`  Content: ${MessageParser.extractText(toolMsg2).slice(0, 60)}...`);
    console.log(`  Artifact:`, (toolMsg2 as any).artifact);

    // Complete tool calling flow
    const messages = [
      MessageBuilder.human("What's the weather in Paris?"),
      // AI would respond with tool call
      MessageBuilder.tool(
        JSON.stringify({ temp: 18, condition: "Cloudy" }),
        "call_789",
        "get_weather"
      )
    ];

    console.log("\n🔄 Tool calling flow:");
    messages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. [${MessageParser.getMessageType(msg).toUpperCase()}]: ${MessageParser.extractText(msg)}`);
    });

  } catch (error) {
    console.error("❌ Tool messages demo failed:", error);
  }
}

/**
 * Demonstrate token usage and cost calculation
 */
export async function demonstrateTokenUsage(): Promise<void> {
  console.log("\n💰 Token Usage & Cost Demo");
  console.log("=".repeat(50));

  try {
    // Create a conversation
    const messages = MessageService.createConversation(
      [
        { user: "Explain quantum computing", assistant: "Quantum computing uses quantum bits..." },
        { user: "What are its applications?", assistant: "Applications include cryptography, drug discovery..." }
      ],
      "You are a quantum computing expert."
    );

    // Estimate tokens
    const estimatedTokens = MessageService.estimateTokens(messages);
    console.log(`\n📊 Estimated tokens: ${estimatedTokens}`);

    // Calculate cost for different models
    const models = ["gpt-4o-mini", "gpt-4o", "claude-3-sonnet"];

    console.log("\n💵 Cost estimates by model:");
    models.forEach((model) => {
      // Assuming rough 50/50 split for input/output
      const inputTokens = Math.floor(estimatedTokens * 0.6);
      const outputTokens = Math.floor(estimatedTokens * 0.4);

      const cost = calculateCost(inputTokens, outputTokens, model);
      console.log(`\n  ${model}:`);
      console.log(`    Input: ${inputTokens} tokens → $${cost.inputCost.toFixed(6)}`);
      console.log(`    Output: ${outputTokens} tokens → $${cost.outputCost.toFixed(6)}`);
      console.log(`    Total: $${cost.totalCost.toFixed(6)}`);
    });

    // Show token usage from metadata (simulated)
    console.log("\n📈 Usage metadata structure:");
    const usageExample = {
      input_tokens: 150,
      output_tokens: 300,
      total_tokens: 450,
      input_token_details: {
        cache_read: 50
      },
      output_token_details: {
        reasoning: 100
      }
    };
    console.log(JSON.stringify(usageExample, null, 2));

  } catch (error) {
    console.error("❌ Token usage demo failed:", error);
  }
}

/**
 * Demonstrate message validation
 */
export async function demonstrateMessageValidation(): Promise<void> {
  console.log("\n✅ Message Validation Demo");
  console.log("=".repeat(50));

  try {
    // Valid conversation
    const validMessages = MessageBuilder.conversation([
      { role: "system", content: "You are helpful" },
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" }
    ]);

    console.log("\n✅ Valid conversation:");
    const errors1 = MessageService.validateSequence(validMessages);
    console.log(`  Errors: ${errors1.length === 0 ? 'None' : errors1.join(', ')}`);

    // Invalid: system message in middle
    const invalidMessages1 = [
      MessageBuilder.human("Hello"),
      MessageBuilder.system("You are helpful"), // System should be first
      MessageBuilder.ai("Hi")
    ];

    console.log("\n❌ Invalid: System message in middle:");
    const errors2 = MessageService.validateSequence(invalidMessages1);
    console.log(`  Errors: ${errors2.join(', ')}`);

    // Check message stats
    const stats = MessageService.getConversationStats(validMessages);
    console.log("\n📊 Conversation stats:");
    console.log(`  Total: ${stats.totalMessages}`);
    console.log(`  By type:`, stats.byType);

  } catch (error) {
    console.error("❌ Message validation demo failed:", error);
  }
}

/**
 * Demonstrate message transformations
 */
export async function demonstrateMessageTransformations(): Promise<void> {
  console.log("\n🔄 Message Transformations Demo");
  console.log("=".repeat(50));

  try {
    // Create conversation
    const messages = MessageBuilder.conversation([
      { role: "system", content: "You are helpful" },
      { role: "user", content: "First question" },
      { role: "assistant", content: "First answer" },
      { role: "user", content: "Second question" },
      { role: "assistant", content: "Second answer" },
      { role: "user", content: "Third question" },
      { role: "assistant", content: "Third answer" }
    ]);

    console.log(`\n📝 Original: ${messages.length} messages`);

    // Get recent context (last 2 exchanges)
    const recentContext = MessageService.getRecentContext(messages, 2);
    console.log(`\n🔙 Recent context: ${recentContext.length} messages`);

    // Truncate to token limit
    const truncated = MessageService.truncateToTokenLimit(messages, 100);
    console.log(`\n✂️  Truncated to 100 tokens: ${truncated.length} messages`);

    // Convert to chat format
    const chatFormat = MessageService.toChatFormat(messages);
    console.log("\n💬 Chat format (first 2):");
    console.log(JSON.stringify(chatFormat.slice(0, 2), null, 2));

    // Extract all text
    const allText = MessageService.extractAllText(messages);
    console.log(`\n📄 Total text length: ${allText.length} characters`);

    // Merge consecutive messages (simulate)
    const withDuplicates = [
      MessageBuilder.human("Hello"),
      MessageBuilder.human("How are you?"),
      MessageBuilder.ai("I'm good"),
      MessageBuilder.ai("Thanks for asking")
    ];

    console.log(`\n🔀 Before merge: ${withDuplicates.length} messages`);
    const merged = MessageService.mergeConsecutive(withDuplicates);
    console.log(`   After merge: ${merged.length} messages`);

  } catch (error) {
    console.error("❌ Message transformations demo failed:", error);
  }
}

/**
 * Demonstrate content block extraction
 */
export async function demonstrateContentBlocks(): Promise<void> {
  console.log("\n🧩 Content Blocks Demo");
  console.log("=".repeat(50));

  try {
    // Create multimodal message
    const multiMsg = new MultimodalMessageBuilder()
      .addText("Here are the results:")
      .addImageUrl("https://example.com/chart.png")
      .addText("Additional context:")
      .addPDF("https://example.com/report.pdf")
      .build();

    console.log("\n📦 Content blocks:");
    const blocks = MessageParser.extractContentBlocks(multiMsg);
    blocks.forEach((block, idx) => {
      console.log(`  ${idx + 1}. Type: ${block.type}`);
      if (block.type === "text") {
        console.log(`     Text: ${block.text}`);
      } else if (block.type === "image") {
        console.log(`     URL: ${block.url}`);
      } else if (block.type === "file") {
        console.log(`     URL: ${block.url}`);
      }
    });

    // Check for specific content types
    console.log("\n🔍 Content analysis:");
    console.log(`  Is multimodal: ${MessageParser.isMultimodal(multiMsg)}`);
    console.log(`  Has tool calls: ${MessageParser.hasToolCalls(multiMsg)}`);

  } catch (error) {
    console.error("❌ Content blocks demo failed:", error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log("🚀 Messages Lesson Examples");
  console.log("=".repeat(60));

  const examples = [
    demonstrateBasicMessages,
    demonstrateConversation,
    demonstrateMultimodal,
    demonstrateMessageParsing,
    demonstrateConversationHistory,
    demonstrateToolMessages,
    demonstrateTokenUsage,
    demonstrateMessageValidation,
    demonstrateMessageTransformations,
    demonstrateContentBlocks
  ];

  for (const example of examples) {
    try {
      await example();
      console.log("\n" + "─".repeat(60));
    } catch (error) {
      console.error("Example failed:", error);
      console.log("\n" + "─".repeat(60));
    }
  }

  console.log("\n✅ All examples completed!");
}

// Run all examples if executed directly
if (import.meta.main) {
  runAllExamples().catch(console.error);
}
