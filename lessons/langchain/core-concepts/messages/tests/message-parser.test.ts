/// <reference path="./globals.d.ts" />

import { describe, test, expect } from "bun:test";
import {
  MessageBuilder,
  MessageParser
} from "../core/index.js";

describe("MessageParser", () => {
  describe("Text Extraction", () => {
    test("should extract text from simple string content", () => {
      const msg = MessageBuilder.human("Hello world");
      const text = MessageParser.extractText(msg);

      expect(text).toBe("Hello world");
    });

    test("should extract text from empty message", () => {
      const msg = MessageBuilder.human("");
      const text = MessageParser.extractText(msg);

      expect(text).toBe("");
    });

    test("should handle multimodal message text extraction", () => {
      const msg = MessageBuilder.withImage(
        "Describe this image",
        "https://example.com/img.jpg"
      );

      const text = MessageParser.extractText(msg);
      expect(text).toContain("Describe this image");
    });
  });

  describe("Content Block Extraction", () => {
    test("should extract content blocks from simple message", () => {
      const msg = MessageBuilder.human("Test");
      const blocks = MessageParser.extractContentBlocks(msg);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("text");
    });

    test("should extract multiple content blocks", () => {
      const msg = MessageBuilder.withImage(
        "Test",
        "https://example.com/img.jpg"
      );

      const blocks = MessageParser.extractContentBlocks(msg);
      expect(blocks.length).toBeGreaterThan(1);
    });
  });

  describe("Message Type Detection", () => {
    test("should detect system message", () => {
      const msg = MessageBuilder.system("System prompt");
      expect(MessageParser.getMessageType(msg)).toBe("system");
    });

    test("should detect human message", () => {
      const msg = MessageBuilder.human("User input");
      expect(MessageParser.getMessageType(msg)).toBe("human");
    });

    test("should detect AI message", () => {
      const msg = MessageBuilder.ai("AI response");
      expect(MessageParser.getMessageType(msg)).toBe("ai");
    });

    test("should detect tool message", () => {
      const msg = MessageBuilder.tool("Result", "call_123");
      expect(MessageParser.getMessageType(msg)).toBe("tool");
    });
  });

  describe("Multimodal Detection", () => {
    test("should detect non-multimodal message", () => {
      const msg = MessageBuilder.human("Just text");
      expect(MessageParser.isMultimodal(msg)).toBe(false);
    });

    test("should detect multimodal message with image", () => {
      const msg = MessageBuilder.withImage(
        "Text",
        "https://example.com/img.jpg"
      );
      expect(MessageParser.isMultimodal(msg)).toBe(true);
    });

    test("should detect multimodal message with PDF", () => {
      const msg = MessageBuilder.withPDF(
        "Text",
        "https://example.com/doc.pdf"
      );
      expect(MessageParser.isMultimodal(msg)).toBe(true);
    });
  });

  describe("Message Filtering", () => {
    test("should filter by type", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "System" },
        { role: "user", content: "User 1" },
        { role: "assistant", content: "AI 1" },
        { role: "user", content: "User 2" },
        { role: "assistant", content: "AI 2" }
      ]);

      const humanMessages = MessageParser.filterByType(messages, "human");
      expect(humanMessages).toHaveLength(2);

      const aiMessages = MessageParser.filterByType(messages, "ai");
      expect(aiMessages).toHaveLength(2);

      const systemMessages = MessageParser.filterByType(messages, "system");
      expect(systemMessages).toHaveLength(1);
    });
  });

  describe("Metadata Extraction", () => {
    test("should extract message ID", () => {
      const msg = MessageBuilder.humanWithMetadata("Test", {
        id: "msg_123"
      });

      expect(MessageParser.getMessageId(msg)).toBe("msg_123");
    });

    test("should extract message name", () => {
      const msg = MessageBuilder.humanWithMetadata("Test", {
        name: "alice"
      });

      expect(MessageParser.getMessageName(msg)).toBe("alice");
    });

    test("should return undefined for missing metadata", () => {
      const msg = MessageBuilder.human("Test");

      expect(MessageParser.getMessageId(msg)).toBeUndefined();
      expect(MessageParser.getMessageName(msg)).toBeUndefined();
    });
  });

  describe("Conversation Formatting", () => {
    test("should format conversation as text", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "Be helpful" },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" }
      ]);

      const formatted = MessageParser.formatConversation(messages);

      expect(formatted).toContain("[SYSTEM]");
      expect(formatted).toContain("[HUMAN]");
      expect(formatted).toContain("[AI]");
    });

    test("should format empty conversation", () => {
      const formatted = MessageParser.formatConversation([]);
      expect(formatted).toBe("");
    });
  });

  describe("Serialization", () => {
    test("should convert message to simple object", () => {
      const msg = MessageBuilder.humanWithMetadata("Test", {
        id: "msg_123",
        name: "alice"
      });

      const obj = MessageParser.toSimpleObject(msg);

      expect(obj.type).toBe("human");
      expect(obj.content).toBe("Test");
      expect(obj.id).toBe("msg_123");
      expect(obj.name).toBe("alice");
    });

    test("should convert array of messages", () => {
      const messages = MessageBuilder.conversation([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" }
      ]);

      const objects = MessageParser.toSimpleObjects(messages);

      expect(objects).toHaveLength(2);
      expect(objects[0].type).toBe("human");
      expect(objects[1].type).toBe("ai");
    });
  });

  describe("Tool Call Detection", () => {
    test("should detect no tool calls in regular message", () => {
      const msg = MessageBuilder.human("Test");
      expect(MessageParser.hasToolCalls(msg)).toBe(false);
    });
  });

  describe("Token Calculation", () => {
    test("should calculate total tokens from conversation", () => {
      const messages = MessageBuilder.conversation([
        { role: "user", content: "Test" },
        { role: "assistant", content: "Response" }
      ]);

      const usage = MessageParser.calculateTotalTokens(messages);

      expect(usage).toBeDefined();
      expect(usage.input_tokens).toBe(0); // No usage metadata in these messages
      expect(usage.output_tokens).toBe(0);
      expect(usage.total_tokens).toBe(0);
    });
  });

  describe("Extract All Text", () => {
    test("should extract all text from messages", () => {
      const messages = [
        MessageBuilder.system("System prompt"),
        MessageBuilder.human("User question"),
        MessageBuilder.ai("AI answer")
      ];

      const text1 = MessageParser.extractText(messages[0]);
      const text2 = MessageParser.extractText(messages[1]);
      const text3 = MessageParser.extractText(messages[2]);

      expect(text1).toBe("System prompt");
      expect(text2).toBe("User question");
      expect(text3).toBe("AI answer");
    });
  });
});
