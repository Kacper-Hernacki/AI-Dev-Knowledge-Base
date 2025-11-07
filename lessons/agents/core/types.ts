import type { Tool } from "langchain";
import type { UserRole } from "../config/constants.js";
import type { ArticleFormat, AgentState } from "../config/schemas.js";

// Re-export types for convenience
export type { UserRole } from "../config/constants.js";
export type { ArticleFormat, AgentState } from "../config/schemas.js";

export interface AgentOptions {
  model?: string;
  tools?: Tool[];
}

export interface StreamOptions {
  userRole: UserRole;
  streamMode?: string;
}

export interface ParsedResponse {
  structuredResponse: ArticleFormat;
  messages: any[];
}

export interface ChunkData {
  type: 'content' | 'tool_call';
  content?: string;
  toolCalls?: string[];
}

export class ResponseParsingError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = 'ResponseParsingError';
  }
}

export class AgentConfigurationError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = 'AgentConfigurationError';
  }
}