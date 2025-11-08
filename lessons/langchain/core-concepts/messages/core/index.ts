/**
 * Core exports for the messages module
 */

export * from "./message-builder.js";
export * from "./message-parser.js";
export * from "./message-service.js";

// Re-export LangChain message types for convenience
export {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  type BaseMessage
} from "@langchain/core/messages";
