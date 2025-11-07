/// <reference path="./globals.d.ts" />

import { 
  MODEL_CONFIG, 
  validateEnv, 
  isProviderConfigured, 
  getAvailableProviders,
  modelConfigSchema,
  modelParametersSchema 
} from "../config/index.js";

describe("Models Config", () => {
  describe("MODEL_CONFIG constants", () => {
    test("should have all required provider constants", () => {
      expect(MODEL_CONFIG.providers.OPENAI).toBe("openai");
      expect(MODEL_CONFIG.providers.ANTHROPIC).toBe("anthropic");
      expect(MODEL_CONFIG.providers.GOOGLE).toBe("google");
      expect(MODEL_CONFIG.providers.AZURE).toBe("azure");
      expect(MODEL_CONFIG.providers.BEDROCK).toBe("bedrock");
    });

    test("should have model configurations", () => {
      expect(MODEL_CONFIG.models.openai).toBeDefined();
      expect(MODEL_CONFIG.models.anthropic).toBeDefined();
      expect(MODEL_CONFIG.models.google).toBeDefined();
    });

    test("should have parameter configurations", () => {
      expect(MODEL_CONFIG.parameters.temperature).toBeDefined();
      expect(MODEL_CONFIG.parameters.maxTokens).toBeDefined();
      expect(MODEL_CONFIG.parameters.timeout).toBeDefined();
    });

    test("should have feature definitions", () => {
      expect(MODEL_CONFIG.features.TOOL_CALLING).toBe("tool_calling");
      expect(MODEL_CONFIG.features.STRUCTURED_OUTPUT).toBe("structured_output");
      expect(MODEL_CONFIG.features.MULTIMODAL).toBe("multimodal");
      expect(MODEL_CONFIG.features.REASONING).toBe("reasoning");
      expect(MODEL_CONFIG.features.STREAMING).toBe("streaming");
    });
  });

  describe("Environment validation", () => {
    test("should handle missing environment variables gracefully", () => {
      // This test might warn about missing providers but shouldn't throw
      expect(() => validateEnv()).not.toThrow();
    });

    test("should check provider configuration", () => {
      // These will likely return false in test environment
      expect(typeof isProviderConfigured("openai")).toBe("boolean");
      expect(typeof isProviderConfigured("anthropic")).toBe("boolean");
      expect(typeof isProviderConfigured("invalid")).toBe("boolean");
    });

    test("should get available providers", () => {
      const providers = getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
    });
  });

  describe("Schema validation", () => {
    test("should validate model parameters", () => {
      const validParams = {
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 30
      };
      expect(() => modelParametersSchema.parse(validParams)).not.toThrow();

      const invalidParams = {
        temperature: 3.0, // Too high
        maxTokens: -100   // Negative
      };
      expect(() => modelParametersSchema.parse(invalidParams)).toThrow();
    });

    test("should validate model configuration", () => {
      const validConfig = {
        provider: "openai",
        model: "gpt-4o-mini",
        parameters: { temperature: 0.7 }
      };
      expect(() => modelConfigSchema.parse(validConfig)).not.toThrow();

      const invalidConfig = {
        provider: "invalid_provider",
        model: "gpt-4o-mini"
      };
      expect(() => modelConfigSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe("Temperature configurations", () => {
    test("should have valid temperature ranges", () => {
      const temps = MODEL_CONFIG.parameters.temperature;
      expect(temps.creative).toBeGreaterThan(temps.balanced);
      expect(temps.balanced).toBeGreaterThan(temps.deterministic);
      expect(temps.deterministic).toBeGreaterThanOrEqual(temps.precise);
    });
  });

  describe("Token limits", () => {
    test("should have ascending token limits", () => {
      const tokens = MODEL_CONFIG.parameters.maxTokens;
      expect(tokens.short).toBeLessThan(tokens.medium);
      expect(tokens.medium).toBeLessThan(tokens.long);
      expect(tokens.long).toBeLessThan(tokens.extended);
    });
  });

  describe("Timeout configurations", () => {
    test("should have ascending timeout values", () => {
      const timeouts = MODEL_CONFIG.parameters.timeout;
      expect(timeouts.quick).toBeLessThan(timeouts.standard);
      expect(timeouts.standard).toBeLessThan(timeouts.extended);
    });
  });
});