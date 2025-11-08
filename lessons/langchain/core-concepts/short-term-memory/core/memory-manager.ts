/**
 * Memory Manager - Utilities for managing agent memory
 * Provides helper functions for common memory operations
 */

import { BaseMessage, RemoveMessage, trimMessages } from "@langchain/core/messages";
import { BaseCheckpointSaver } from "@langchain/langgraph";

/**
 * Memory configuration options
 */
export interface MemoryConfig {
  maxMessages?: number;
  maxTokens?: number;
  strategy?: "last" | "first";
  startOn?: "human" | "ai";
  endOn?: Array<"human" | "ai" | "tool">;
}

/**
 * Memory Manager class for common memory operations
 */
export class MemoryManager {
  /**
   * Trim messages based on configuration
   */
  static async trim(
    messages: BaseMessage[],
    config: MemoryConfig
  ): Promise<BaseMessage[]> {
    const {
      maxTokens = 1000,
      strategy = "last",
      startOn = "human",
      endOn = ["human", "tool"],
    } = config;

    return await trimMessages(messages, {
      maxTokens,
      strategy,
      startOn,
      endOn,
      tokenCounter: (msgs) => {
        // Simple character-based token counting
        return msgs.reduce((total, msg) => {
          const content =
            typeof msg.content === "string" ? msg.content : "";
          return total + content.length;
        }, 0);
      },
    });
  }

  /**
   * Delete messages by IDs
   */
  static deleteByIds(
    messages: BaseMessage[],
    idsToDelete: string[]
  ): RemoveMessage[] {
    return messages
      .filter((msg) => msg.id && idsToDelete.includes(msg.id))
      .map((msg) => new RemoveMessage({ id: msg.id! }));
  }

  /**
   * Delete messages by index range
   */
  static deleteByRange(
    messages: BaseMessage[],
    start: number,
    end?: number
  ): RemoveMessage[] {
    const endIndex = end ?? messages.length;
    return messages
      .slice(start, endIndex)
      .filter((msg) => msg.id)
      .map((msg) => new RemoveMessage({ id: msg.id! }));
  }

  /**
   * Delete messages by condition
   */
  static deleteByCondition(
    messages: BaseMessage[],
    condition: (msg: BaseMessage) => boolean
  ): RemoveMessage[] {
    return messages
      .filter((msg) => msg.id && condition(msg))
      .map((msg) => new RemoveMessage({ id: msg.id! }));
  }

  /**
   * Get message statistics
   */
  static getStats(messages: BaseMessage[]): {
    total: number;
    byType: Record<string, number>;
    totalLength: number;
  } {
    const byType: Record<string, number> = {};
    let totalLength = 0;

    for (const msg of messages) {
      const type = msg.getType();
      byType[type] = (byType[type] || 0) + 1;

      const content = typeof msg.content === "string" ? msg.content : "";
      totalLength += content.length;
    }

    return {
      total: messages.length,
      byType,
      totalLength,
    };
  }

  /**
   * Validate message sequence
   */
  static validateSequence(messages: BaseMessage[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (messages.length === 0) {
      return { valid: true, errors: [] };
    }

    // Check if starts with human or system
    const firstType = messages[0].getType();
    if (!["human", "system"].includes(firstType)) {
      errors.push(
        `First message should be 'human' or 'system', got '${firstType}'`
      );
    }

    // Check for orphaned tool calls
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.getType() === "ai" && "tool_calls" in msg) {
        const toolCalls = (msg as any).tool_calls || [];
        if (toolCalls.length > 0) {
          // Next message should be tool result
          const nextMsg = messages[i + 1];
          if (!nextMsg || nextMsg.getType() !== "tool") {
            errors.push(
              `Tool call at index ${i} not followed by tool result`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Filter messages by type
   */
  static filterByType(
    messages: BaseMessage[],
    types: string[]
  ): BaseMessage[] {
    return messages.filter((msg) => types.includes(msg.getType()));
  }

  /**
   * Get recent messages
   */
  static getRecent(messages: BaseMessage[], count: number): BaseMessage[] {
    return messages.slice(-count);
  }

  /**
   * Remove duplicate messages
   */
  static removeDuplicates(messages: BaseMessage[]): BaseMessage[] {
    const seen = new Set<string>();
    return messages.filter((msg) => {
      const content = typeof msg.content === "string" ? msg.content : "";
      const key = `${msg.getType()}:${content}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

/**
 * Checkpointer utilities
 */
export class CheckpointerUtils {
  /**
   * Create thread config
   */
  static createThreadConfig(threadId: string, userId?: string) {
    return {
      configurable: {
        thread_id: threadId,
        user_id: userId,
      },
    };
  }

  /**
   * Generate unique thread ID
   */
  static generateThreadId(prefix = "thread"): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if checkpointer is available
   */
  static isCheckpointerAvailable(
    checkpointer: BaseCheckpointSaver | undefined
  ): boolean {
    return checkpointer !== undefined && checkpointer !== null;
  }
}

/**
 * State management utilities
 */
export class StateUtils {
  /**
   * Merge state updates
   */
  static mergeState<T extends Record<string, any>>(
    current: T,
    update: Partial<T>
  ): T {
    return { ...current, ...update };
  }

  /**
   * Deep merge state (for nested objects)
   */
  static deepMergeState<T extends Record<string, any>>(
    current: T,
    update: Partial<T>
  ): T {
    const result = { ...current };

    for (const key in update) {
      const currentValue = current[key];
      const updateValue = update[key];

      if (
        typeof currentValue === "object" &&
        currentValue !== null &&
        !Array.isArray(currentValue) &&
        typeof updateValue === "object" &&
        updateValue !== null &&
        !Array.isArray(updateValue)
      ) {
        result[key] = this.deepMergeState(currentValue, updateValue);
      } else {
        result[key] = updateValue as T[Extract<keyof T, string>];
      }
    }

    return result;
  }

  /**
   * Validate state against schema
   */
  static validateState<T>(
    state: T,
    requiredFields: (keyof T)[]
  ): { valid: boolean; missing: (keyof T)[] } {
    const missing = requiredFields.filter((field) => !(field in state));

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}
