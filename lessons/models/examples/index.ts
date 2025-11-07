/**
 * Examples for models lesson
 * Demonstrates various model capabilities and use cases
 */

import { ModelFactory, ModelService } from "../core/index.js";
import { MODEL_CONFIG } from "../config/index.js";
import { Logger } from "../utils/logger.js";

/**
 * Demonstrate basic text generation
 */
export async function demonstrateTextGeneration(): Promise<void> {
  console.log("\n🔤 Text Generation Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      provider: MODEL_CONFIG.providers.OPENAI,
      model: MODEL_CONFIG.models.openai.gpt4Mini,
      parameters: { temperature: MODEL_CONFIG.parameters.temperature.balanced }
    });

    const service = new ModelService(model);

    const prompt = "Explain machine learning in simple terms";
    console.log(`\n📝 Prompt: ${prompt}`);
    
    const response = await service.generateText(prompt);
    console.log(`\n🤖 Response: ${response.slice(0, 200)}...`);

  } catch (error) {
    console.error("❌ Text generation demo failed:", error);
  }
}

/**
 * Demonstrate streaming text generation
 */
export async function demonstrateStreaming(): Promise<void> {
  console.log("\n📡 Streaming Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    const service = new ModelService(model);

    const prompt = "Write a short story about a robot learning to paint";
    console.log(`\n📝 Prompt: ${prompt}`);
    console.log("\n🤖 Streaming response:");

    let tokenCount = 0;
    await service.streamText(prompt, {
      onToken: (token) => {
        process.stdout.write(token);
        tokenCount++;
      },
      onComplete: () => {
        console.log(`\n\n✅ Streaming completed (${tokenCount} tokens)`);
      }
    });

  } catch (error) {
    console.error("❌ Streaming demo failed:", error);
  }
}

/**
 * Demonstrate structured output
 */
export async function demonstrateStructuredOutput(): Promise<void> {
  console.log("\n🏗️  Structured Output Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    const service = new ModelService(model);

    // Movie information extraction
    console.log("\n🎬 Extracting movie information:");
    const movieInfo = await service.generateMovieInfo("The Matrix");
    console.log(JSON.stringify(movieInfo, null, 2));

    // Text classification
    console.log("\n🏷️  Text classification:");
    const classification = await service.classifyText(
      "The new AI model shows impressive performance on natural language tasks",
      ["Technology", "Entertainment", "Sports", "Politics"]
    );
    console.log(JSON.stringify(classification, null, 2));

  } catch (error) {
    console.error("❌ Structured output demo failed:", error);
  }
}

/**
 * Demonstrate batch processing
 */
export async function demonstrateBatchProcessing(): Promise<void> {
  console.log("\n📦 Batch Processing Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    const service = new ModelService(model);

    const prompts = [
      "What is TypeScript?",
      "What is Python?", 
      "What is JavaScript?",
      "What is Rust?",
      "What is Go?"
    ];

    console.log(`\n📝 Processing ${prompts.length} prompts in batch...`);
    
    const startTime = Date.now();
    const responses = await service.batchGenerate(prompts, 3); // Max 3 concurrent
    const duration = Date.now() - startTime;

    console.log(`\n⏱️  Completed in ${duration}ms (${Math.round(duration / prompts.length)}ms per prompt)`);
    
    responses.forEach((response, index) => {
      console.log(`\n${index + 1}. ${prompts[index]}`);
      console.log(`   ${response.slice(0, 100)}...`);
    });

  } catch (error) {
    console.error("❌ Batch processing demo failed:", error);
  }
}

/**
 * Demonstrate conversation handling
 */
export async function demonstrateConversation(): Promise<void> {
  console.log("\n💬 Conversation Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    const service = new ModelService(model);

    // Start conversation  
    let messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system" as const, content: "You are a helpful coding assistant." },
      { role: "user" as const, content: "I want to learn about functions in JavaScript" }
    ];

    console.log("\n👤 User: I want to learn about functions in JavaScript");
    
    const response1 = await service.continueConversation(messages, messages[1].content);
    console.log(`\n🤖 Assistant: ${response1.slice(0, 200)}...`);

    // Continue conversation
    messages.push(
      { role: "assistant" as const, content: response1 },
      { role: "user" as const, content: "Can you show me an example?" }
    );

    console.log("\n👤 User: Can you show me an example?");
    
    const response2 = await service.continueConversation(
      messages.slice(0, -1), // Don't include the latest user message
      "Can you show me an example?"
    );
    console.log(`\n🤖 Assistant: ${response2.slice(0, 200)}...`);

  } catch (error) {
    console.error("❌ Conversation demo failed:", error);
  }
}

/**
 * Demonstrate model comparison
 */
export async function demonstrateModelComparison(): Promise<void> {
  console.log("\n⚖️  Model Comparison Demo");
  console.log("=".repeat(50));

  try {
    // Create multiple models for comparison
    const models = await ModelFactory.createMultipleModels([
      { 
        model: MODEL_CONFIG.models.openai.gpt4Mini,
        parameters: { temperature: 0.1 }
      },
      { 
        model: MODEL_CONFIG.models.openai.gpt4Mini,
        parameters: { temperature: 0.9 }
      }
    ]);

    if (models.length < 2) {
      console.log("⚠️  Need at least 2 models for comparison");
      return;
    }

    const modelsWithNames = [
      { name: "GPT-4-mini (Creative)", model: models[1] },
      { name: "GPT-4-mini (Deterministic)", model: models[0] }
    ];

    const prompt = "Write a creative opening line for a science fiction novel";
    console.log(`\n📝 Prompt: ${prompt}`);

    const comparison = await ModelService.compareModels(modelsWithNames, prompt);
    
    comparison.responses.forEach(({ modelName, response, metadata }) => {
      console.log(`\n🤖 ${modelName}:`);
      console.log(`   ${response.slice(0, 150)}...`);
      console.log(`   ⏱️  Latency: ${metadata?.latency}ms`);
    });

  } catch (error) {
    console.error("❌ Model comparison demo failed:", error);
  }
}

/**
 * Demonstrate performance monitoring
 */
export async function demonstratePerformanceMonitoring(): Promise<void> {
  console.log("\n📊 Performance Monitoring Demo");
  console.log("=".repeat(50));

  try {
    // Clear previous logs
    Logger.clearHistory();

    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    const service = new ModelService(model);

    // Perform various operations
    await service.generateText("Quick test 1");
    await service.generateText("Quick test 2");
    await service.classifyText("This is a technology article", ["Tech", "Sports"]);
    
    // Get performance summary
    const summary = Logger.getPerformanceSummary();
    console.log("\n📈 Performance Summary:");
    console.log(JSON.stringify(summary, null, 2));

    // Show recent logs
    const recentLogs = Logger.getHistory().slice(-5);
    console.log("\n📋 Recent Logs:");
    recentLogs.forEach((log: any) => {
      console.log(`${log.level.toUpperCase()}: ${log.message}`);
    });

  } catch (error) {
    console.error("❌ Performance monitoring demo failed:", error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log("🚀 Models Lesson Examples");
  console.log("=".repeat(60));

  const examples = [
    demonstrateTextGeneration,
    demonstrateStreaming,
    demonstrateStructuredOutput,
    demonstrateBatchProcessing,
    demonstrateConversation,
    demonstrateModelComparison,
    demonstratePerformanceMonitoring
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