/**
 * Configuration constants for messages
 */

/**
 * Message role types
 */
export const MESSAGE_ROLES = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
  TOOL: "tool"
} as const;

/**
 * Content block types
 */
export const CONTENT_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  AUDIO: "audio",
  VIDEO: "video",
  FILE: "file",
  TOOL_CALL: "tool_call",
  REASONING: "reasoning"
} as const;

/**
 * Image source types
 */
export const IMAGE_SOURCE_TYPES = {
  URL: "url",
  BASE64: "base64",
  FILE_ID: "id"
} as const;

/**
 * Supported MIME types
 */
export const MIME_TYPES = {
  // Images
  IMAGE_JPEG: "image/jpeg",
  IMAGE_PNG: "image/png",
  IMAGE_GIF: "image/gif",
  IMAGE_WEBP: "image/webp",

  // Audio
  AUDIO_MPEG: "audio/mpeg",
  AUDIO_WAV: "audio/wav",
  AUDIO_OGG: "audio/ogg",
  AUDIO_WEBM: "audio/webm",

  // Video
  VIDEO_MP4: "video/mp4",
  VIDEO_WEBM: "video/webm",
  VIDEO_OGG: "video/ogg",

  // Documents
  PDF: "application/pdf",
  TEXT_PLAIN: "text/plain",
  TEXT_MARKDOWN: "text/markdown",
  TEXT_HTML: "text/html"
} as const;

/**
 * Default message configuration
 */
export const MESSAGE_CONFIG = {
  /**
   * Maximum messages to keep in history (0 = unlimited)
   */
  maxHistorySize: 100,

  /**
   * Default token estimation (chars per token)
   */
  charsPerToken: 4,

  /**
   * Maximum content size for different types (in bytes)
   */
  maxContentSize: {
    text: 1_000_000, // 1MB
    image: 20_000_000, // 20MB
    audio: 25_000_000, // 25MB
    video: 100_000_000, // 100MB
    file: 512_000_000 // 512MB
  },

  /**
   * Supported image formats
   */
  supportedImageFormats: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
  ],

  /**
   * Supported audio formats
   */
  supportedAudioFormats: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm"
  ],

  /**
   * Supported video formats
   */
  supportedVideoFormats: [
    "video/mp4",
    "video/webm",
    "video/ogg"
  ],

  /**
   * Supported document formats
   */
  supportedDocumentFormats: [
    "application/pdf",
    "text/plain",
    "text/markdown"
  ]
} as const;

/**
 * Message validation rules
 */
export const VALIDATION_RULES = {
  /**
   * Minimum text length
   */
  minTextLength: 1,

  /**
   * Maximum text length
   */
  maxTextLength: 100_000,

  /**
   * Maximum number of content blocks
   */
  maxContentBlocks: 20,

  /**
   * Maximum number of tool calls per message
   */
  maxToolCalls: 10
} as const;

/**
 * Token pricing for cost estimation (example values)
 */
export const TOKEN_PRICING = {
  "gpt-4o": {
    inputPer1M: 2.50,
    outputPer1M: 10.00
  },
  "gpt-4o-mini": {
    inputPer1M: 0.15,
    outputPer1M: 0.60
  },
  "gpt-4-turbo": {
    inputPer1M: 10.00,
    outputPer1M: 30.00
  },
  "claude-3-opus": {
    inputPer1M: 15.00,
    outputPer1M: 75.00
  },
  "claude-3-sonnet": {
    inputPer1M: 3.00,
    outputPer1M: 15.00
  },
  "gemini-pro": {
    inputPer1M: 0.50,
    outputPer1M: 1.50
  }
} as const;

/**
 * Helper to get token pricing for a model
 */
export function getTokenPricing(model: string): {
  inputPer1M: number;
  outputPer1M: number;
} {
  // Normalize model name
  const normalizedModel = model.toLowerCase();

  for (const [key, pricing] of Object.entries(TOKEN_PRICING)) {
    if (normalizedModel.includes(key.toLowerCase())) {
      return pricing;
    }
  }

  // Default pricing if model not found
  return {
    inputPer1M: 1.00,
    outputPer1M: 3.00
  };
}

/**
 * Calculate cost from token usage
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  const pricing = getTokenPricing(model);

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
}
