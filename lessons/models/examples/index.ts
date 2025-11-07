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
 * Demonstrate multimodal capabilities (image processing)
 */
export async function demonstrateMultimodal(): Promise<void> {
  console.log("\n🖼️  Multimodal Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    console.log("\n📸 Processing image with text prompt:");

    // Example with image URL
    const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/481px-Cat03.jpg";

    const response = await model.invoke([
      {
        role: "user",
        content: [
          { type: "text", text: "Describe what you see in this image in detail." },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]);

    console.log(`\n🤖 Response: ${response.content.toString().slice(0, 300)}...`);

    // Check if response contains multiple content blocks
    if (response.content && typeof response.content === 'object') {
      console.log("\n📦 Response content blocks:");
      console.log(JSON.stringify(response.content, null, 2).slice(0, 200));
    }

  } catch (error) {
    console.error("❌ Multimodal demo failed:", error);
    console.log("ℹ️  Note: Multimodal features require a model that supports vision (e.g., gpt-4o, gpt-4-vision)");
  }
}

/**
 * Demonstrate reasoning capabilities
 */
export async function demonstrateReasoning(): Promise<void> {
  console.log("\n🧠 Reasoning Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    const complexQuestion = "If a train leaves Station A at 2 PM traveling at 60 mph, and another train leaves Station B (180 miles away) at 2:30 PM traveling at 90 mph toward Station A, when and where will they meet?";

    console.log(`\n📝 Complex question: ${complexQuestion}`);
    console.log("\n🔄 Streaming reasoning process:");

    const stream = await model.stream(complexQuestion);

    let fullResponse = "";
    for await (const chunk of stream) {
      if (chunk.content) {
        const content = chunk.content.toString();
        fullResponse += content;
        process.stdout.write(content);
      }
    }

    console.log("\n\n✅ Reasoning completed");
    console.log(`📊 Response length: ${fullResponse.length} characters`);

  } catch (error) {
    console.error("❌ Reasoning demo failed:", error);
  }
}

/**
 * Demonstrate local model usage with Ollama
 */
export async function demonstrateLocalModels(): Promise<void> {
  console.log("\n💻 Local Models Demo (Ollama)");
  console.log("=".repeat(50));

  try {
    // Note: This requires Ollama to be installed and running locally
    // Installation: https://ollama.ai

    console.log("\nℹ️  This demo requires Ollama to be installed and running");
    console.log("📥 Install from: https://ollama.ai");
    console.log("🚀 Run: ollama run llama2");

    // Example code (commented out to avoid runtime errors if Ollama is not installed)
    /*
    const { ChatOllama } = await import("@langchain/community/chat_models/ollama");

    const localModel = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama2",
    });

    const response = await localModel.invoke("Why is the sky blue? Answer in one sentence.");
    console.log(`\n🤖 Local model response: ${response.content}`);
    */

    console.log("\n💡 Example usage:");
    console.log(`
    import { ChatOllama } from "@langchain/community/chat_models/ollama";

    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama2",
    });

    const response = await model.invoke("Your question here");
    `);

  } catch (error) {
    console.error("❌ Local models demo failed:", error);
  }
}

/**
 * Demonstrate prompt caching
 */
export async function demonstratePromptCaching(): Promise<void> {
  console.log("\n💾 Prompt Caching Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    // Create a long system context that we want to cache
    const longContext = `
You are an expert software engineer with deep knowledge of:
${Array.from({ length: 20 }, (_, i) => `- Technology ${i + 1}: Description and use cases`).join('\n')}

Please provide detailed, technical responses based on this knowledge.
    `.trim();

    console.log("\n🔄 First request (populates cache):");
    const start1 = Date.now();
    const response1 = await model.invoke([
      { role: "system", content: longContext },
      { role: "user", content: "What is TypeScript?" }
    ]);
    const time1 = Date.now() - start1;
    console.log(`⏱️  Time: ${time1}ms`);
    console.log(`📝 Response: ${response1.content.toString().slice(0, 150)}...`);

    console.log("\n🔄 Second request (should use cache):");
    const start2 = Date.now();
    const response2 = await model.invoke([
      { role: "system", content: longContext },
      { role: "user", content: "What is Python?" }
    ]);
    const time2 = Date.now() - start2;
    console.log(`⏱️  Time: ${time2}ms`);
    console.log(`📝 Response: ${response2.content.toString().slice(0, 150)}...`);

    console.log(`\n📊 Performance improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    console.log("ℹ️  Note: OpenAI and Gemini provide implicit prompt caching");

  } catch (error) {
    console.error("❌ Prompt caching demo failed:", error);
  }
}

/**
 * Demonstrate server-side tool use
 */
export async function demonstrateServerSideTools(): Promise<void> {
  console.log("\n🛠️  Server-Side Tool Use Demo");
  console.log("=".repeat(50));

  try {
    console.log("\nℹ️  Server-side tool calling allows models to use built-in tools");
    console.log("   (like web search, code interpreters) in a single turn");

    // Note: This feature is available in models like GPT-4 with specific configurations
    console.log("\n💡 Example usage:");
    console.log(`
    import { initChatModel } from "langchain";

    const model = await initChatModel("gpt-4.1-mini");
    const modelWithTools = model.bindTools([{ type: "web_search" }]);

    const message = await modelWithTools.invoke(
      "What was a positive news story from today?"
    );

    console.log(message.contentBlocks);
    // Shows tool calls and results in the response
    `);

    console.log("\n📋 Benefits:");
    console.log("  • Single conversational turn (no tool execution loop needed)");
    console.log("  • Built-in tools like web search, code execution");
    console.log("  • Results automatically included in response");

  } catch (error) {
    console.error("❌ Server-side tools demo failed:", error);
  }
}

/**
 * Demonstrate log probabilities
 */
export async function demonstrateLogProbabilities(): Promise<void> {
  console.log("\n📈 Log Probabilities Demo");
  console.log("=".repeat(50));

  try {
    const { ChatOpenAI } = await import("@langchain/openai");

    const model = new ChatOpenAI({
      model: "gpt-4o",
      logprobs: true,
      topLogprobs: 3
    });

    console.log("\n📝 Generating response with log probabilities...");
    const response = await model.invoke("The capital of France is");

    console.log(`\n🤖 Response: ${response.content}`);

    // Access log probabilities from response metadata
    if (response.response_metadata?.logprobs) {
      console.log("\n📊 Token probabilities (first 5 tokens):");
      const logprobs = response.response_metadata.logprobs as any;

      if (logprobs.content && Array.isArray(logprobs.content)) {
        logprobs.content.slice(0, 5).forEach((tokenData: any, idx: number) => {
          console.log(`\n  Token ${idx + 1}: "${tokenData.token}"`);
          console.log(`  Log probability: ${tokenData.logprob?.toFixed(4)}`);
          console.log(`  Probability: ${(Math.exp(tokenData.logprob) * 100).toFixed(2)}%`);

          if (tokenData.top_logprobs && tokenData.top_logprobs.length > 0) {
            console.log(`  Top alternatives:`);
            tokenData.top_logprobs.slice(0, 2).forEach((alt: any) => {
              console.log(`    - "${alt.token}": ${(Math.exp(alt.logprob) * 100).toFixed(2)}%`);
            });
          }
        });
      }
    }

    console.log("\n💡 Use cases:");
    console.log("  • Measure model confidence");
    console.log("  • Detect hallucinations");
    console.log("  • Build calibrated systems");

  } catch (error) {
    console.error("❌ Log probabilities demo failed:", error);
    console.log("ℹ️  Note: This feature requires @langchain/openai and a compatible model");
  }
}

/**
 * Demonstrate token usage tracking
 */
export async function demonstrateTokenUsage(): Promise<void> {
  console.log("\n🔢 Token Usage Tracking Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    const prompt = "Explain the concept of recursion in programming with an example.";
    console.log(`\n📝 Prompt: ${prompt}`);

    const response = await model.invoke(prompt);

    console.log(`\n🤖 Response: ${response.content.toString().slice(0, 200)}...`);

    // Access token usage information
    if (response.usage_metadata) {
      console.log("\n📊 Token Usage:");
      console.log(`  • Input tokens: ${response.usage_metadata.input_tokens}`);
      console.log(`  • Output tokens: ${response.usage_metadata.output_tokens}`);
      console.log(`  • Total tokens: ${response.usage_metadata.total_tokens}`);

      // Calculate approximate cost (example pricing for GPT-4o-mini)
      const inputCost = (response.usage_metadata.input_tokens / 1000000) * 0.15; // $0.15 per 1M tokens
      const outputCost = (response.usage_metadata.output_tokens / 1000000) * 0.60; // $0.60 per 1M tokens
      const totalCost = inputCost + outputCost;

      console.log(`\n💰 Estimated Cost (GPT-4o-mini pricing):`);
      console.log(`  • Input: $${inputCost.toFixed(6)}`);
      console.log(`  • Output: $${outputCost.toFixed(6)}`);
      console.log(`  • Total: $${totalCost.toFixed(6)}`);
    } else if (response.response_metadata) {
      console.log("\n📊 Response Metadata:");
      console.log(JSON.stringify(response.response_metadata, null, 2));
    }

  } catch (error) {
    console.error("❌ Token usage demo failed:", error);
  }
}

/**
 * Demonstrate invocation configuration
 */
export async function demonstrateInvocationConfig(): Promise<void> {
  console.log("\n⚙️  Invocation Configuration Demo");
  console.log("=".repeat(50));

  try {
    const model = await ModelFactory.createModel({
      model: MODEL_CONFIG.models.openai.gpt4Mini
    });

    console.log("\n🔧 Using custom configuration:");

    const response = await model.invoke(
      "Tell me a short joke about programming",
      {
        runName: "joke_generation",
        tags: ["humor", "demo", "programming"],
        metadata: {
          user_id: "123",
          session_id: "abc-456",
          environment: "development"
        },
        // Additional config options
        maxConcurrency: 5
      }
    );

    console.log(`\n🤖 Response: ${response.content}`);

    console.log("\n📋 Configuration benefits:");
    console.log("  • runName: Custom identifier for this invocation");
    console.log("  • tags: Categorization for filtering and organization");
    console.log("  • metadata: Custom tracking data");
    console.log("  • callbacks: Event handlers for monitoring");
    console.log("  • maxConcurrency: Control parallel execution in batch()");

    console.log("\n💡 Use cases:");
    console.log("  • Debugging with LangSmith tracing");
    console.log("  • Custom logging and monitoring");
    console.log("  • Resource usage control in production");
    console.log("  • Tracking across complex pipelines");

  } catch (error) {
    console.error("❌ Invocation config demo failed:", error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log("🚀 Models Lesson Examples");
  console.log("=".repeat(60));

  const examples = [
    // Core examples
    demonstrateTextGeneration,
    demonstrateStreaming,
    demonstrateStructuredOutput,
    demonstrateBatchProcessing,
    demonstrateConversation,
    demonstrateModelComparison,
    demonstratePerformanceMonitoring,

    // Advanced examples
    demonstrateMultimodal,
    demonstrateReasoning,
    demonstrateLocalModels,
    demonstratePromptCaching,
    demonstrateServerSideTools,
    demonstrateLogProbabilities,
    demonstrateTokenUsage,
    demonstrateInvocationConfig
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