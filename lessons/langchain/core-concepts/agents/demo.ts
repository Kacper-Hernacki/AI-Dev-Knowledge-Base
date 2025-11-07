#!/usr/bin/env bun
/**
 * Demo script showcasing the refactored agent structure
 * Usage: bun run lessons/agents/demo.ts
 */

import { 
  AgentFactory, 
  AgentService, 
  USER_ROLES,
  Logger,
  demonstrateRoleComparison
} from "./index.js";

async function main() {
  console.log("🚀 Agent Architecture Demo");
  console.log("=" .repeat(50));
  
  try {
    // Demo 1: Basic Factory Pattern
    console.log("\n1️⃣  Factory Pattern Demo");
    const basicAgent = AgentFactory.createArticleAgent();
    const advancedAgent = AgentFactory.createAdvancedAgent();
    console.log("✅ Created basic and advanced agents");
    console.log(`🤖 Advanced agent configured with: ${advancedAgent ? 'success' : 'error'}`);

    // Demo 2: Service Pattern
    console.log("\n2️⃣  Service Pattern Demo"); 
    const service = new AgentService(basicAgent);
    const response = await service.generateArticle(
      "Explain dependency injection in 2 sentences", 
      USER_ROLES.EXPERT
    );
    console.log("✅ Generated article:", response.structuredResponse.title);

    // Demo 3: Role Comparison
    console.log("\n3️⃣  Role Comparison Demo");
    const comparison = await demonstrateRoleComparison();
    console.log("✅ Compared beginner vs expert responses");
    console.log(`📊 Articles generated: ${Object.keys(comparison).length}`);

    // Demo 4: Streaming Demo with Deep Research
    console.log("\n4️⃣  Streaming Demo with Deep Research");
    console.log("Streaming comprehensive analysis...");
    let chunkCount = 0;
    for await (const chunk of service.streamResponse("Conduct deep research on modern AI applications", {
      userRole: USER_ROLES.BEGINNER
    })) {
      chunkCount++;
      if (chunk.type === 'content' && chunk.content) {
        console.log(`Chunk ${chunkCount}: ${chunk.content.slice(0, 150)}...`);
        break; // Just show first chunk for demo
      } else if (chunk.type === 'tool_call' && chunk.toolCalls) {
        console.log(`🔧 Tools called: ${chunk.toolCalls.join(", ")}`);
      }
    }
    console.log("✅ Streaming completed");

    console.log("\n🎉 All demos completed successfully!");
    console.log("\nRefactored structure benefits:");
    console.log("• Clean separation of concerns");
    console.log("• Type-safe configuration");
    console.log("• Testable components");
    console.log("• Reusable services");
    console.log("• Professional error handling");

  } catch (error) {
    Logger.error("Demo failed", error);
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run demo if executed directly
if (import.meta.main) {
  main().catch(console.error);
}