/// <reference path="./globals.d.ts" />

import { describe, test, expect } from "bun:test";
import {
  MessageBuilder,
  MessageParser,
  MultimodalMessageBuilder
} from "../core/index.js";
import { MIME_TYPES } from "../config/index.js";

describe("MessageBuilder", () => {
  describe("Basic Messages", () => {
    test("should create system message", () => {
      const msg = MessageBuilder.system("You are helpful");

      expect(msg).toBeDefined();
      expect(MessageParser.getMessageType(msg)).toBe("system");
      expect(MessageParser.extractText(msg)).toBe("You are helpful");
    });

    test("should create human message", () => {
      const msg = MessageBuilder.human("Hello");

      expect(msg).toBeDefined();
      expect(MessageParser.getMessageType(msg)).toBe("human");
      expect(MessageParser.extractText(msg)).toBe("Hello");
    });

    test("should create AI message", () => {
      const msg = MessageBuilder.ai("Hi there!");

      expect(msg).toBeDefined();
      expect(MessageParser.getMessageType(msg)).toBe("ai");
      expect(MessageParser.extractText(msg)).toBe("Hi there!");
    });

    test("should create human message with metadata", () => {
      const msg = MessageBuilder.humanWithMetadata("Hello", {
        name: "alice",
        id: "msg_123"
      });

      expect(msg).toBeDefined();
      expect(MessageParser.getMessageName(msg)).toBe("alice");
      expect(MessageParser.getMessageId(msg)).toBe("msg_123");
    });
  });

  describe("Tool Messages", () => {
    test("should create tool message", () => {
      const msg = MessageBuilder.tool(
        "Result data",
        "call_123",
        "my_tool"
      );

      expect(msg).toBeDefined();
      expect(MessageParser.getMessageType(msg)).toBe("tool");
      expect((msg as any).tool_call_id).toBe("call_123");
    });

    test("should create tool message with artifact", () => {
      const artifact = { doc_id: "123", score: 0.95 };
      const msg = MessageBuilder.toolWithArtifact(
        "Document content",
        "call_456",
        "search",
        artifact
      );

      expect(msg).toBeDefined();
      expect((msg as any).artifact).toEqual(artifact);
    });
  });

  describe("Multimodal Messages", () => {
    test("should create message with image URL", () => {
      const msg = MessageBuilder.withImage(
        "Describe this",
        "https://example.com/image.jpg"
      );

      expect(msg).toBeDefined();
      expect(MessageParser.isMultimodal(msg)).toBe(true);
    });

    test("should create message with base64 image", () => {
      const msg = MessageBuilder.withImageData(
        "What color?",
        "base64data",
        MIME_TYPES.IMAGE_JPEG
      );

      expect(msg).toBeDefined();
      expect(MessageParser.isMultimodal(msg)).toBe(true);
    });

    test("should create message with PDF", () => {
      const msg = MessageBuilder.withPDF(
        "Summarize this",
        "https://example.com/doc.pdf"
      );

      expect(msg).toBeDefined();
      expect(MessageParser.isMultimodal(msg)).toBe(true);
    });

    test("should create message with audio", () => {
      const msg = MessageBuilder.withAudio(
        "Transcribe this",
        "audiobase64data",
        MIME_TYPES.AUDIO_MPEG
      );

      expect(msg).toBeDefined();
      expect(MessageParser.isMultimodal(msg)).toBe(true);
    });
  });

  describe("Conversation Creation", () => {
    test("should create conversation from array", () => {
      const messages = MessageBuilder.conversation([
        { role: "system", content: "You are helpful" },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" }
      ]);

      expect(messages).toHaveLength(3);
      expect(MessageParser.getMessageType(messages[0])).toBe("system");
      expect(MessageParser.getMessageType(messages[1])).toBe("human");
      expect(MessageParser.getMessageType(messages[2])).toBe("ai");
    });

    test("should create from chat format", () => {
      const messages = MessageBuilder.fromChatFormat([
        { role: "system", content: "Be helpful" },
        { role: "user", content: "Hi", name: "alice" }
      ]);

      expect(messages).toHaveLength(2);
      expect(MessageParser.getMessageName(messages[1])).toBe("alice");
    });

    test("should throw on unknown role", () => {
      expect(() => {
        MessageBuilder.conversation([
          { role: "unknown" as any, content: "test" }
        ]);
      }).toThrow();
    });
  });

  describe("MultimodalMessageBuilder", () => {
    test("should build message with multiple content types", () => {
      const msg = new MultimodalMessageBuilder()
        .addText("Check this:")
        .addImageUrl("https://example.com/img.jpg")
        .addPDF("https://example.com/doc.pdf")
        .build();

      expect(msg).toBeDefined();
      expect(MessageParser.isMultimodal(msg)).toBe(true);

      const blocks = MessageParser.extractContentBlocks(msg);
      expect(blocks.length).toBeGreaterThanOrEqual(3);
    });

    test("should throw when building with no content", () => {
      const builder = new MultimodalMessageBuilder();

      expect(() => builder.build()).toThrow();
    });

    test("should clear content blocks", () => {
      const builder = new MultimodalMessageBuilder()
        .addText("Test")
        .clear();

      expect(() => builder.build()).toThrow();
    });

    test("should add all content types", () => {
      const builder = new MultimodalMessageBuilder();

      builder
        .addText("text")
        .addImageUrl("https://img.jpg")
        .addImageData("base64", MIME_TYPES.IMAGE_PNG)
        .addPDF("https://doc.pdf", "doc.pdf")
        .addAudio("audiodata", MIME_TYPES.AUDIO_MPEG)
        .addVideo("videodata", MIME_TYPES.VIDEO_MP4);

      const msg = builder.build();
      expect(msg).toBeDefined();

      const blocks = MessageParser.extractContentBlocks(msg);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });
});
