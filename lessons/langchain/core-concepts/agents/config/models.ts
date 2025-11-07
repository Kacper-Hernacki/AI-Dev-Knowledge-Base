import { ChatOpenAI } from "@langchain/openai";
import { ENV, validateEnv } from "./env.js";
import { AGENT_CONFIG } from "./constants.js";

// Validate environment on module load
validateEnv();

const basicModel = new ChatOpenAI({
  model: AGENT_CONFIG.models.base,
  apiKey: ENV.OPENAI_API_KEY,
});

const advancedModel = new ChatOpenAI({
  model: AGENT_CONFIG.models.advanced,
  apiKey: ENV.OPENAI_API_KEY,
});

export { basicModel, advancedModel };
