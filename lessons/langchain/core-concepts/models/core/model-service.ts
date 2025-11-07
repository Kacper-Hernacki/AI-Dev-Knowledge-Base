/**
 * Model Service for high-level model interactions
 * Provides convenient methods for common model operations
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { 
  Conversation,
  Message,
  ModelResponse,
  BatchRequest,
  ModelParameters,
  movieSchema,
  articleSchema,
  classificationSchema
} from "../config/index.js";
import { Logger } from "../utils/logger.js";

export interface StreamingOptions {
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface ComparisonResult {
  prompt: string;
  responses: Array<{
    modelName: string;
    response: string;
    metadata?: {
      latency: number;
      tokenUsage?: any;
    };
  }>;
  timestamp: string;
}

/**
 * Service class providing high-level model interaction methods
 */
export class ModelService {
  
  constructor(private model: BaseChatModel) {
    Logger.info("ModelService initialized", {
      modelType: model.constructor.name,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Simple text generation
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      const messages: BaseMessage[] = [];
      
      if (systemPrompt) {
        messages.push(new SystemMessage(systemPrompt));
      }
      
      messages.push(new HumanMessage(prompt));

      Logger.debug("Generating text", {
        promptLength: prompt.length,
        hasSystemPrompt: !!systemPrompt,
        timestamp: new Date().toISOString()
      });

      const response = await this.model.invoke(messages);
      const latency = Date.now() - startTime;

      Logger.info("Text generation completed", {
        latency,
        responseLength: response.content.length,
        timestamp: new Date().toISOString()
      });

      return response.content as string;
    } catch (error) {
      Logger.error("Text generation failed", {
        error: error instanceof Error ? error.message : String(error),
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Stream text generation with callbacks
   */
  async streamText(prompt: string, options: StreamingOptions = {}): Promise<string> {
    const { onToken, onComplete, onError } = options;
    let fullResponse = "";

    try {
      Logger.debug("Starting text streaming", {
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      });

      const stream = await this.model.stream(prompt);

      for await (const chunk of stream) {
        const text = chunk.content as string;
        fullResponse += text;
        
        if (onToken) {
          onToken(text);
        }
      }

      if (onComplete) {
        onComplete(fullResponse);
      }

      Logger.info("Text streaming completed", {
        responseLength: fullResponse.length,
        timestamp: new Date().toISOString()
      });

      return fullResponse;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      Logger.error("Text streaming failed", {
        error: errorObj.message,
        timestamp: new Date().toISOString()
      });

      if (onError) {
        onError(errorObj);
      }
      
      throw errorObj;
    }
  }

  /**
   * Batch process multiple prompts
   */
  async batchGenerate(prompts: string[], maxConcurrency = 5): Promise<string[]> {
    const startTime = Date.now();
    
    Logger.info("Starting batch generation", {
      count: prompts.length,
      maxConcurrency,
      timestamp: new Date().toISOString()
    });

    try {
      const responses = await this.model.batch(prompts, { maxConcurrency });
      const latency = Date.now() - startTime;

      Logger.info("Batch generation completed", {
        count: responses.length,
        latency,
        averageLatency: latency / responses.length,
        timestamp: new Date().toISOString()
      });

      return responses.map(response => response.content as string);
    } catch (error) {
      Logger.error("Batch generation failed", {
        error: error instanceof Error ? error.message : String(error),
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Generate structured movie information
   */
  async generateMovieInfo(movieTitle: string) {
    Logger.debug("Generating movie information", {
      title: movieTitle,
      timestamp: new Date().toISOString()
    });

    const modelWithStructure = this.model.withStructuredOutput(movieSchema);
    const prompt = `Provide detailed information about the movie "${movieTitle}"`;
    
    try {
      const result = await modelWithStructure.invoke(prompt);
      
      Logger.info("Movie information generated", {
        title: movieTitle,
        result: result.title,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      Logger.error("Movie information generation failed", {
        title: movieTitle,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Generate structured article summary
   */
  async generateArticleSummary(content: string) {
    Logger.debug("Generating article summary", {
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    const modelWithStructure = this.model.withStructuredOutput(articleSchema);
    const prompt = `Analyze and summarize the following content:\n\n${content}`;
    
    try {
      const result = await modelWithStructure.invoke(prompt);
      
      Logger.info("Article summary generated", {
        title: result.title,
        wordCount: result.wordCount,
        keyPointsCount: result.keyPoints.length,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      Logger.error("Article summary generation failed", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Classify text with confidence score
   */
  async classifyText(text: string, categories?: string[]) {
    Logger.debug("Classifying text", {
      textLength: text.length,
      categoriesProvided: !!categories,
      timestamp: new Date().toISOString()
    });

    const modelWithStructure = this.model.withStructuredOutput(classificationSchema);
    
    let prompt = `Classify the following text and provide a confidence score with reasoning:\n\n${text}`;
    
    if (categories && categories.length > 0) {
      prompt += `\n\nChoose from these categories: ${categories.join(", ")}`;
    }
    
    try {
      const result = await modelWithStructure.invoke(prompt);
      
      Logger.info("Text classification completed", {
        category: result.category,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      Logger.error("Text classification failed", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Handle conversation with message history
   */
  async continueConversation(messages: Message[], newMessage: string): Promise<string> {
    Logger.debug("Continuing conversation", {
      historyLength: messages.length,
      newMessageLength: newMessage.length,
      timestamp: new Date().toISOString()
    });

    try {
      const langchainMessages: BaseMessage[] = messages.map(msg => {
        switch (msg.role) {
          case "system":
            return new SystemMessage(msg.content);
          case "user":
            return new HumanMessage(msg.content);
          case "assistant":
            return new AIMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });

      langchainMessages.push(new HumanMessage(newMessage));

      const response = await this.model.invoke(langchainMessages);

      Logger.info("Conversation continued", {
        responseLength: response.content.length,
        totalMessages: langchainMessages.length,
        timestamp: new Date().toISOString()
      });

      return response.content as string;
    } catch (error) {
      Logger.error("Conversation continuation failed", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Get model response with metadata
   */
  async getResponseWithMetadata(prompt: string): Promise<ModelResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.model.invoke(prompt);
      const latency = Date.now() - startTime;

      const result: ModelResponse = {
        content: response.content as string,
        role: "assistant",
        metadata: {
          model: this.model.constructor.name,
          provider: "unknown", // Could be enhanced to detect provider
          latency,
          tokenUsage: response.usage_metadata ? {
            promptTokens: response.usage_metadata.input_tokens || 0,
            completionTokens: response.usage_metadata.output_tokens || 0,
            totalTokens: response.usage_metadata.total_tokens || 0
          } : undefined
        }
      };

      Logger.info("Response with metadata generated", {
        latency,
        tokenUsage: result.metadata?.tokenUsage,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      Logger.error("Response with metadata failed", {
        error: error instanceof Error ? error.message : String(error),
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Compare models (requires external models array)
   */
  static async compareModels(
    models: { name: string; model: BaseChatModel }[],
    prompt: string
  ): Promise<ComparisonResult> {
    Logger.info("Starting model comparison", {
      modelCount: models.length,
      prompt: prompt.slice(0, 100) + "...",
      timestamp: new Date().toISOString()
    });

    const responses = await Promise.all(
      models.map(async ({ name, model }) => {
        const startTime = Date.now();
        try {
          const response = await model.invoke(prompt);
          const latency = Date.now() - startTime;
          
          return {
            modelName: name,
            response: response.content as string,
            metadata: {
              latency,
              tokenUsage: response.usage_metadata
            }
          };
        } catch (error) {
          Logger.warn("Model failed in comparison", {
            modelName: name,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          });
          
          return {
            modelName: name,
            response: `Error: ${error instanceof Error ? error.message : String(error)}`,
            metadata: {
              latency: Date.now() - startTime
            }
          };
        }
      })
    );

    const result: ComparisonResult = {
      prompt,
      responses,
      timestamp: new Date().toISOString()
    };

    Logger.info("Model comparison completed", {
      successful: responses.filter(r => !r.response.startsWith("Error:")).length,
      failed: responses.filter(r => r.response.startsWith("Error:")).length,
      timestamp: new Date().toISOString()
    });

    return result;
  }
}