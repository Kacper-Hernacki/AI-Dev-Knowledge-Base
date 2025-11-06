import { describe, test, expect } from "vitest";
import z from "zod/v3";

describe("Agent Configuration", () => {
  describe("structured format schema", () => {
    const structuredFormat = z.object({
      title: z.string().describe("The title of the article"),
      subtitle: z.string().describe("The content of the article"),
      content: z.string().describe("The author of the article"),
      readingTime: z.number().describe("The reading time of the article in minutes"),
      date: z.string().describe("The date of the article"),
    });

    test("should validate correct data structure", () => {
      const validData = {
        title: "Machine Learning Benefits",
        subtitle: "Understanding the advantages of ML",
        content: "Machine learning offers numerous benefits including...",
        readingTime: 5,
        date: "2024-01-01",
      };

      expect(() => structuredFormat.parse(validData)).not.toThrow();
      const result = structuredFormat.parse(validData);
      expect(result).toEqual(validData);
    });

    test("should reject missing required fields", () => {
      const incompleteData = {
        title: "Test Title",
        // missing other required fields
      };

      expect(() => structuredFormat.parse(incompleteData)).toThrow();
    });

    test("should reject wrong data types", () => {
      const invalidData = {
        title: "Test Title",
        subtitle: "Test Subtitle",
        content: "Test Content",
        readingTime: "5 minutes", // should be number
        date: "2024-01-01",
      };

      expect(() => structuredFormat.parse(invalidData)).toThrow();
    });

    test("should have all required schema properties", () => {
      expect(structuredFormat.shape.title).toBeDefined();
      expect(structuredFormat.shape.subtitle).toBeDefined();
      expect(structuredFormat.shape.content).toBeDefined();
      expect(structuredFormat.shape.readingTime).toBeDefined();
      expect(structuredFormat.shape.date).toBeDefined();
    });
  });

  describe("agent imports", () => {
    test("should import tools successfully", async () => {
      const { search, getWeather } = await import("../tools.js");
      expect(search).toBeDefined();
      expect(getWeather).toBeDefined();
      expect(search.name).toBe("search");
      expect(getWeather.name).toBe("get_weather");
    });

    test("should import middlewares successfully", async () => {
      const {
        contextSchema,
        dynamicModelSelection,
        dynamicSystemPrompt,
        handleToolErrors,
      } = await import("../middlewares.js");

      expect(contextSchema).toBeDefined();
      expect(dynamicModelSelection).toBeDefined();
      expect(dynamicSystemPrompt).toBeDefined();
      expect(handleToolErrors).toBeDefined();
    });

    test("should import models successfully", async () => {
      const { basicModel, advancedModel } = await import("../models.js");
      expect(basicModel).toBeDefined();
      expect(advancedModel).toBeDefined();
    });
  });

  describe("agent message structure", () => {
    test("should validate message format", () => {
      const validMessage = {
        role: "user" as const,
        content: "Write a short article about the benefits of machine learning",
      };

      expect(validMessage.role).toBe("user");
      expect(typeof validMessage.content).toBe("string");
      expect(validMessage.content.length).toBeGreaterThan(0);
    });

    test("should validate context format", async () => {
      const { contextSchema } = await import("../middlewares.js");
      
      const validContextBeginner = { userRole: "beginner" as const };
      const validContextExpert = { userRole: "expert" as const };

      expect(() => contextSchema.parse(validContextBeginner)).not.toThrow();
      expect(() => contextSchema.parse(validContextExpert)).not.toThrow();
    });
  });
});
