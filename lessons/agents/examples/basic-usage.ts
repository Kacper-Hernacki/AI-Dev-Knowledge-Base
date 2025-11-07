import { AgentFactory } from "../core/agent-factory.js";
import { AgentService } from "../core/agent-service.js";
import { USER_ROLES } from "../config/constants.js";
import { Logger } from "../utils/logger.js";

export async function basicUsageExample() {
  Logger.info("Starting basic usage example");
  
  // Create agent and service
  const agent = AgentFactory.createArticleAgent();
  const service = new AgentService(agent);
  
  const prompt = "Write a short article about the benefits of machine learning";
  
  try {
    // Generate article for beginner
    const beginnerResponse = await service.generateArticle(prompt, USER_ROLES.BEGINNER);
    Logger.agentResponse("beginner", beginnerResponse);
    console.log("Beginner Response:", beginnerResponse.structuredResponse);
    
    return beginnerResponse;
  } catch (error) {
    Logger.error("Failed to generate article", { error, prompt });
    throw error;
  }
}

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  basicUsageExample().catch(console.error);
}