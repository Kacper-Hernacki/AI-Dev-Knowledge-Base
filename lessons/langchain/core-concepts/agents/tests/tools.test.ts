/// <reference path="./globals.d.ts" />

import { search, deepResearch } from "../core/tools/index.js";

describe("Agent Tools", () => {
  describe("search tool", () => {
    test("should have correct name and description", () => {
      expect(search.name).toBe("search");
      expect(search.description).toBe(
        "Search for current information on any topic. Use this when you need up-to-date information."
      );
    });

    test("should return search results for a query", async () => {
      const result = await search.invoke({ query: "LangChain framework" });
      expect(result).toContain('Search results for "LangChain framework"');
    });

    test("should handle different queries", async () => {
      const testQueries = ["AI", "machine learning", "test query"];

      for (const query of testQueries) {
        const result = await search.invoke({ query });
        expect(result).toContain(`Search results for "${query}"`);
      }
    });

    test("should have valid schema", () => {
      expect(search.schema).toBeDefined();
      expect(search.schema.shape.query).toBeDefined();
    });

    test("should validate schema with valid input", () => {
      const validInput = { query: "test" };
      expect(() => search.schema.parse(validInput)).not.toThrow();
    });

    test("should reject invalid schema input", () => {
      const invalidInput = { query: 123 }; // should be string
      expect(() => search.schema.parse(invalidInput)).toThrow();
    });
  });

  describe("deepResearch tool", () => {
    test("should have correct name and description", () => {
      expect(deepResearch.name).toBe("deep_research");
      expect(deepResearch.description).toBe(
        "Conduct comprehensive research and analysis on complex topics. Use when you need detailed, multi-faceted insights beyond basic search."
      );
    });

    test("should return research analysis for a topic", async () => {
      const result = await deepResearch.invoke({
        topic: "machine learning",
        focus: "applications",
      });
      expect(result).toContain(
        "Comprehensive analysis of machine learning reveals multiple key insights:"
      );
      expect(result).toContain("applications");
    });

    test("should handle different topics", async () => {
      const testTopics = ["AI", "blockchain", "quantum computing"];

      for (const topic of testTopics) {
        const result = await deepResearch.invoke({ topic, focus: "applications" });
        expect(result).toContain(`Comprehensive analysis of ${topic} reveals`);
      }
    });

    test("should have valid schema", () => {
      expect(deepResearch.schema).toBeDefined();
      expect(deepResearch.schema.shape.topic).toBeDefined();
      expect(deepResearch.schema.shape.focus).toBeDefined();
    });

    test("should validate schema with valid input", () => {
      const validInput = { topic: "AI", focus: "ethics" };
      expect(() => deepResearch.schema.parse(validInput)).not.toThrow();
    });

    test("should validate schema with focus parameter", () => {
      const validInput = { topic: "AI", focus: "applications" };
      expect(() => deepResearch.schema.parse(validInput)).not.toThrow();
    });

    test("should reject invalid schema input", () => {
      const invalidInput = { topic: 123 }; // should be string
      expect(() => deepResearch.schema.parse(invalidInput)).toThrow();
    });
  });
});
