import { AgentFactory } from "../core/agent-factory.js";
import { AgentService } from "../core/agent-service.js";
import { Logger } from "../utils/logger.js";

export async function demonstrateRoleComparison() {
  Logger.info("Starting role comparison demonstration");
  
  const agent = AgentFactory.createArticleAgent();
  const service = new AgentService(agent);
  
  const prompt = "Write a short article about the benefits of machine learning";
  
  try {
    const { beginner, expert } = await service.compareRoleResponses(prompt);
    
    Logger.agentResponse("beginner", beginner);
    Logger.agentResponse("expert", expert);
    
    console.log("=== BEGINNER RESPONSE ===");
    console.log(JSON.stringify(beginner.structuredResponse, null, 2));
    
    console.log("\n=== EXPERT RESPONSE ===");
    console.log(JSON.stringify(expert.structuredResponse, null, 2));
    
    return { beginner, expert };
  } catch (error) {
    Logger.error("Failed to demonstrate role comparison", { error, prompt });
    throw error;
  }
}

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateRoleComparison().catch(console.error);
}