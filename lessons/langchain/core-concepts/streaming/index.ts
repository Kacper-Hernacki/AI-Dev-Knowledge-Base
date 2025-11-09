/**
 * Streaming Module - Main Entry Point
 *
 * This module provides comprehensive examples and utilities for streaming
 * in LangChain applications.
 *
 * @module streaming
 */

// Export all examples
export * from "./examples/index.js";

/**
 * Streaming System Overview
 *
 * LangChain implements a streaming system to surface real-time updates.
 *
 * Three streaming modes:
 * - updates: Agent step progress
 * - messages: LLM token streaming
 * - custom: Tool progress updates
 *
 * @example
 * ```typescript
 * import { createAgent } from "langchain";
 *
 * const agent = createAgent({
 *   model: "claude-3-5-haiku-20241022",
 *   tools: [],
 * });
 *
 * // Stream tokens
 * for await (const [token] of await agent.stream(
 *   { messages: "Hello" },
 *   { streamMode: "messages" }
 * )) {
 *   console.log(token);
 * }
 * ```
 *
 * @see {@link ./lesson.md} for comprehensive documentation
 * @see {@link ./examples} for usage examples
 */

/**
 * Quick reference for stream modes
 */
export const STREAM_MODES = {
  /** Agent step progress - returns node updates */
  UPDATES: "updates" as const,

  /** LLM token streaming - returns tokens and metadata */
  MESSAGES: "messages" as const,

  /** Custom updates from tools - returns string messages */
  CUSTOM: "custom" as const,
} as const;

/**
 * Stream mode type
 */
export type StreamMode = typeof STREAM_MODES[keyof typeof STREAM_MODES];

/**
 * Helper to validate stream mode
 */
export function isValidStreamMode(mode: string): mode is StreamMode {
  return Object.values(STREAM_MODES).includes(mode as StreamMode);
}

// Default export
export default {
  STREAM_MODES,
  isValidStreamMode,
};
