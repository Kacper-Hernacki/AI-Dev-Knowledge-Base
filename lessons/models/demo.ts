#!/usr/bin/env bun
/**
 * Demo script for models lesson
 * Showcases various model capabilities and features
 * Usage: bun run models:demo
 */

import { 
  ModelFactory, 
  ModelService,
  MODEL_CONFIG,
  Logger,
  runAllExamples
} from "./index.js";

async function main() {
  console.log("🤖 Models Lesson Demo");
  console.log("=".repeat(60));
  
  try {
    // Demo 1: Basic Model Creation
    console.log("\n1️⃣  Basic Model Creation");
    console.log("-".repeat(40));
    
    const model = await ModelFactory.createModel({
      provider: MODEL_CONFIG.providers.OPENAI,
      model: MODEL_CONFIG.models.openai.gpt4Mini,
      parameters: { temperature: MODEL_CONFIG.parameters.temperature.balanced },
      validateConfig: true
    });
    
    console.log("✅ Model created successfully");
    console.log(`🏭 Factory pattern: ${model.constructor.name}`);

    // Demo 2: Service Layer
    console.log("\n2️⃣  Service Layer Demo");
    console.log("-".repeat(40));
    
    const service = new ModelService(model);
    const quickResponse = await service.generateText("What is LangChain in one sentence?");
    console.log("✅ Service layer operational");
    console.log(`📝 Quick response: ${quickResponse.slice(0, 100)}...`);

    // Demo 3: Model Metadata
    console.log("\n3️⃣  Model with Metadata");
    console.log("-".repeat(40));
    
    const modelWithMetadata = await ModelFactory.createModelWithMetadata({
      model: MODEL_CONFIG.models.openai.gpt4Mini,
      parameters: { temperature: 0.1 },
      validateConfig: false // Skip validation to show structure
    });
    
    console.log("✅ Model with metadata created");
    console.log(`🏷️  Provider: ${modelWithMetadata.provider}`);
    console.log(`🔧 Model Name: ${modelWithMetadata.modelName}`);
    console.log(`⚡ Capabilities: ${modelWithMetadata.capabilities.join(", ")}`);

    // Demo 4: Structured Output
    console.log("\n4️⃣  Structured Output Demo");
    console.log("-".repeat(40));
    
    try {
      const movieInfo = await service.generateMovieInfo("Inception");
      console.log("✅ Structured output generated:");
      console.log(`🎬 Title: ${movieInfo.title}`);
      console.log(`📅 Year: ${movieInfo.year}`);
      console.log(`🎭 Director: ${movieInfo.director}`);
      console.log(`⭐ Rating: ${movieInfo.rating}/10`);
    } catch (error) {
      console.log("⚠️  Structured output requires OpenAI API key");
    }

    // Demo 5: Performance Monitoring
    console.log("\n5️⃣  Performance Monitoring");
    console.log("-".repeat(40));
    
    const performanceSummary = Logger.getPerformanceSummary();
    console.log("📊 Performance Summary:");
    console.log(`   Operations: ${performanceSummary.totalOperations}`);
    console.log(`   Avg Latency: ${performanceSummary.averageLatency}ms`);
    console.log(`   Errors: ${performanceSummary.errors}`);
    console.log(`   Warnings: ${performanceSummary.warnings}`);

    // Demo 6: Available Features
    console.log("\n6️⃣  Available Features");
    console.log("-".repeat(40));
    
    console.log("🔧 Model Features:");
    Object.entries(MODEL_CONFIG.features).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });

    console.log("\n🏭 Model Providers:");
    Object.entries(MODEL_CONFIG.providers).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });

    // Demo 7: Configuration Options
    console.log("\n7️⃣  Configuration Options");
    console.log("-".repeat(40));
    
    console.log("🌡️  Temperature Presets:");
    Object.entries(MODEL_CONFIG.parameters.temperature).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });

    console.log("\n📏 Token Limits:");
    Object.entries(MODEL_CONFIG.parameters.maxTokens).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Demo completed successfully!");
    
    console.log("\n💡 Next Steps:");
    console.log("• Run 'bun run models:examples' for detailed examples");
    console.log("• Run 'bun run models:test' to run the test suite");
    console.log("• Check the source code in lessons/models/ for implementation details");
    
    console.log("\n📚 Architecture Benefits:");
    console.log("• Clean separation of concerns");
    console.log("• Type-safe configuration");
    console.log("• Comprehensive error handling");
    console.log("• Performance monitoring");
    console.log("• Multiple model provider support");
    console.log("• Structured output validation");

  } catch (error) {
    Logger.error("Demo failed", error);
    console.error("❌ Demo failed:", error);
    
    if (error instanceof Error && error.message.includes("API key")) {
      console.log("\n💡 Tip: Set your API keys in .env file:");
      console.log("   OPENAI_API_KEY=your_key_here");
      console.log("   ANTHROPIC_API_KEY=your_key_here");
      console.log("   GOOGLE_API_KEY=your_key_here");
    }
    
    process.exit(1);
  }
}

// Additional demo function for comprehensive examples
async function runComprehensiveDemo() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Running Comprehensive Examples...");
  console.log("=".repeat(60));
  
  try {
    await runAllExamples();
  } catch (error) {
    console.error("❌ Comprehensive examples failed:", error);
  }
}

// Run demo if executed directly
if (import.meta.main) {
  main()
    .then(() => {
      // Uncomment the line below to run comprehensive examples
      // return runComprehensiveDemo();
    })
    .catch(console.error);
}