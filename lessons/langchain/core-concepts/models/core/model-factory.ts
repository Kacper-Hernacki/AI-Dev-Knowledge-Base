/**
 * Model Factory for creating and configuring different chat models
 * Implements factory pattern for consistent model instantiation
 */

import { initChatModel } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { 
  MODEL_CONFIG, 
  MODEL_CAPABILITIES,
  ModelProvider, 
  ModelConfig,
  ModelParameters,
  validateEnv,
  isProviderConfigured,
  getProviderEnv
} from "../config/index.js";
import { Logger } from "../utils/logger.js";

export interface ModelFactoryOptions {
  provider?: ModelProvider;
  model?: string;
  parameters?: ModelParameters;
  validateConfig?: boolean;
}

export interface ModelWithMetadata {
  model: BaseChatModel;
  provider: string;
  modelName: string;
  capabilities: string[];
  parameters: ModelParameters;
}

/**
 * Factory class for creating and managing chat models
 */
export class ModelFactory {
  
  /**
   * Create a model using initChatModel (recommended approach)
   */
  static async createModel(options: ModelFactoryOptions = {}): Promise<BaseChatModel> {
    const {
      provider = MODEL_CONFIG.providers.OPENAI,
      model = MODEL_CONFIG.models.openai.gpt4Mini,
      parameters = {},
      validateConfig = true
    } = options;

    if (validateConfig) {
      validateEnv();
      
      if (!isProviderConfigured(provider)) {
        throw new Error(`Provider ${provider} is not configured. Please check your environment variables.`);
      }
    }

    Logger.info("Creating model", {
      provider,
      model,
      parameters,
      timestamp: new Date().toISOString()
    });

    try {
      const chatModel = await initChatModel(model, {
        temperature: parameters.temperature,
        maxTokens: parameters.maxTokens,
        timeout: parameters.timeout,
        maxRetries: parameters.maxRetries,
        topP: parameters.topP,
        frequencyPenalty: parameters.frequencyPenalty,
        presencePenalty: parameters.presencePenalty
      });

      Logger.info("Model created successfully", {
        provider,
        model,
        timestamp: new Date().toISOString()
      });

      return chatModel;
    } catch (error) {
      Logger.error("Failed to create model", {
        provider,
        model,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Create OpenAI model with specific configuration
   */
  static createOpenAIModel(options: {
    model?: string;
    parameters?: ModelParameters;
  } = {}): ChatOpenAI {
    const {
      model = MODEL_CONFIG.models.openai.gpt4Mini,
      parameters = {}
    } = options;

    validateEnv();
    
    if (!isProviderConfigured("openai")) {
      throw new Error("OpenAI provider is not configured. Please set OPENAI_API_KEY.");
    }

    const envConfig = getProviderEnv("openai");

    Logger.info("Creating OpenAI model", {
      model,
      parameters,
      timestamp: new Date().toISOString()
    });

    return new ChatOpenAI({
      model,
      apiKey: envConfig.apiKey,
      temperature: parameters.temperature,
      maxTokens: parameters.maxTokens,
      timeout: parameters.timeout,
      maxRetries: parameters.maxRetries,
      topP: parameters.topP,
      frequencyPenalty: parameters.frequencyPenalty,
      presencePenalty: parameters.presencePenalty
    });
  }

  /**
   * Create model with enhanced metadata
   */
  static async createModelWithMetadata(options: ModelFactoryOptions = {}): Promise<ModelWithMetadata> {
    const {
      provider = MODEL_CONFIG.providers.OPENAI,
      model = MODEL_CONFIG.models.openai.gpt4Mini,
      parameters = {}
    } = options;

    const chatModel = await this.createModel(options);
    
    // Get model capabilities from config
    const capabilities = MODEL_CAPABILITIES[model as keyof typeof MODEL_CAPABILITIES] || [];

    return {
      model: chatModel,
      provider,
      modelName: model,
      capabilities,
      parameters
    };
  }

  /**
   * Create models for comparison testing
   */
  static async createModelsForComparison(modelConfigs: ModelConfig[]): Promise<ModelWithMetadata[]> {
    Logger.info("Creating models for comparison", {
      count: modelConfigs.length,
      models: modelConfigs.map(c => ({ provider: c.provider, model: c.model })),
      timestamp: new Date().toISOString()
    });

    const models: ModelWithMetadata[] = [];
    
    for (const config of modelConfigs) {
      try {
        const modelWithMetadata = await this.createModelWithMetadata({
          provider: config.provider,
          model: config.model,
          parameters: config.parameters
        });
        models.push(modelWithMetadata);
      } catch (error) {
        Logger.warn("Failed to create model for comparison", {
          config,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        // Continue with other models
      }
    }

    if (models.length === 0) {
      throw new Error("No models could be created for comparison");
    }

    Logger.info("Models created for comparison", {
      successful: models.length,
      failed: modelConfigs.length - models.length,
      timestamp: new Date().toISOString()
    });

    return models;
  }

  /**
   * Get default model for specific use case
   */
  static async createDefaultModel(useCase: string): Promise<BaseChatModel> {
    let config: ModelFactoryOptions;

    switch (useCase.toLowerCase()) {
      case "reasoning":
        config = {
          provider: MODEL_CONFIG.providers.ANTHROPIC,
          model: MODEL_CONFIG.models.anthropic.claudeSonnet,
          parameters: { temperature: MODEL_CONFIG.parameters.temperature.deterministic }
        };
        break;
      case "creative":
        config = {
          provider: MODEL_CONFIG.providers.OPENAI,
          model: MODEL_CONFIG.models.openai.gpt4,
          parameters: { temperature: MODEL_CONFIG.parameters.temperature.creative }
        };
        break;
      case "multimodal":
        config = {
          provider: MODEL_CONFIG.providers.OPENAI,
          model: MODEL_CONFIG.models.openai.gpt4,
          parameters: { temperature: MODEL_CONFIG.parameters.temperature.balanced }
        };
        break;
      case "fast":
        config = {
          provider: MODEL_CONFIG.providers.OPENAI,
          model: MODEL_CONFIG.models.openai.gpt4Mini,
          parameters: { 
            temperature: MODEL_CONFIG.parameters.temperature.balanced,
            timeout: MODEL_CONFIG.parameters.timeout.quick
          }
        };
        break;
      default:
        config = {
          provider: MODEL_CONFIG.providers.OPENAI,
          model: MODEL_CONFIG.models.openai.gpt4Mini,
          parameters: { temperature: MODEL_CONFIG.parameters.temperature.balanced }
        };
    }

    return this.createModel(config);
  }

  /**
   * Create multiple models from a list of configurations
   */
  static async createMultipleModels(configs: ModelFactoryOptions[]): Promise<BaseChatModel[]> {
    Logger.info("Creating multiple models", {
      count: configs.length,
      timestamp: new Date().toISOString()
    });

    const models = await Promise.allSettled(
      configs.map(config => this.createModel(config))
    );

    const successfulModels = models
      .filter((result): result is PromiseFulfilledResult<BaseChatModel> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failedCount = models.length - successfulModels.length;
    
    if (failedCount > 0) {
      Logger.warn("Some models failed to create", {
        successful: successfulModels.length,
        failed: failedCount,
        timestamp: new Date().toISOString()
      });
    }

    return successfulModels;
  }
}