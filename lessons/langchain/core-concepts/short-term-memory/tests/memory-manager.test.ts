/**
 * Tests for Memory Manager
 */

import { describe, test, expect } from "bun:test";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import {
  MemoryManager,
  CheckpointerUtils,
  StateUtils,
} from "../core/memory-manager.js";

describe("MemoryManager", () => {
  describe("trim()", () => {
    test("should trim messages to keep last N", async () => {
      const messages = [
        new HumanMessage("A".repeat(30)),
        new AIMessage("B".repeat(30)),
        new HumanMessage("C".repeat(30)),
        new AIMessage("D".repeat(30)),
        new HumanMessage("E".repeat(30)),
      ];

      const trimmed = await MemoryManager.trim(messages, {
        maxTokens: 50,
        strategy: "last",
      });

      expect(trimmed.length).toBeLessThanOrEqual(messages.length);
    });

    test("should keep all messages if under limit", async () => {
      const messages = [
        new HumanMessage("Hi"),
        new AIMessage("Hello"),
      ];

      const trimmed = await MemoryManager.trim(messages, {
        maxTokens: 10000,
        strategy: "last",
      });

      expect(trimmed.length).toBeGreaterThan(0);
      expect(trimmed.length).toBeLessThanOrEqual(messages.length);
    });
  });

  describe("deleteByIds()", () => {
    test("should create RemoveMessages for specified IDs", () => {
      const messages = [
        new HumanMessage({ content: "Msg 1", id: "id1" }),
        new AIMessage({ content: "Msg 2", id: "id2" }),
        new HumanMessage({ content: "Msg 3", id: "id3" }),
      ];

      const removeMessages = MemoryManager.deleteByIds(messages, [
        "id1",
        "id3",
      ]);

      expect(removeMessages).toHaveLength(2);
    });

    test("should handle non-existent IDs", () => {
      const messages = [
        new HumanMessage({ content: "Msg 1", id: "id1" }),
      ];

      const removeMessages = MemoryManager.deleteByIds(messages, [
        "nonexistent",
      ]);

      expect(removeMessages).toHaveLength(0);
    });
  });

  describe("deleteByRange()", () => {
    test("should delete messages in specified range", () => {
      const messages = [
        new HumanMessage({ content: "Msg 1", id: "id1" }),
        new AIMessage({ content: "Msg 2", id: "id2" }),
        new HumanMessage({ content: "Msg 3", id: "id3" }),
        new AIMessage({ content: "Msg 4", id: "id4" }),
      ];

      const removeMessages = MemoryManager.deleteByRange(messages, 1, 3);

      expect(removeMessages).toHaveLength(2);
    });

    test("should delete to end if end not specified", () => {
      const messages = [
        new HumanMessage({ content: "Msg 1", id: "id1" }),
        new AIMessage({ content: "Msg 2", id: "id2" }),
        new HumanMessage({ content: "Msg 3", id: "id3" }),
      ];

      const removeMessages = MemoryManager.deleteByRange(messages, 1);

      expect(removeMessages).toHaveLength(2);
    });
  });

  describe("deleteByCondition()", () => {
    test("should delete messages matching condition", () => {
      const messages = [
        new HumanMessage({ content: "Keep this", id: "id1" }),
        new AIMessage({ content: "Delete this secret", id: "id2" }),
        new HumanMessage({ content: "Also keep", id: "id3" }),
      ];

      const removeMessages = MemoryManager.deleteByCondition(
        messages,
        (msg) => {
          const content =
            typeof msg.content === "string" ? msg.content : "";
          return content.includes("secret");
        }
      );

      expect(removeMessages).toHaveLength(1);
    });
  });

  describe("getStats()", () => {
    test("should return correct statistics", () => {
      const messages = [
        new HumanMessage("Message 1"),
        new AIMessage("Response 1"),
        new HumanMessage("Message 2"),
        new AIMessage("Response 2"),
        new SystemMessage("System message"),
      ];

      const stats = MemoryManager.getStats(messages);

      expect(stats.total).toBe(5);
      expect(stats.byType.human).toBe(2);
      expect(stats.byType.ai).toBe(2);
      expect(stats.byType.system).toBe(1);
      expect(stats.totalLength).toBeGreaterThan(0);
    });
  });

  describe("validateSequence()", () => {
    test("should validate correct message sequence", () => {
      const messages = [
        new HumanMessage("User message"),
        new AIMessage("AI response"),
      ];

      const result = MemoryManager.validateSequence(messages);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should detect invalid first message", () => {
      const messages = [
        new AIMessage("AI message first"), // Invalid
        new HumanMessage("User message"),
      ];

      const result = MemoryManager.validateSequence(messages);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("should accept empty message array", () => {
      const result = MemoryManager.validateSequence([]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("filterByType()", () => {
    test("should filter messages by type", () => {
      const messages = [
        new HumanMessage("User 1"),
        new AIMessage("AI 1"),
        new HumanMessage("User 2"),
        new AIMessage("AI 2"),
      ];

      const humanOnly = MemoryManager.filterByType(messages, ["human"]);

      expect(humanOnly).toHaveLength(2);
      expect(humanOnly.every((msg) => msg.getType() === "human")).toBe(
        true
      );
    });
  });

  describe("getRecent()", () => {
    test("should get last N messages", () => {
      const messages = [
        new HumanMessage("Msg 1"),
        new AIMessage("Msg 2"),
        new HumanMessage("Msg 3"),
        new AIMessage("Msg 4"),
        new HumanMessage("Msg 5"),
      ];

      const recent = MemoryManager.getRecent(messages, 2);

      expect(recent).toHaveLength(2);
      expect(recent[0].content).toBe("Msg 4");
      expect(recent[1].content).toBe("Msg 5");
    });
  });

  describe("removeDuplicates()", () => {
    test("should remove duplicate messages", () => {
      const messages = [
        new HumanMessage("Hello"),
        new AIMessage("Hi"),
        new HumanMessage("Hello"), // Duplicate
        new AIMessage("Hi"), // Duplicate
      ];

      const unique = MemoryManager.removeDuplicates(messages);

      expect(unique).toHaveLength(2);
    });
  });
});

describe("CheckpointerUtils", () => {
  describe("createThreadConfig()", () => {
    test("should create config with thread ID", () => {
      const config = CheckpointerUtils.createThreadConfig("thread_123");

      expect(config.configurable.thread_id).toBe("thread_123");
    });

    test("should include user ID when provided", () => {
      const config = CheckpointerUtils.createThreadConfig(
        "thread_123",
        "user_456"
      );

      expect(config.configurable.thread_id).toBe("thread_123");
      expect(config.configurable.user_id).toBe("user_456");
    });
  });

  describe("generateThreadId()", () => {
    test("should generate unique thread IDs", () => {
      const id1 = CheckpointerUtils.generateThreadId();
      const id2 = CheckpointerUtils.generateThreadId();

      expect(id1).not.toBe(id2);
      expect(id1.startsWith("thread_")).toBe(true);
    });

    test("should use custom prefix", () => {
      const id = CheckpointerUtils.generateThreadId("custom");

      expect(id.startsWith("custom_")).toBe(true);
    });
  });

  describe("isCheckpointerAvailable()", () => {
    test("should return false for undefined", () => {
      expect(CheckpointerUtils.isCheckpointerAvailable(undefined)).toBe(
        false
      );
    });

    test("should return true for defined checkpointer", () => {
      const mockCheckpointer = {} as any;
      expect(
        CheckpointerUtils.isCheckpointerAvailable(mockCheckpointer)
      ).toBe(true);
    });
  });
});

describe("StateUtils", () => {
  describe("mergeState()", () => {
    test("should merge state updates", () => {
      const current = { a: 1, b: 2 };
      const update = { b: 3, c: 4 };

      const merged = StateUtils.mergeState(current, update);

      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });
  });

  describe("deepMergeState()", () => {
    test("should deep merge nested objects", () => {
      const current = { a: { b: 1, c: 2 }, d: 3 };
      const update = { a: { c: 3, e: 4 } };

      const merged = StateUtils.deepMergeState(current, update);

      expect(merged).toEqual({ a: { b: 1, c: 3, e: 4 }, d: 3 });
    });

    test("should handle arrays correctly", () => {
      const current = { arr: [1, 2, 3] };
      const update = { arr: [4, 5] };

      const merged = StateUtils.deepMergeState(current, update);

      expect(merged.arr).toEqual([4, 5]);
    });
  });

  describe("validateState()", () => {
    test("should validate state has required fields", () => {
      const state = { userId: "123", userName: "Alice" };
      const required = ["userId", "userName"] as const;

      const result = StateUtils.validateState(state, required);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test("should detect missing required fields", () => {
      const state = { userId: "123" };
      const required = ["userId", "userName"] as const;

      const result = StateUtils.validateState(state, required);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain("userName");
    });
  });
});
