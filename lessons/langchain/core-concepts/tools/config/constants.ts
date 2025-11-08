/**
 * Configuration constants for tools
 */

/**
 * Tool categories
 */
export const TOOL_CATEGORIES = {
  DATA_RETRIEVAL: "data_retrieval",
  COMPUTATION: "computation",
  FILE_OPERATIONS: "file_operations",
  API_CALLS: "api_calls",
  DATABASE: "database",
  WEATHER: "weather",
  USER_INFO: "user_info",
  GENERAL: "general"
} as const;

/**
 * Execution configuration
 */
export const EXECUTION_CONFIG = {
  /**
   * Default timeout for tool execution (ms)
   */
  defaultTimeout: 30000, // 30 seconds

  /**
   * Default number of retries on failure
   */
  defaultRetries: 2,

  /**
   * Delay between retries (ms)
   */
  retryDelay: 1000,

  /**
   * Maximum concurrent tool executions
   */
  maxConcurrentExecutions: 5,

  /**
   * Maximum execution history size
   */
  maxHistorySize: 100
} as const;

/**
 * Validation rules for tools
 */
export const VALIDATION_RULES = {
  /**
   * Maximum tool name length
   */
  maxNameLength: 64,

  /**
   * Maximum description length
   */
  maxDescriptionLength: 500,

  /**
   * Maximum number of parameters
   */
  maxParameters: 20,

  /**
   * Reserved tool names (cannot be used)
   */
  reservedNames: [
    "system",
    "internal",
    "reserved",
    "admin"
  ] as string[],

  /**
   * Valid tool name pattern
   */
  namePattern: /^[a-z][a-z0-9_]*$/
} as const;

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  TOOL_NOT_FOUND: "Tool not found in registry",
  INVALID_ARGS: "Invalid arguments provided to tool",
  EXECUTION_TIMEOUT: "Tool execution timed out",
  EXECUTION_FAILED: "Tool execution failed",
  VALIDATION_FAILED: "Tool validation failed",
  CONTEXT_REQUIRED: "Tool requires context but none was provided",
  STORE_REQUIRED: "Tool requires store but none was provided",
  INVALID_TOOL_NAME: "Invalid tool name format",
  RESERVED_NAME: "Tool name is reserved",
  NAME_TOO_LONG: "Tool name exceeds maximum length"
} as const;

/**
 * Tool execution status codes
 */
export const STATUS_CODES = {
  SUCCESS: "success",
  FAILED: "failed",
  TIMEOUT: "timeout",
  INVALID_ARGS: "invalid_args",
  NOT_FOUND: "not_found"
} as const;

/**
 * Common tool tags
 */
export const COMMON_TAGS = {
  SEARCH: "search",
  CALCULATION: "calculation",
  DATA: "data",
  API: "api",
  FILE: "file",
  DATABASE: "database",
  USER: "user",
  WEATHER: "weather",
  ASYNC: "async",
  EXTERNAL: "external",
  INTERNAL: "internal"
} as const;

/**
 * Tool execution limits
 */
export const EXECUTION_LIMITS = {
  /**
   * Maximum result size (bytes)
   */
  maxResultSize: 1_000_000, // 1MB

  /**
   * Maximum execution time (ms)
   */
  maxExecutionTime: 60000, // 60 seconds

  /**
   * Maximum retries
   */
  maxRetries: 5,

  /**
   * Maximum tools in parallel
   */
  maxParallelTools: 10
} as const;

/**
 * Validate tool name
 */
export function validateToolName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (name.length > VALIDATION_RULES.maxNameLength) {
    return {
      valid: false,
      error: ERROR_MESSAGES.NAME_TOO_LONG
    };
  }

  if (VALIDATION_RULES.reservedNames.includes(name.toLowerCase())) {
    return {
      valid: false,
      error: ERROR_MESSAGES.RESERVED_NAME
    };
  }

  if (!VALIDATION_RULES.namePattern.test(name)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_TOOL_NAME
    };
  }

  return { valid: true };
}

/**
 * Validate tool description
 */
export function validateToolDescription(description: string): {
  valid: boolean;
  error?: string;
} {
  if (description.length > VALIDATION_RULES.maxDescriptionLength) {
    return {
      valid: false,
      error: `Description exceeds maximum length of ${VALIDATION_RULES.maxDescriptionLength}`
    };
  }

  return { valid: true };
}

/**
 * Format execution time
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Generate tool ID
 */
export function generateToolId(): string {
  return `tool_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Get tool category display name
 */
export function getCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    [TOOL_CATEGORIES.DATA_RETRIEVAL]: "Data Retrieval",
    [TOOL_CATEGORIES.COMPUTATION]: "Computation",
    [TOOL_CATEGORIES.FILE_OPERATIONS]: "File Operations",
    [TOOL_CATEGORIES.API_CALLS]: "API Calls",
    [TOOL_CATEGORIES.DATABASE]: "Database",
    [TOOL_CATEGORIES.WEATHER]: "Weather",
    [TOOL_CATEGORIES.USER_INFO]: "User Information",
    [TOOL_CATEGORIES.GENERAL]: "General"
  };

  return displayNames[category] || category;
}
