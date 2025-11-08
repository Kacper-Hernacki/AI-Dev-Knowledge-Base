/**
 * Messages Lesson - Main Export File
 *
 * This module provides a comprehensive implementation of LangChain messages
 * following clean architecture principles and enterprise patterns.
 *
 * Features:
 * - Message creation with factory pattern
 * - Multimodal content support (images, audio, video, documents)
 * - Conversation history management
 * - Message parsing and transformation
 * - Token usage tracking and cost calculation
 * - Type-safe message handling
 * - Comprehensive validation
 *
 * Usage:
 * ```typescript
 * import { MessageBuilder, MessageService, ConversationHistory } from './index.js';
 *
 * // Create messages
 * const systemMsg = MessageBuilder.system("You are a helpful assistant");
 * const humanMsg = MessageBuilder.human("Hello!");
 * const aiMsg = MessageBuilder.ai("Hi there!");
 *
 * // Create conversation
 * const conversation = MessageService.createConversation([
 *   { user: "What is AI?", assistant: "AI stands for..." }
 * ]);
 *
 * // Manage history
 * const history = new ConversationHistory();
 * history.add(humanMsg);
 * history.add(aiMsg);
 * ```
 */

// Core exports
export * from "./core/index.js";
export * from "./config/index.js";

// Examples
export * from "./examples/index.js";

// Re-export key components for convenience
export {
  MessageBuilder,
  MessageParser,
  MessageService,
  ConversationHistory,
  MultimodalMessageBuilder,
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage
} from "./core/index.js";

export {
  MESSAGE_CONFIG,
  MESSAGE_ROLES,
  CONTENT_TYPES,
  MIME_TYPES,
  calculateCost,
  getTokenPricing
} from "./config/index.js";
