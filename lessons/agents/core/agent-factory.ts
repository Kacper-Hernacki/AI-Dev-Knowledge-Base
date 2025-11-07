import { createAgent } from "langchain";
import { search, deepResearch } from "./tools/index.js";
import { 
  contextSchema, 
  dynamicModelSelection, 
  dynamicSystemPrompt, 
  handleToolErrors 
} from "./middlewares/index.js";
import { agentStateSchema, articleSchema } from "../config/schemas.js";
import { AGENT_CONFIG } from "../config/constants.js";
import { validateEnv } from "../config/env.js";
import type { AgentOptions } from "./types.js";

export class AgentFactory {
  static createArticleAgent(options: AgentOptions = {}) {
    // Validate environment before creating agent
    validateEnv();
    
    const config = {
      model: options.model || AGENT_CONFIG.models.base,
      tools: options.tools || [search, deepResearch],
      stateSchema: agentStateSchema,
      contextSchema,
      middleware: [handleToolErrors, dynamicSystemPrompt, dynamicModelSelection],
      responseFormat: articleSchema,
    };

    return createAgent(config);
  }

  static createAdvancedAgent(options: AgentOptions = {}) {
    return this.createArticleAgent({
      ...options,
      model: options.model || AGENT_CONFIG.models.advanced,
    });
  }
}