/// <reference path="./globals.d.ts" />

import { 
  AgentFactory, 
  AgentService, 
  articleSchema,
  USER_ROLES,
  ResponseParser
} from "../index.js";

describe("Agent Configuration", () => {
  describe("structured format schema", () => {
    const structuredFormat = articleSchema;

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
      const { search, deepResearch, getWeather } = await import("../core/tools/index.js");
      expect(search).toBeDefined();
      expect(deepResearch).toBeDefined();
      expect(getWeather).toBeDefined();
      expect(search.name).toBe("search");
      expect(deepResearch.name).toBe("deep_research");
      expect(getWeather.name).toBe("deep_research"); // legacy alias
    });

    test("should import middlewares successfully", async () => {
      const {
        contextSchema,
        dynamicModelSelection,
        dynamicSystemPrompt,
        handleToolErrors,
      } = await import("../core/middlewares/index.js");

      expect(contextSchema).toBeDefined();
      expect(dynamicModelSelection).toBeDefined();
      expect(dynamicSystemPrompt).toBeDefined();
      expect(handleToolErrors).toBeDefined();
    });

    test("should import models successfully", async () => {
      const { basicModel, advancedModel } = await import("../config/models.js");
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
      const { contextSchema } = await import("../core/middlewares/index.js");
      
      const validContextBeginner = { userRole: "beginner" as const };
      const validContextExpert = { userRole: "expert" as const };

      expect(() => contextSchema.parse(validContextBeginner)).not.toThrow();
      expect(() => contextSchema.parse(validContextExpert)).not.toThrow();
    });
  });
});

describe("Agent Factory and Service", () => {
  test("should create agent using AgentFactory", () => {
    const agent = AgentFactory.createArticleAgent();
    expect(agent).toBeDefined();
  });

  test("should create advanced agent using AgentFactory", () => {
    const agent = AgentFactory.createAdvancedAgent();
    expect(agent).toBeDefined();
  });

  test("should return a structured response using AgentService", async () => {
    const agent = AgentFactory.createArticleAgent();
    const service = new AgentService(agent);

    const response = await service.generateArticle(
      "Write a short article about the benefits of machine learning",
      USER_ROLES.BEGINNER
    );

    expect(response).toBeDefined();
    expect(response.structuredResponse).toBeTypeOf("object");
    expect(response.structuredResponse).toHaveProperty("title");
    expect(response.structuredResponse).toHaveProperty("subtitle");
    expect(response.structuredResponse).toHaveProperty("content");
    expect(response.structuredResponse).toHaveProperty("readingTime");
    expect(response.structuredResponse).toHaveProperty("date");
    expect(response.messages).toBeDefined();
  }, 30000);

  test("should compare role responses using AgentService", async () => {
    const agent = AgentFactory.createArticleAgent();
    const service = new AgentService(agent);

    const comparison = await service.compareRoleResponses(
      "Write a short article about the benefits of machine learning"
    );

    expect(comparison.beginner).toBeDefined();
    expect(comparison.expert).toBeDefined();
    expect(comparison.beginner.structuredResponse).toHaveProperty("title");
    expect(comparison.expert.structuredResponse).toHaveProperty("title");
  }, 60000);
});

describe("Response Parser", () => {
  test("should parse valid structured response", () => {
    const mockResult = {
      messages: [{
        content: JSON.stringify({
          structuredResponse: {
            title: "Test Title",
            subtitle: "Test Subtitle",
            content: "Test Content",
            readingTime: 5,
            date: "2024-01-01"
          }
        })
      }]
    };

    const parsed = ResponseParser.parseStructuredResponse(mockResult);
    expect(parsed.structuredResponse.title).toBe("Test Title");
  });

  test("should handle invalid JSON gracefully", () => {
    const mockResult = {
      messages: [{
        content: "invalid json"
      }]
    };

    expect(() => ResponseParser.parseStructuredResponse(mockResult)).toThrow();
  });

  test("should return null for safeParseStructuredResponse with invalid data", () => {
    const mockResult = {
      messages: [{
        content: "invalid json"
      }]
    };

    const result = ResponseParser.safeParseStructuredResponse(mockResult);
    expect(result).toBeNull();
  });
});
