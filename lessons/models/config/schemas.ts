/**
 * Zod schemas for models lesson type safety and validation
 * Provides structured data validation and type inference
 */

import * as z from "zod";
import { MODEL_CONFIG, USE_CASES, INVOCATION_METHODS } from "./constants.js";

// Model configuration schemas
export const modelProviderSchema = z.enum([
  MODEL_CONFIG.providers.OPENAI,
  MODEL_CONFIG.providers.ANTHROPIC,
  MODEL_CONFIG.providers.AZURE,
  MODEL_CONFIG.providers.GOOGLE,
  MODEL_CONFIG.providers.BEDROCK,
  MODEL_CONFIG.providers.LOCAL
] as const);

export const useCaseSchema = z.enum([
  USE_CASES.TEXT_GENERATION,
  USE_CASES.CLASSIFICATION,
  USE_CASES.EXTRACTION,
  USE_CASES.SUMMARIZATION,
  USE_CASES.TRANSLATION,
  USE_CASES.REASONING,
  USE_CASES.TOOL_CALLING
] as const);

export const invocationMethodSchema = z.enum([
  INVOCATION_METHODS.INVOKE,
  INVOCATION_METHODS.STREAM,
  INVOCATION_METHODS.BATCH
] as const);

// Model parameters schema
export const modelParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  timeout: z.number().positive().optional(),
  maxRetries: z.number().min(0).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional()
});

// Model configuration schema
export const modelConfigSchema = z.object({
  provider: modelProviderSchema,
  model: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  parameters: modelParametersSchema.optional()
});

// Structured output schemas
export const movieSchema = z.object({
  title: z.string().describe("The title of the movie"),
  year: z.number().describe("The year the movie was released"),
  director: z.string().describe("The director of the movie"),
  rating: z.number().min(0).max(10).describe("The movie's rating out of 10"),
  genre: z.array(z.string()).describe("The genres of the movie")
});

export const articleSchema = z.object({
  title: z.string().describe("The title of the article"),
  summary: z.string().describe("A brief summary of the article"),
  keyPoints: z.array(z.string()).describe("Key points from the article"),
  wordCount: z.number().positive().describe("Estimated word count"),
  category: z.string().describe("The category or topic of the article")
});

export const classificationSchema = z.object({
  category: z.string().describe("The predicted category"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  reasoning: z.string().describe("Explanation for the classification")
});

// Message schemas
export const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string(),
  name: z.string().optional(),
  toolCallId: z.string().optional()
});

export const conversationSchema = z.array(messageSchema);

// Response schemas
export const modelResponseSchema = z.object({
  content: z.string(),
  role: z.literal("assistant"),
  metadata: z.object({
    model: z.string(),
    provider: z.string(),
    tokenUsage: z.object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number()
    }).optional(),
    latency: z.number().optional()
  }).optional()
});

// Tool calling schema
export const toolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.any())
});

export const toolResultSchema = z.object({
  toolCallId: z.string(),
  content: z.string(),
  isError: z.boolean().optional()
});

// Batch processing schema
export const batchRequestSchema = z.object({
  requests: z.array(z.object({
    id: z.string(),
    messages: conversationSchema,
    parameters: modelParametersSchema.optional()
  })),
  maxConcurrency: z.number().positive().optional()
});

// Model comparison schema
export const modelComparisonSchema = z.object({
  models: z.array(z.string()),
  prompt: z.string(),
  useCase: useCaseSchema,
  metrics: z.object({
    latency: z.boolean().optional(),
    tokenUsage: z.boolean().optional(),
    quality: z.boolean().optional()
  }).optional()
});

// Export type definitions
export type ModelProvider = z.infer<typeof modelProviderSchema>;
export type UseCase = z.infer<typeof useCaseSchema>;
export type InvocationMethod = z.infer<typeof invocationMethodSchema>;
export type ModelParameters = z.infer<typeof modelParametersSchema>;
export type ModelConfig = z.infer<typeof modelConfigSchema>;
export type Movie = z.infer<typeof movieSchema>;
export type Article = z.infer<typeof articleSchema>;
export type Classification = z.infer<typeof classificationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ModelResponse = z.infer<typeof modelResponseSchema>;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type ToolResult = z.infer<typeof toolResultSchema>;
export type BatchRequest = z.infer<typeof batchRequestSchema>;
export type ModelComparison = z.infer<typeof modelComparisonSchema>;