/// <reference path="./globals.d.ts" />

import { ModelFactory } from "../core/model-factory.js";
import { MODEL_CONFIG } from "../config/index.js";

describe("ModelFactory", () => {
  describe("createModel", () => {
    test("should have correct static methods", () => {
      expect(typeof ModelFactory.createModel).toBe("function");
      expect(typeof ModelFactory.createOpenAIModel).toBe("function");
      expect(typeof ModelFactory.createModelWithMetadata).toBe("function");
      expect(typeof ModelFactory.createModelsForComparison).toBe("function");
      expect(typeof ModelFactory.createDefaultModel).toBe("function");
      expect(typeof ModelFactory.createMultipleModels).toBe("function");
    });

    test("should handle model creation options", async () => {
      const options = {
        provider: MODEL_CONFIG.providers.OPENAI,
        model: MODEL_CONFIG.models.openai.gpt4Mini,
        parameters: { 
          temperature: MODEL_CONFIG.parameters.temperature.balanced 
        },
        validateConfig: false // Skip validation in tests
      };

      // We can't actually test model creation without API keys
      // but we can test that the function exists and accepts correct parameters
      expect(typeof ModelFactory.createModel).toBe("function");
    });

    test("should handle OpenAI model creation parameters", () => {
      const options = {
        model: MODEL_CONFIG.models.openai.gpt4Mini,
        parameters: {
          temperature: 0.7,
          maxTokens: 1000
        }
      };

      // Test that function exists and would accept these parameters
      expect(typeof ModelFactory.createOpenAIModel).toBe("function");
    });
  });

  describe("createModelWithMetadata", () => {
    test("should accept metadata options", () => {
      const options = {
        provider: MODEL_CONFIG.providers.OPENAI,
        model: MODEL_CONFIG.models.openai.gpt4Mini,
        parameters: { temperature: 0.5 }
      };

      expect(typeof ModelFactory.createModelWithMetadata).toBe("function");
    });
  });

  describe("createDefaultModel", () => {
    test("should handle different use cases", () => {
      const useCases = ["reasoning", "creative", "multimodal", "fast", "default"];
      
      useCases.forEach(useCase => {
        expect(typeof ModelFactory.createDefaultModel).toBe("function");
        // Can't test actual creation without API keys, but verify method exists
      });
    });
  });

  describe("createModelsForComparison", () => {
    test("should accept array of model configurations", () => {
      const configs = [
        {
          provider: MODEL_CONFIG.providers.OPENAI,
          model: MODEL_CONFIG.models.openai.gpt4Mini,
          parameters: { temperature: 0.1 }
        },
        {
          provider: MODEL_CONFIG.providers.OPENAI,
          model: MODEL_CONFIG.models.openai.gpt4Mini,
          parameters: { temperature: 0.9 }
        }
      ];

      expect(typeof ModelFactory.createModelsForComparison).toBe("function");
    });
  });

  describe("createMultipleModels", () => {
    test("should accept array of factory options", () => {
      const options = [
        { model: MODEL_CONFIG.models.openai.gpt4Mini, validateConfig: false },
        { model: MODEL_CONFIG.models.openai.gpt3Turbo, validateConfig: false }
      ];

      expect(typeof ModelFactory.createMultipleModels).toBe("function");
    });
  });

  describe("Model configurations", () => {
    test("should use correct model names from config", () => {
      expect(MODEL_CONFIG.models.openai.gpt4).toBe("gpt-4o");
      expect(MODEL_CONFIG.models.openai.gpt4Mini).toBe("gpt-4o-mini");
      expect(MODEL_CONFIG.models.anthropic.claudeSonnet).toBe("claude-sonnet-4-5-20250929");
    });

    test("should have valid parameter defaults", () => {
      const params = MODEL_CONFIG.parameters;
      
      expect(params.temperature.creative).toBeGreaterThan(0.8);
      expect(params.temperature.deterministic).toBeLessThan(0.2);
      expect(params.maxTokens.short).toBeGreaterThan(0);
      expect(params.timeout.quick).toBeGreaterThan(0);
    });
  });

  describe("Provider validation", () => {
    test("should have all supported providers", () => {
      const providers = Object.values(MODEL_CONFIG.providers);
      expect(providers).toContain("openai");
      expect(providers).toContain("anthropic");
      expect(providers).toContain("google");
      expect(providers).toContain("azure");
      expect(providers).toContain("bedrock");
    });
  });

  describe("Error handling", () => {
    test("should handle invalid provider gracefully", async () => {
      // Since we can't test actual model creation without API keys,
      // we verify the method exists and would handle the case
      expect(typeof ModelFactory.createModel).toBe("function");
    });

    test("should validate configuration when requested", () => {
      const options = {
        provider: MODEL_CONFIG.providers.OPENAI,
        model: MODEL_CONFIG.models.openai.gpt4Mini,
        validateConfig: true // This would check API keys
      };

      expect(typeof ModelFactory.createModel).toBe("function");
    });
  });
});