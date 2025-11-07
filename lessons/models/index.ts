/**
 * Models Lesson - Main Export File
 * 
 * This module provides a comprehensive implementation of LangChain models
 * following clean architecture principles and enterprise patterns.
 * 
 * Features:
 * - Multiple model provider support (OpenAI, Anthropic, Google, Azure, Bedrock)
 * - Factory pattern for model creation
 * - Service layer for high-level operations
 * - Type-safe configuration management
 * - Structured output validation
 * - Performance monitoring and logging
 * - Comprehensive error handling
 * - Streaming support
 * - Batch processing capabilities
 * 
 * Usage:
 * ```typescript
 * import { ModelFactory, ModelService, MODEL_CONFIG } from './index.js';
 * 
 * // Create a model
 * const model = await ModelFactory.createModel({
 *   provider: MODEL_CONFIG.providers.OPENAI,
 *   model: MODEL_CONFIG.models.openai.gpt4Mini,
 *   parameters: { temperature: 0.7 }
 * });
 * 
 * // Use the service layer
 * const service = new ModelService(model);
 * const response = await service.generateText("Hello, world!");
 * ```
 */

// Core exports
export * from "./core/index.js";
export * from "./config/index.js";
export * from "./utils/index.js";

// Examples
export * from "./examples/index.js";

// Re-export key components for convenience
export { ModelFactory, ModelService } from "./core/index.js";
export { 
  MODEL_CONFIG, 
  MODEL_CAPABILITIES,
  validateEnv,
  isProviderConfigured,
  getAvailableProviders,
  movieSchema,
  articleSchema,
  classificationSchema
} from "./config/index.js";
export { Logger, ResponseParser } from "./utils/index.js";