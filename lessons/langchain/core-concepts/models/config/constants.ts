/**
 * Models lesson configuration constants
 * Centralized configuration for model types, parameters, and behaviors
 */

export const MODEL_CONFIG = {
  providers: {
    OPENAI: "openai",
    ANTHROPIC: "anthropic", 
    AZURE: "azure",
    GOOGLE: "google",
    BEDROCK: "bedrock",
    LOCAL: "local"
  },
  models: {
    // OpenAI models
    openai: {
      gpt4: "gpt-4o",
      gpt4Mini: "gpt-4o-mini",
      gpt3Turbo: "gpt-3.5-turbo"
    },
    // Anthropic models
    anthropic: {
      claudeSonnet: "claude-sonnet-4-5-20250929",
      claudeHaiku: "claude-haiku-3-5-20241022"
    },
    // Google models
    google: {
      gemini: "gemini-2.5-flash-lite",
      geminiPro: "gemini-2.5-pro"
    }
  },
  parameters: {
    temperature: {
      creative: 0.9,
      balanced: 0.7,
      deterministic: 0.1,
      precise: 0.0
    },
    maxTokens: {
      short: 500,
      medium: 1500,
      long: 4000,
      extended: 8000
    },
    timeout: {
      quick: 10,
      standard: 30,
      extended: 60
    }
  },
  features: {
    TOOL_CALLING: "tool_calling",
    STRUCTURED_OUTPUT: "structured_output",
    MULTIMODAL: "multimodal",
    REASONING: "reasoning",
    STREAMING: "streaming"
  }
} as const;

export const MODEL_CAPABILITIES = {
  [MODEL_CONFIG.models.openai.gpt4]: [
    MODEL_CONFIG.features.TOOL_CALLING,
    MODEL_CONFIG.features.STRUCTURED_OUTPUT,
    MODEL_CONFIG.features.MULTIMODAL,
    MODEL_CONFIG.features.STREAMING
  ],
  [MODEL_CONFIG.models.anthropic.claudeSonnet]: [
    MODEL_CONFIG.features.TOOL_CALLING,
    MODEL_CONFIG.features.STRUCTURED_OUTPUT,
    MODEL_CONFIG.features.REASONING,
    MODEL_CONFIG.features.STREAMING
  ],
  [MODEL_CONFIG.models.google.gemini]: [
    MODEL_CONFIG.features.TOOL_CALLING,
    MODEL_CONFIG.features.MULTIMODAL,
    MODEL_CONFIG.features.STREAMING
  ]
} as const;

export const USE_CASES = {
  TEXT_GENERATION: "text_generation",
  CLASSIFICATION: "classification", 
  EXTRACTION: "extraction",
  SUMMARIZATION: "summarization",
  TRANSLATION: "translation",
  REASONING: "reasoning",
  TOOL_CALLING: "tool_calling"
} as const;

export const INVOCATION_METHODS = {
  INVOKE: "invoke",
  STREAM: "stream",
  BATCH: "batch"
} as const;

export type ModelProvider = typeof MODEL_CONFIG.providers[keyof typeof MODEL_CONFIG.providers];
export type UseCase = typeof USE_CASES[keyof typeof USE_CASES];
export type InvocationMethod = typeof INVOCATION_METHODS[keyof typeof INVOCATION_METHODS];
export type ModelFeature = typeof MODEL_CONFIG.features[keyof typeof MODEL_CONFIG.features];