/// <reference path="./globals.d.ts" />

import { describe, test, expect, beforeEach } from "bun:test";
import {
  MessageBuilder,
  MessageService,
  MessageParser,
  ConversationHistory
} from "../core/index.js";

describe("MessageService", () => {
  describe("Conversation Creation", () => {
    test("should create conversation from exchanges", () => {
      const messages = MessageService.createConversation(
        [
          { user: "Hello", assistant: "Hi!" },
          { user: "How are you?", assistant: "I'm good!" }
        ],
        "Be helpful"
      );

      expect(messages).toHaveLength(5); // 1 system + 4 messages
      expect(MessageParser.getMessageType(messages[0])).toBe("system");
    });

    test("should create conversation without system prompt", () => {
      const messages = MessageService.createConversation([
        { user: "Hello", assistant: "Hi!" }
      ]);

      expect(messages).toHaveLength(2);
      expect(MessageParser.getMessageType(messages[0])).toBe("human");
    });
  });

  describe("Message Addition", () => {
    test("should add user message", () => {
      const initial = [MessageBuilder.system("Be helpful")];
      const updated = MessageService.addUserMessage(initial, "Hello");

      expect(updated).toHaveLength(2);
      expect(MessageParser.getMessageType(updated[1])).toBe("human");
    });

    test("should add AI message", () => {
      const initial = [MessageBuilder.human("Hello")];
      const updated = MessageService.addAIMessage(initial, "Hi!");

      expect(updated).toHaveLength(2);
      expect(MessageParser.getMessageType(updated[1])).toBe("ai");
    });

    test("should not mutate original array", () => {
      const initial = [MessageBuilder.system("Test")];
      const updated = MessageService.addUserMessage(initial, "Hello");

      expect(initial).toHaveLength(1);
      expect(updated).toHaveLength(2);
    });
  });

  describe("Context Extraction", () => {
    test("should get recent context", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "Be helpful" },
        { role: "user", content: "Q1" },
        { role: "assistant", content: "A1" },
        { role: "user", content: "Q2" },
        { role: "assistant", content: "A2" },
        { role: "user", content: "Q3" },
        { role: "assistant", content: "A3" }
      ]);

      const recent = MessageService.getRecentContext(messages, 2);

      // Should have system + last 2 exchanges (4 messages)
      expect(recent.length).toBeLessThanOrEqual(5);
      expect(MessageParser.getMessageType(recent[0])).toBe("system");
    });
  });

  describe("Conversation Stats", () => {
    test("should calculate conversation stats", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "Prompt" },
        { role: "user", content: "Q" },
        { role: "assistant", content: "A" }
      ]);

      const stats = MessageService.getConversationStats(messages);

      expect(stats.totalMessages).toBe(3);
      expect(stats.byType.system).toBe(1);
      expect(stats.byType.human).toBe(1);
      expect(stats.byType.ai).toBe(1);
      expect(stats.hasMultimodal).toBe(false);
      expect(stats.hasToolCalls).toBe(false);
    });

    test("should detect multimodal in stats", () => {
      const messages = [
        MessageBuilder.withImage("Test", "https://example.com/img.jpg")
      ];

      const stats = MessageService.getConversationStats(messages);
      expect(stats.hasMultimodal).toBe(true);
    });
  });

  describe("Format Conversion", () => {
    test("should convert to chat format", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "System" },
        { role: "user", content: "User" },
        { role: "assistant", content: "Assistant" }
      ]);

      const chatFormat = MessageService.toChatFormat(messages);

      expect(chatFormat).toHaveLength(3);
      expect(chatFormat[0].role).toBe("system");
      expect(chatFormat[1].role).toBe("user");
      expect(chatFormat[2].role).toBe("assistant");
    });

    test("should include name in chat format", () => {
      const messages = [
        MessageBuilder.humanWithMetadata("Hello", { name: "alice" })
      ];

      const chatFormat = MessageService.toChatFormat(messages);

      expect(chatFormat[0].name).toBe("alice");
    });
  });

  describe("Message Merging", () => {
    test("should merge consecutive messages of same type", () => {
      const messages = [
        MessageBuilder.human("Hello"),
        MessageBuilder.human("How are you?"),
        MessageBuilder.ai("I'm good"),
        MessageBuilder.ai("Thanks!")
      ];

      const merged = MessageService.mergeConsecutive(messages);

      expect(merged).toHaveLength(2);
      expect(MessageParser.extractText(merged[0])).toContain("Hello");
      expect(MessageParser.extractText(merged[0])).toContain("How are you?");
    });

    test("should not merge system messages", () => {
      const messages = [
        MessageBuilder.system("First"),
        MessageBuilder.system("Second")
      ];

      const merged = MessageService.mergeConsecutive(messages);

      expect(merged).toHaveLength(2);
    });

    test("should not merge different types", () => {
      const messages = [
        MessageBuilder.human("Hello"),
        MessageBuilder.ai("Hi")
      ];

      const merged = MessageService.mergeConsecutive(messages);

      expect(merged).toHaveLength(2);
    });
  });

  describe("Filtering", () => {
    test("should filter out message type", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "System" },
        { role: "user", content: "User" },
        { role: "assistant", content: "AI" }
      ]);

      const filtered = MessageService.filterOut(messages, "system");

      expect(filtered).toHaveLength(2);
      expect(MessageParser.getMessageType(filtered[0])).not.toBe("system");
    });
  });

  describe("Text Extraction", () => {
    test("should extract all text from messages", () => {
      const messages = MessageBuilder.conversation([
        { role: "user", content: "Question" },
        { role: "assistant", content: "Answer" }
      ]);

      const text = MessageService.extractAllText(messages);

      expect(text).toContain("Question");
      expect(text).toContain("Answer");
    });
  });

  describe("Token Estimation", () => {
    test("should estimate tokens", () => {
      const messages = MessageBuilder.conversation([
        { role: "user", content: "This is a test message" }
      ]);

      const tokens = MessageService.estimateTokens(messages);

      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe("Token Truncation", () => {
    test("should truncate to token limit", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "System prompt with some longer content to make it realistic" },
        { role: "user", content: "This is a longer question that will take up more tokens in the conversation history" },
        { role: "assistant", content: "This is a longer answer that provides detailed information and explanations" },
        { role: "user", content: "Another long question with multiple sentences and complex thoughts" },
        { role: "assistant", content: "Another detailed answer with comprehensive information and context" },
        { role: "user", content: "Yet another question with substantial content to increase token count" },
        { role: "assistant", content: "Final answer with lots of detail and comprehensive explanations" }
      ]);

      const truncated = MessageService.truncateToTokenLimit(messages, 50);

      // Should keep system message and truncate others
      expect(truncated.length).toBeLessThan(messages.length);
      expect(MessageParser.getMessageType(truncated[0])).toBe("system");
    });

    test("should keep system messages when truncating", () => {
      const messages = [
        MessageBuilder.system("Important system message"),
        ...Array(10).fill(null).map(() => MessageBuilder.human("Test"))
      ];

      const truncated = MessageService.truncateToTokenLimit(messages, 30);

      const systemMessages = truncated.filter(
        (msg) => MessageParser.getMessageType(msg) === "system"
      );
      expect(systemMessages.length).toBeGreaterThan(0);
    });
  });

  describe("Validation", () => {
    test("should validate valid sequence", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "System" },
        { role: "user", content: "User" },
        { role: "assistant", content: "AI" }
      ]);

      const errors = MessageService.validateSequence(messages);
      expect(errors).toHaveLength(0);
    });

    test("should detect system message in wrong position", () => {
      const messages = [
        MessageBuilder.human("User"),
        MessageBuilder.system("System")
      ];

      const errors = MessageService.validateSequence(messages);
      expect(errors.length).toBeGreaterThan(0);
    });

    test("should validate empty conversation", () => {
      const errors = MessageService.validateSequence([]);
      expect(errors).toHaveLength(0);
    });
  });
});

describe("ConversationHistory", () => {
  let history: ConversationHistory;

  beforeEach(() => {
    history = new ConversationHistory();
  });

  describe("Basic Operations", () => {
    test("should start empty", () => {
      expect(history.count()).toBe(0);
    });

    test("should add message", () => {
      history.add(MessageBuilder.human("Test"));
      expect(history.count()).toBe(1);
    });

    test("should add multiple messages", () => {
      const messages = [
        MessageBuilder.human("Q1"),
        MessageBuilder.ai("A1")
      ];

      history.addMany(messages);
      expect(history.count()).toBe(2);
    });

    test("should get all messages", () => {
      history.add(MessageBuilder.human("Test"));
      const all = history.getAll();

      expect(all).toHaveLength(1);
    });

    test("should clear messages", () => {
      history.add(MessageBuilder.human("Test"));
      history.clear();

      expect(history.count()).toBe(0);
    });
  });

  describe("Max Messages Limit", () => {
    test("should respect max messages limit", () => {
      const limitedHistory = new ConversationHistory([], 3);

      limitedHistory.add(MessageBuilder.human("1"));
      limitedHistory.add(MessageBuilder.ai("2"));
      limitedHistory.add(MessageBuilder.human("3"));
      limitedHistory.add(MessageBuilder.ai("4"));

      expect(limitedHistory.count()).toBeLessThanOrEqual(3);
    });

    test("should keep system messages when trimming", () => {
      const limitedHistory = new ConversationHistory([], 3);

      limitedHistory.add(MessageBuilder.system("System"));
      limitedHistory.add(MessageBuilder.human("1"));
      limitedHistory.add(MessageBuilder.ai("2"));
      limitedHistory.add(MessageBuilder.human("3"));

      const all = limitedHistory.getAll();
      const systemMsgs = all.filter(
        (msg) => MessageParser.getMessageType(msg) === "system"
      );

      expect(systemMsgs.length).toBeGreaterThan(0);
    });
  });

  describe("Retrieval Operations", () => {
    beforeEach(() => {
      history.add(MessageBuilder.system("System"));
      history.add(MessageBuilder.human("Q1"));
      history.add(MessageBuilder.ai("A1"));
      history.add(MessageBuilder.human("Q2"));
      history.add(MessageBuilder.ai("A2"));
    });

    test("should get last N messages", () => {
      const last2 = history.getLast(2);
      expect(last2).toHaveLength(2);
    });

    test("should get messages by type", () => {
      const humanMsgs = history.getByType("human");
      expect(humanMsgs).toHaveLength(2);

      const aiMsgs = history.getByType("ai");
      expect(aiMsgs).toHaveLength(2);

      const systemMsgs = history.getByType("system");
      expect(systemMsgs).toHaveLength(1);
    });
  });

  describe("Formatting", () => {
    test("should format conversation", () => {
      history.add(MessageBuilder.human("Hello"));
      history.add(MessageBuilder.ai("Hi"));

      const formatted = history.format();

      expect(formatted).toContain("[HUMAN]");
      expect(formatted).toContain("[AI]");
    });

    test("should export to JSON", () => {
      history.add(MessageBuilder.human("Test"));

      const json = history.toJSON();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(1);
    });
  });

  describe("Usage Tracking", () => {
    test("should get total usage", () => {
      history.add(MessageBuilder.human("Test"));

      const usage = history.getTotalUsage();

      expect(usage).toBeDefined();
      expect(usage.total_tokens).toBeDefined();
    });
  });

  describe("Initialization", () => {
    test("should initialize with existing messages", () => {
      const initial = [
        MessageBuilder.human("Hello"),
        MessageBuilder.ai("Hi")
      ];

      const newHistory = new ConversationHistory(initial);

      expect(newHistory.count()).toBe(2);
    });
  });
});
