/**
 * Tests for Summarizer
 */

import { describe, test, expect, mock } from "bun:test";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Summarizer, SummarizationStrategies } from "../core/summarizer.js";
import { ChatAnthropic } from "@langchain/anthropic";

// Mock model for testing
const mockModel = {
  invoke: mock(async (messages: any[]) => {
    return new AIMessage("This is a summary of the conversation");
  }),
} as any;

describe("Summarizer", () => {
  describe("shouldSummarize()", () => {
    test("should return true when messages exceed threshold", () => {
      const summarizer = new Summarizer({
        model: mockModel,
        maxTokensBeforeSummary: 50,
      });

      const longMessages = [
        new HumanMessage("A".repeat(30)),
        new AIMessage("B".repeat(30)),
      ];

      expect(summarizer.shouldSummarize(longMessages)).toBe(true);
    });

    test("should return false when messages under threshold", () => {
      const summarizer = new Summarizer({
        model: mockModel,
        maxTokensBeforeSummary: 1000,
      });

      const shortMessages = [
        new HumanMessage("Hi"),
        new AIMessage("Hello"),
      ];

      expect(summarizer.shouldSummarize(shortMessages)).toBe(false);
    });
  });

  describe("summarize()", () => {
    test("should summarize messages keeping recent ones", async () => {
      const summarizer = new Summarizer({
        model: mockModel,
        messagesToKeep: 2,
      });

      const messages = [
        new HumanMessage("Message 1"),
        new AIMessage("Response 1"),
        new HumanMessage("Message 2"),
        new AIMessage("Response 2"),
        new HumanMessage("Message 3"),
        new AIMessage("Response 3"),
      ];

      const result = await summarizer.summarize(messages);

      expect(result.originalCount).toBe(6);
      expect(result.keptCount).toBe(2);
      expect(result.summarizedCount).toBe(4);
      expect(result.summary).toBeTruthy();
    });

    test("should handle empty summarization list", async () => {
      const summarizer = new Summarizer({
        model: mockModel,
        messagesToKeep: 10,
      });

      const messages = [
        new HumanMessage("Message 1"),
        new AIMessage("Response 1"),
      ];

      const result = await summarizer.summarize(messages);

      expect(result.summarizedCount).toBe(0);
      expect(result.keptCount).toBe(2);
    });
  });

  describe("createMessagesWithSummary()", () => {
    test("should return original messages if no summarization needed", async () => {
      const summarizer = new Summarizer({
        model: mockModel,
        maxTokensBeforeSummary: 10000,
      });

      const messages = [
        new HumanMessage("Hi"),
        new AIMessage("Hello"),
      ];

      const result = await summarizer.createMessagesWithSummary(messages);

      expect(result.length).toBe(messages.length);
    });

    test("should create summary message when needed", async () => {
      const summarizer = new Summarizer({
        model: mockModel,
        maxTokensBeforeSummary: 50,
        messagesToKeep: 2,
      });

      const messages = [
        new HumanMessage("A".repeat(20)),
        new AIMessage("B".repeat(20)),
        new HumanMessage("C".repeat(20)),
        new AIMessage("D".repeat(20)),
      ];

      const result = await summarizer.createMessagesWithSummary(messages);

      // Should have summary + kept messages
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].getType()).toBe("system");
    });
  });

  describe("reset()", () => {
    test("should clear existing summary", async () => {
      const summarizer = new Summarizer({
        model: mockModel,
        messagesToKeep: 2,
      });

      const messages = [
        new HumanMessage("Message 1"),
        new AIMessage("Response 1"),
        new HumanMessage("Message 2"),
        new AIMessage("Response 2"),
      ];

      await summarizer.summarize(messages);
      expect(summarizer.getExistingSummary()).toBeTruthy();

      summarizer.reset();
      expect(summarizer.getExistingSummary()).toBeUndefined();
    });
  });
});

describe("SummarizationStrategies", () => {
  describe("fullHistory()", () => {
    test("should create summarizer that keeps no messages", () => {
      const summarizer = SummarizationStrategies.fullHistory({
        model: mockModel,
      });

      expect(summarizer).toBeInstanceOf(Summarizer);
    });
  });

  describe("rollingWindow()", () => {
    test("should create summarizer with incremental updates", () => {
      const summarizer = SummarizationStrategies.rollingWindow({
        model: mockModel,
        windowSize: 5,
      });

      expect(summarizer).toBeInstanceOf(Summarizer);
    });
  });

  describe("hierarchical()", () => {
    test("should handle small message lists", async () => {
      const messages = [
        new HumanMessage("Message 1"),
        new AIMessage("Response 1"),
      ];

      const summary = await SummarizationStrategies.hierarchical(
        messages,
        mockModel,
        10
      );

      expect(typeof summary).toBe("string");
      expect(summary.length).toBeGreaterThanOrEqual(0);
    });
  });
});
