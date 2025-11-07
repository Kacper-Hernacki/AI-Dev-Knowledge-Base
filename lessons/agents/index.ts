// Main exports for the agents module
export { AgentFactory } from './core/agent-factory.js';
export { AgentService } from './core/agent-service.js';

// Configuration exports
export { articleSchema, agentStateSchema } from './config/schemas.js';
export { AGENT_CONFIG, USER_ROLES } from './config/constants.js';
export { validateEnv, isProduction, isDevelopment } from './config/env.js';

// Core types exports
export type {
  AgentOptions,
  StreamOptions,
  ParsedResponse,
  ChunkData,
  UserRole,
  ArticleFormat,
  AgentState
} from './core/types.js';

// Utility exports
export { ResponseParser } from './utils/response-parser.js';
export { Logger } from './utils/logger.js';

// Legacy exports for backward compatibility
export { search, getWeather } from './core/tools/index.js';
export {
  dynamicModelSelection,
  handleToolErrors,
  dynamicSystemPrompt,
  contextSchema,
} from './core/middlewares/index.js';
export { basicModel, advancedModel } from './config/models.js';

// Example exports
export * from './examples/index.js';