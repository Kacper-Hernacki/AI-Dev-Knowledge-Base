/**
 * Message Parser - Utilities for parsing and extracting content from messages
 * Handles different content formats and provides type-safe access to message data
 */

import type { BaseMessage, AIMessage } from "@langchain/core/messages";

/**
 * Usage metadata structure
 */
export interface UsageMetadata {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_token_details?: {
    cache_read?: number;
  };
  output_token_details?: {
    reasoning?: number;
  };
}

/**
 * Tool call structure
 */
export interface ToolCall {
  name: string;
  args: Record<string, any>;
  id: string;
}

/**
 * Content block types
 */
export type ParsedContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; url?: string; data?: string; mimeType?: string }
  | { type: "audio"; data?: string; mimeType?: string }
  | { type: "video"; data?: string; mimeType?: string }
  | { type: "file"; url?: string; data?: string; mimeType?: string }
  | { type: "tool_call"; name: string; args: any; id: string }
  | { type: "reasoning"; reasoning: string };

/**
 * Message Parser - Extract and parse content from messages
 */
export class MessageParser {
  /**
   * Extract text content from any message
   */
  static extractText(message: BaseMessage): string {
    if (typeof message.content === "string") {
      return message.content;
    }

    if (Array.isArray(message.content)) {
      const textBlocks = message.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text);

      return textBlocks.join("\n");
    }

    return "";
  }

  /**
   * Extract all content blocks from a message
   */
  static extractContentBlocks(message: BaseMessage): ParsedContentBlock[] {
    if (typeof message.content === "string") {
      return [{ type: "text", text: message.content }];
    }

    if (Array.isArray(message.content)) {
      return message.content.map((block: any) => this.parseContentBlock(block));
    }

    return [];
  }

  /**
   * Parse a single content block
   */
  private static parseContentBlock(block: any): ParsedContentBlock {
    switch (block.type) {
      case "text":
        return { type: "text", text: block.text || "" };

      case "image":
      case "image_url":
        return {
          type: "image",
          url: block.url || block.image_url?.url,
          data: block.data,
          mimeType: block.mimeType
        };

      case "audio":
        return {
          type: "audio",
          data: block.data,
          mimeType: block.mimeType
        };

      case "video":
        return {
          type: "video",
          data: block.data,
          mimeType: block.mimeType
        };

      case "file":
        return {
          type: "file",
          url: block.url,
          data: block.data,
          mimeType: block.mimeType
        };

      case "tool_call":
        return {
          type: "tool_call",
          name: block.name,
          args: block.args,
          id: block.id
        };

      case "reasoning":
      case "thinking":
        return {
          type: "reasoning",
          reasoning: block.reasoning || block.thinking || ""
        };

      default:
        // Return as text if unknown type
        return {
          type: "text",
          text: JSON.stringify(block)
        };
    }
  }

  /**
   * Extract tool calls from AI message
   */
  static extractToolCalls(message: AIMessage): ToolCall[] {
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return [];
    }

    return message.tool_calls.map((tc) => ({
      name: tc.name,
      args: tc.args,
      id: tc.id
    }));
  }

  /**
   * Extract usage metadata from AI message
   */
  static extractUsageMetadata(message: AIMessage): UsageMetadata | null {
    if (!message.usage_metadata) {
      return null;
    }

    const usage = message.usage_metadata as any;

    return {
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      input_token_details: usage.input_token_details,
      output_token_details: usage.output_token_details
    };
  }

  /**
   * Extract response metadata from AI message
   */
  static extractResponseMetadata(message: AIMessage): Record<string, any> {
    return (message.response_metadata as Record<string, any>) || {};
  }

  /**
   * Check if message contains multimodal content
   */
  static isMultimodal(message: BaseMessage): boolean {
    if (typeof message.content === "string") {
      return false;
    }

    if (Array.isArray(message.content)) {
      return message.content.some(
        (block: any) =>
          block.type === "image" ||
          block.type === "image_url" ||
          block.type === "audio" ||
          block.type === "video" ||
          block.type === "file"
      );
    }

    return false;
  }

  /**
   * Check if message has tool calls
   */
  static hasToolCalls(message: BaseMessage): boolean {
    return message instanceof Object && "tool_calls" in message &&
           Array.isArray((message as any).tool_calls) &&
           (message as any).tool_calls.length > 0;
  }

  /**
   * Extract message type (system, human, ai, tool)
   */
  static getMessageType(message: BaseMessage): string {
    return message.constructor.name.replace("Message", "").toLowerCase();
  }

  /**
   * Extract message ID
   */
  static getMessageId(message: BaseMessage): string | undefined {
    return (message as any).id;
  }

  /**
   * Extract message name (for human messages)
   */
  static getMessageName(message: BaseMessage): string | undefined {
    return (message as any).name;
  }

  /**
   * Filter messages by type
   */
  static filterByType(
    messages: BaseMessage[],
    type: "system" | "human" | "ai" | "tool"
  ): BaseMessage[] {
    const typeName = `${type}message`;
    return messages.filter(
      (msg) => this.getMessageType(msg) === type.toLowerCase()
    );
  }

  /**
   * Get conversation text (all messages as formatted text)
   */
  static formatConversation(messages: BaseMessage[]): string {
    return messages
      .map((msg) => {
        const type = this.getMessageType(msg);
        const text = this.extractText(msg);
        return `[${type.toUpperCase()}]: ${text}`;
      })
      .join("\n\n");
  }

  /**
   * Calculate total tokens from conversation
   */
  static calculateTotalTokens(messages: BaseMessage[]): UsageMetadata {
    const totals: UsageMetadata = {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0
    };

    messages.forEach((msg) => {
      if ("usage_metadata" in msg && msg.usage_metadata) {
        const usage = msg.usage_metadata as any;
        totals.input_tokens += usage.input_tokens || 0;
        totals.output_tokens += usage.output_tokens || 0;
        totals.total_tokens += usage.total_tokens || 0;
      }
    });

    return totals;
  }

  /**
   * Extract reasoning blocks from AI message
   */
  static extractReasoning(message: AIMessage): string[] {
    const blocks = this.extractContentBlocks(message);
    return blocks
      .filter((block) => block.type === "reasoning")
      .map((block) => (block as { type: "reasoning"; reasoning: string }).reasoning);
  }

  /**
   * Check if message has reasoning
   */
  static hasReasoning(message: BaseMessage): boolean {
    const blocks = this.extractContentBlocks(message);
    return blocks.some((block) => block.type === "reasoning");
  }

  /**
   * Convert message to simple object for serialization
   */
  static toSimpleObject(message: BaseMessage): Record<string, any> {
    return {
      type: this.getMessageType(message),
      content: message.content,
      id: this.getMessageId(message),
      name: this.getMessageName(message),
      ...(this.hasToolCalls(message) && {
        tool_calls: this.extractToolCalls(message as AIMessage)
      }),
      ...("usage_metadata" in message && {
        usage_metadata: this.extractUsageMetadata(message as AIMessage)
      }),
      ...("response_metadata" in message && {
        response_metadata: this.extractResponseMetadata(message as AIMessage)
      })
    };
  }

  /**
   * Convert array of messages to simple objects
   */
  static toSimpleObjects(messages: BaseMessage[]): Record<string, any>[] {
    return messages.map((msg) => this.toSimpleObject(msg));
  }
}
