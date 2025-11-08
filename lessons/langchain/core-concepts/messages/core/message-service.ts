/**
 * Message Service - High-level operations for managing messages
 * Provides utilities for conversation management, history tracking, and message transformations
 */

import type { BaseMessage, AIMessage } from "@langchain/core/messages";
import { MessageBuilder } from "./message-builder.js";
import { MessageParser, type UsageMetadata } from "./message-parser.js";

/**
 * Conversation history manager
 */
export class ConversationHistory {
  private messages: BaseMessage[] = [];
  private maxMessages?: number;

  constructor(initialMessages: BaseMessage[] = [], maxMessages?: number) {
    this.messages = [...initialMessages];
    this.maxMessages = maxMessages;
  }

  /**
   * Add a message to the history
   */
  add(message: BaseMessage): void {
    this.messages.push(message);
    this.trim();
  }

  /**
   * Add multiple messages
   */
  addMany(messages: BaseMessage[]): void {
    this.messages.push(...messages);
    this.trim();
  }

  /**
   * Get all messages
   */
  getAll(): BaseMessage[] {
    return [...this.messages];
  }

  /**
   * Get last N messages
   */
  getLast(n: number): BaseMessage[] {
    return this.messages.slice(-n);
  }

  /**
   * Get messages by type
   */
  getByType(type: "system" | "human" | "ai" | "tool"): BaseMessage[] {
    return MessageParser.filterByType(this.messages, type);
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Get message count
   */
  count(): number {
    return this.messages.length;
  }

  /**
   * Trim messages to max length
   */
  private trim(): void {
    if (this.maxMessages && this.messages.length > this.maxMessages) {
      // Keep system messages and trim from the middle
      const systemMessages = this.messages.filter(
        (msg) => MessageParser.getMessageType(msg) === "system"
      );
      const otherMessages = this.messages.filter(
        (msg) => MessageParser.getMessageType(msg) !== "system"
      );

      const trimmedOther = otherMessages.slice(-this.maxMessages + systemMessages.length);
      this.messages = [...systemMessages, ...trimmedOther];
    }
  }

  /**
   * Get total token usage across all messages
   */
  getTotalUsage(): UsageMetadata {
    return MessageParser.calculateTotalTokens(this.messages);
  }

  /**
   * Format conversation as text
   */
  format(): string {
    return MessageParser.formatConversation(this.messages);
  }

  /**
   * Export as simple objects for serialization
   */
  toJSON(): Record<string, any>[] {
    return MessageParser.toSimpleObjects(this.messages);
  }
}

/**
 * Message Service - High-level message operations
 */
export class MessageService {
  /**
   * Create a conversation from text exchanges
   */
  static createConversation(
    exchanges: Array<{ user: string; assistant: string }>,
    systemPrompt?: string
  ): BaseMessage[] {
    const messages: BaseMessage[] = [];

    if (systemPrompt) {
      messages.push(MessageBuilder.system(systemPrompt));
    }

    exchanges.forEach(({ user, assistant }) => {
      messages.push(MessageBuilder.human(user));
      messages.push(MessageBuilder.ai(assistant));
    });

    return messages;
  }

  /**
   * Add a user question to a conversation
   */
  static addUserMessage(
    messages: BaseMessage[],
    content: string
  ): BaseMessage[] {
    return [...messages, MessageBuilder.human(content)];
  }

  /**
   * Add an AI response to a conversation
   */
  static addAIMessage(
    messages: BaseMessage[],
    content: string
  ): BaseMessage[] {
    return [...messages, MessageBuilder.ai(content)];
  }

  /**
   * Extract conversation context (last N exchanges)
   */
  static getRecentContext(
    messages: BaseMessage[],
    numExchanges: number = 5
  ): BaseMessage[] {
    // Get system messages
    const systemMessages = messages.filter(
      (msg) => MessageParser.getMessageType(msg) === "system"
    );

    // Get last N user/assistant pairs
    const otherMessages = messages.filter(
      (msg) => MessageParser.getMessageType(msg) !== "system"
    );

    const recentMessages = otherMessages.slice(-numExchanges * 2);

    return [...systemMessages, ...recentMessages];
  }

  /**
   * Summarize conversation length and token usage
   */
  static getConversationStats(messages: BaseMessage[]): {
    totalMessages: number;
    byType: Record<string, number>;
    totalTokens: UsageMetadata;
    hasMultimodal: boolean;
    hasToolCalls: boolean;
  } {
    const byType: Record<string, number> = {};

    messages.forEach((msg) => {
      const type = MessageParser.getMessageType(msg);
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      totalMessages: messages.length,
      byType,
      totalTokens: MessageParser.calculateTotalTokens(messages),
      hasMultimodal: messages.some((msg) => MessageParser.isMultimodal(msg)),
      hasToolCalls: messages.some((msg) => MessageParser.hasToolCalls(msg))
    };
  }

  /**
   * Convert messages to OpenAI chat format
   */
  static toChatFormat(messages: BaseMessage[]): Array<{
    role: string;
    content: string | any[];
    name?: string;
  }> {
    return messages.map((msg) => {
      const type = MessageParser.getMessageType(msg);
      const roleMap: Record<string, string> = {
        system: "system",
        human: "user",
        ai: "assistant",
        tool: "tool"
      };

      return {
        role: roleMap[type] || "user",
        content: msg.content,
        ...(MessageParser.getMessageName(msg) && {
          name: MessageParser.getMessageName(msg)
        })
      };
    });
  }

  /**
   * Merge consecutive messages of the same type
   */
  static mergeConsecutive(messages: BaseMessage[]): BaseMessage[] {
    if (messages.length === 0) return [];

    const merged: BaseMessage[] = [messages[0]];

    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = merged[merged.length - 1];

      const currentType = MessageParser.getMessageType(current);
      const previousType = MessageParser.getMessageType(previous);

      if (currentType === previousType && currentType !== "system") {
        // Merge text content
        const previousText = MessageParser.extractText(previous);
        const currentText = MessageParser.extractText(current);

        const mergedText = `${previousText}\n${currentText}`;

        // Replace last message with merged version
        merged[merged.length - 1] =
          currentType === "human"
            ? MessageBuilder.human(mergedText)
            : MessageBuilder.ai(mergedText);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Filter out messages by type
   */
  static filterOut(
    messages: BaseMessage[],
    type: "system" | "human" | "ai" | "tool"
  ): BaseMessage[] {
    return messages.filter(
      (msg) => MessageParser.getMessageType(msg) !== type
    );
  }

  /**
   * Extract all text from messages
   */
  static extractAllText(messages: BaseMessage[]): string {
    return messages.map((msg) => MessageParser.extractText(msg)).join("\n\n");
  }

  /**
   * Count tokens in conversation (estimated)
   * Uses rough approximation: 1 token ≈ 4 characters
   */
  static estimateTokens(messages: BaseMessage[]): number {
    const text = this.extractAllText(messages);
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate conversation to fit within token limit
   */
  static truncateToTokenLimit(
    messages: BaseMessage[],
    maxTokens: number
  ): BaseMessage[] {
    // Keep system messages
    const systemMessages = messages.filter(
      (msg) => MessageParser.getMessageType(msg) === "system"
    );

    const otherMessages = messages.filter(
      (msg) => MessageParser.getMessageType(msg) !== "system"
    );

    // Estimate system message tokens
    const systemTokens = this.estimateTokens(systemMessages);
    const availableTokens = maxTokens - systemTokens;

    // Add messages from the end until we hit the limit
    const truncated: BaseMessage[] = [];
    let currentTokens = 0;

    for (let i = otherMessages.length - 1; i >= 0; i--) {
      const msg = otherMessages[i];
      const msgTokens = this.estimateTokens([msg]);

      if (currentTokens + msgTokens <= availableTokens) {
        truncated.unshift(msg);
        currentTokens += msgTokens;
      } else {
        break;
      }
    }

    return [...systemMessages, ...truncated];
  }

  /**
   * Validate message sequence
   * Returns errors if conversation has invalid structure
   */
  static validateSequence(messages: BaseMessage[]): string[] {
    const errors: string[] = [];

    if (messages.length === 0) {
      return errors;
    }

    // Check for system message placement
    const systemMessageIndexes = messages
      .map((msg, idx) => (MessageParser.getMessageType(msg) === "system" ? idx : -1))
      .filter((idx) => idx !== -1);

    if (systemMessageIndexes.some((idx) => idx > 0)) {
      errors.push("System messages should appear at the beginning");
    }

    // Check for tool messages without corresponding AI messages
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (MessageParser.getMessageType(msg) === "tool") {
        // Look for preceding AI message with tool call
        let foundToolCall = false;
        for (let j = i - 1; j >= 0; j--) {
          const prevMsg = messages[j];
          if (MessageParser.hasToolCalls(prevMsg)) {
            foundToolCall = true;
            break;
          }
          if (MessageParser.getMessageType(prevMsg) === "human") {
            break;
          }
        }

        if (!foundToolCall) {
          errors.push(`Tool message at index ${i} has no corresponding tool call`);
        }
      }
    }

    return errors;
  }
}
