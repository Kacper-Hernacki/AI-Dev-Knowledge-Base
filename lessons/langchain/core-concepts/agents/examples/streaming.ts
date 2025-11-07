import { AgentFactory } from "../core/agent-factory.js";
import { AgentService } from "../core/agent-service.js";
import { USER_ROLES } from "../config/constants.js";
import { Logger } from "../utils/logger.js";

export async function streamingExample() {
  Logger.info("Starting streaming example");
  
  const agent = AgentFactory.createArticleAgent();
  const service = new AgentService(agent);
  
  const prompt = "Search for AI news and summarize the findings";
  
  try {
    const stream = service.streamResponse(prompt, {
      userRole: USER_ROLES.BEGINNER,
      streamMode: "values"
    });
    
    console.log("Streaming response...\n");
    
    for await (const chunk of stream) {
      if (chunk.type === 'content' && chunk.content) {
        console.log(`Agent: ${chunk.content}`);
        Logger.streamChunk(chunk.content);
      } else if (chunk.type === 'tool_call' && chunk.toolCalls) {
        console.log(`Calling tools: ${chunk.toolCalls.join(", ")}`);
        Logger.toolCall(chunk.toolCalls);
      }
    }
    
    Logger.info("Streaming completed successfully");
  } catch (error) {
    Logger.error("Failed during streaming", { error, prompt });
    throw error;
  }
}

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  streamingExample().catch(console.error);
}