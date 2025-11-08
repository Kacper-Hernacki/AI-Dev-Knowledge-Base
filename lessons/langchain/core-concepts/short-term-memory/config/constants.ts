/**
 * Short-Term Memory Constants
 * Configuration values and constants for memory management
 */

/**
 * Default memory configuration
 */
export const DEFAULT_MEMORY_CONFIG = {
  // Message trimming
  MAX_TOKENS: 1000,
  TRIM_STRATEGY: "last" as const,
  START_ON: "human" as const,
  END_ON: ["human", "tool"] as const,

  // Summarization
  MAX_TOKENS_BEFORE_SUMMARY: 4000,
  MESSAGES_TO_KEEP: 10,
  SUMMARY_MODEL: "claude-3-5-sonnet-20241022",

  // Checkpointer
  DEFAULT_THREAD_PREFIX: "thread",

  // Message validation
  REQUIRED_FIRST_MESSAGE_TYPES: ["human", "system"],
} as const;

/**
 * Memory operation types
 */
export enum MemoryOperation {
  TRIM = "trim",
  DELETE = "delete",
  SUMMARIZE = "summarize",
  VALIDATE = "validate",
}

/**
 * Summarization strategies
 */
export enum SummarizationStrategy {
  FULL = "full",
  ROLLING = "rolling",
  HIERARCHICAL = "hierarchical",
}

/**
 * Checkpointer types
 */
export enum CheckpointerType {
  MEMORY = "memory",
  POSTGRES = "postgres",
  SQLITE = "sqlite",
}

/**
 * Message type constants
 */
export const MESSAGE_TYPES = {
  HUMAN: "human",
  AI: "ai",
  SYSTEM: "system",
  TOOL: "tool",
  FUNCTION: "function",
} as const;

/**
 * State field names
 */
export const STATE_FIELDS = {
  MESSAGES: "messages",
  USER_ID: "userId",
  THREAD_ID: "thread_id",
  PREFERENCES: "preferences",
  METADATA: "metadata",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_MESSAGE_SEQUENCE: "Invalid message sequence",
  MISSING_CHECKPOINTER: "Checkpointer is required but not configured",
  MISSING_TOOL_RESULT: "Tool call not followed by tool result",
  INVALID_FIRST_MESSAGE: "First message must be human or system",
  SUMMARIZATION_FAILED: "Failed to summarize messages",
  STATE_VALIDATION_FAILED: "State validation failed",
} as const;

/**
 * Memory limits
 */
export const MEMORY_LIMITS = {
  // Conservative limits for different models
  GPT4: {
    MAX_TOKENS: 128_000,
    RECOMMENDED_LIMIT: 100_000,
  },
  GPT35: {
    MAX_TOKENS: 16_385,
    RECOMMENDED_LIMIT: 12_000,
  },
  CLAUDE_SONNET: {
    MAX_TOKENS: 200_000,
    RECOMMENDED_LIMIT: 150_000,
  },
  CLAUDE_HAIKU: {
    MAX_TOKENS: 200_000,
    RECOMMENDED_LIMIT: 150_000,
  },
} as const;

/**
 * PostgreSQL configuration
 */
export const POSTGRES_CONFIG = {
  DEFAULT_HOST: "localhost",
  DEFAULT_PORT: 5432,
  DEFAULT_DATABASE: "langchain_memory",
  DEFAULT_SSL_MODE: "disable",
  CONNECTION_POOL_SIZE: 10,
  IDLE_TIMEOUT: 10000,
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  TRIM_WARNING_COUNT: 100,
  SUMMARIZE_WARNING_LENGTH: 50000,
  DELETE_WARNING_COUNT: 50,
} as const;

/**
 * Logging levels
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Hook types
 */
export enum HookType {
  BEFORE_MODEL = "before_model",
  AFTER_MODEL = "after_model",
  ON_ERROR = "on_error",
}

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  MIN_MESSAGES: 1,
  MAX_MESSAGES: 1000,
  MIN_THREAD_ID_LENGTH: 1,
  MAX_THREAD_ID_LENGTH: 256,
  VALID_MESSAGE_TYPES: [
    "human",
    "ai",
    "system",
    "tool",
    "function",
  ] as const,
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 10000,
  BACKOFF_FACTOR: 2,
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  SUMMARY_TTL: 3600, // 1 hour
  STATE_TTL: 1800, // 30 minutes
  MAX_CACHE_SIZE: 1000,
} as const;
