/**
 * Environment validation for models lesson
 * Ensures required API keys and configurations are available
 */

import * as z from "zod";
import { Logger } from "../utils/logger.js";

// Environment variables schema
const envSchema = z.object({
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Azure OpenAI
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  OPENAI_API_VERSION: z.string().optional(),
  
  // Google
  GOOGLE_API_KEY: z.string().optional(),
  
  // AWS Bedrock (uses AWS credentials)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  
  // Optional configurations
  LANGCHAIN_TRACING_V2: z.enum(["true", "false"]).optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().optional()
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables for models lesson
 */
export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    Logger.error("Environment validation failed", {
      errors: result.error.flatten().fieldErrors,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Environment validation failed: ${result.error.message}`);
  }

  const env = result.data;
  
  // Check if at least one model provider is configured
  const hasOpenAI = !!env.OPENAI_API_KEY;
  const hasAnthropic = !!env.ANTHROPIC_API_KEY;
  const hasAzure = !!(env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT);
  const hasGoogle = !!env.GOOGLE_API_KEY;
  const hasBedrock = !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);
  
  const configuredProviders = [
    hasOpenAI && "OpenAI",
    hasAnthropic && "Anthropic", 
    hasAzure && "Azure OpenAI",
    hasGoogle && "Google",
    hasBedrock && "AWS Bedrock"
  ].filter(Boolean);

  if (configuredProviders.length === 0) {
    Logger.warn("No model providers configured", {
      availableProviders: ["OpenAI", "Anthropic", "Azure OpenAI", "Google", "AWS Bedrock"],
      requiredEnvVars: {
        OpenAI: ["OPENAI_API_KEY"],
        Anthropic: ["ANTHROPIC_API_KEY"],
        "Azure OpenAI": ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
        Google: ["GOOGLE_API_KEY"],
        "AWS Bedrock": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
      },
      timestamp: new Date().toISOString()
    });
    
    console.warn("⚠️  No model providers configured. Please set at least one API key:");
    console.warn("   • OPENAI_API_KEY for OpenAI models");
    console.warn("   • ANTHROPIC_API_KEY for Anthropic models");
    console.warn("   • GOOGLE_API_KEY for Google models");
    console.warn("   • AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT for Azure");
    console.warn("   • AWS credentials for Bedrock");
  } else {
    Logger.info("Model providers configured", {
      providers: configuredProviders,
      count: configuredProviders.length,
      timestamp: new Date().toISOString()
    });
  }

  return env;
}

/**
 * Check if specific provider is configured
 */
export function isProviderConfigured(provider: string): boolean {
  const env = process.env;
  
  switch (provider.toLowerCase()) {
    case "openai":
      return !!env.OPENAI_API_KEY;
    case "anthropic":
      return !!env.ANTHROPIC_API_KEY;
    case "azure":
      return !!(env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT);
    case "google":
      return !!env.GOOGLE_API_KEY;
    case "bedrock":
      return !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);
    default:
      return false;
  }
}

/**
 * Get available providers based on environment configuration
 */
export function getAvailableProviders(): string[] {
  const providers = ["openai", "anthropic", "azure", "google", "bedrock"];
  return providers.filter(isProviderConfigured);
}

/**
 * Get provider-specific environment variables
 */
export function getProviderEnv(provider: string): Record<string, string | undefined> {
  const env = process.env;
  
  switch (provider.toLowerCase()) {
    case "openai":
      return {
        apiKey: env.OPENAI_API_KEY
      };
    case "anthropic":
      return {
        apiKey: env.ANTHROPIC_API_KEY
      };
    case "azure":
      return {
        apiKey: env.AZURE_OPENAI_API_KEY,
        endpoint: env.AZURE_OPENAI_ENDPOINT,
        apiVersion: env.OPENAI_API_VERSION
      };
    case "google":
      return {
        apiKey: env.GOOGLE_API_KEY
      };
    case "bedrock":
      return {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION || "us-east-1"
      };
    default:
      return {};
  }
}