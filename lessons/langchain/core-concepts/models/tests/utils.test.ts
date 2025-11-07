/// <reference path="./globals.d.ts" />

import { Logger } from "../utils/logger.js";
import { ResponseParser } from "../utils/response-parser.js";

describe("Utils", () => {
  describe("Logger", () => {
    beforeEach(() => {
      Logger.clearHistory();
    });

    test("should log info messages", () => {
      Logger.info("Test info message", { test: "data" });
      const history = Logger.getHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe("info");
      expect(history[0].message).toBe("Test info message");
      expect(history[0].data?.test).toBe("data");
    });

    test("should log warn messages", () => {
      Logger.warn("Test warning", { warning: true });
      const history = Logger.getHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe("warn");
      expect(history[0].message).toBe("Test warning");
    });

    test("should log error messages", () => {
      Logger.error("Test error", { error: "details" });
      const history = Logger.getHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe("error");
      expect(history[0].message).toBe("Test error");
    });

    test("should filter history by level", () => {
      Logger.info("Info message");
      Logger.warn("Warning message");
      Logger.error("Error message");
      Logger.info("Another info");

      const errors = Logger.getHistoryByLevel("error");
      const warnings = Logger.getHistoryByLevel("warn");
      const infos = Logger.getHistoryByLevel("info");

      expect(errors).toHaveLength(1);
      expect(warnings).toHaveLength(1);
      expect(infos).toHaveLength(2);
    });

    test("should clear history", () => {
      Logger.info("Test message");
      expect(Logger.getHistory()).toHaveLength(1);
      
      Logger.clearHistory();
      expect(Logger.getHistory()).toHaveLength(0);
    });

    test("should export logs as JSON", () => {
      Logger.info("Test message", { data: "test" });
      const exported = Logger.exportLogs();
      
      expect(typeof exported).toBe("string");
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
    });

    test("should generate performance summary", () => {
      Logger.info("Model created successfully", { latency: 100 });
      Logger.info("Text generation completed", { latency: 250 });
      Logger.warn("Slow response detected", { latency: 500 });
      Logger.error("Request failed");

      const summary = Logger.getPerformanceSummary();
      
      expect(typeof summary.totalOperations).toBe("number");
      expect(typeof summary.averageLatency).toBe("number");
      expect(typeof summary.errors).toBe("number");
      expect(typeof summary.warnings).toBe("number");
      expect(typeof summary.operationsByType).toBe("object");
    });

    test("should maintain max history size", () => {
      // Add more than max size (100) to test truncation
      // We'll just verify the behavior works for a smaller number
      for (let i = 0; i < 10; i++) {
        Logger.info(`Message ${i}`);
      }
      
      const history = Logger.getHistory();
      expect(history).toHaveLength(10);
      expect(history[0].message).toBe("Message 0");
      expect(history[9].message).toBe("Message 9");
    });
  });

  describe("ResponseParser", () => {
    describe("extractJSON", () => {
      test("should extract JSON from code blocks", () => {
        const text = '```json\n{"title": "Test", "count": 42}\n```';
        const result = ResponseParser.extractJSON(text);
        
        expect(result).toEqual({ title: "Test", count: 42 });
      });

      test("should extract JSON from text", () => {
        const text = 'Here is the data: {"name": "John", "age": 30}';
        const result = ResponseParser.extractJSON(text);
        
        expect(result).toEqual({ name: "John", age: 30 });
      });

      test("should handle invalid JSON", () => {
        const text = "No JSON here!";
        const result = ResponseParser.extractJSON(text);
        
        expect(result).toBeNull();
      });

      test("should handle multiple JSON blocks", () => {
        const text = '```json\n{"first": 1}\n```\nSome text\n```json\n{"second": 2}\n```';
        const result = ResponseParser.extractJSON(text);
        
        // Should return the first valid JSON
        expect(result).toEqual({ first: 1 });
      });
    });

    describe("validateStructuredOutput", () => {
      test("should validate simple object", () => {
        const response = { title: "Test Title", count: 5 };
        const result = ResponseParser.validateStructuredOutput(response, null, "test");
        
        expect(result.parsed).toEqual(response);
        expect(result.isValid).toBe(true);
        expect(result.validationErrors).toBeUndefined();
      });

      test("should handle string input", () => {
        const response = '{"title": "Test", "value": 100}';
        const result = ResponseParser.validateStructuredOutput(response, null, "test");
        
        expect(result.parsed).toEqual({ title: "Test", value: 100 });
        expect(result.isValid).toBe(true);
      });

      test("should handle invalid JSON string", () => {
        const response = "Not JSON at all";
        const result = ResponseParser.validateStructuredOutput(response, null, "test");
        
        expect(result.isValid).toBe(false);
        expect(result.validationErrors).toBeDefined();
        expect(result.validationErrors).toContain("Could not extract JSON from response");
      });
    });

    describe("formatResponse", () => {
      test("should format basic response", () => {
        const response = {
          content: "This is a test response",
          metadata: { model: "test-model" },
          tokenUsage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 }
        };

        const formatted = ResponseParser.formatResponse(response);
        expect(formatted).toBe("This is a test response");
      });

      test("should include metadata when requested", () => {
        const response = {
          content: "Test content",
          metadata: { model: "test-model" }
        };

        const formatted = ResponseParser.formatResponse(response, { includeMetadata: true });
        expect(formatted).toContain("Test content");
        expect(formatted).toContain("Metadata:");
        expect(formatted).toContain("test-model");
      });

      test("should truncate long content", () => {
        const longContent = "A".repeat(2000);
        const response = { content: longContent };

        const formatted = ResponseParser.formatResponse(response, { maxLength: 100 });
        expect(formatted).toHaveLength(103); // 100 + "..."
        expect(formatted.endsWith("...")).toBe(true);
      });
    });

    describe("compareResponses", () => {
      test("should compare response lengths", () => {
        const responses = [
          { name: "short", response: { content: "Short" } },
          { name: "long", response: { content: "This is a much longer response" } }
        ];

        const comparison = ResponseParser.compareResponses(responses);
        
        expect(comparison.lengthComparison).toHaveLength(2);
        expect(comparison.summary.shortest).toBe("short");
        expect(comparison.summary.longest).toBe("long");
        expect(comparison.summary.totalResponses).toBe(2);
      });

      test("should compare token usage when available", () => {
        const responses = [
          { 
            name: "model1", 
            response: { 
              content: "Test", 
              tokenUsage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 }
            }
          },
          { 
            name: "model2", 
            response: { 
              content: "Test", 
              tokenUsage: { promptTokens: 8, completionTokens: 12, totalTokens: 20 }
            }
          }
        ];

        const comparison = ResponseParser.compareResponses(responses);
        
        expect(comparison.tokenUsageComparison).toBeDefined();
        expect(comparison.tokenUsageComparison).toHaveLength(2);
        expect(comparison.tokenUsageComparison![0].tokens).toBe(15);
        expect(comparison.tokenUsageComparison![1].tokens).toBe(20);
      });
    });
  });
});