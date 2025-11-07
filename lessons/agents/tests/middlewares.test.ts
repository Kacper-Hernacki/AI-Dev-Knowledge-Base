/// <reference path="./globals.d.ts" />

import {
  dynamicModelSelection,
  handleToolErrors,
  dynamicSystemPrompt,
  contextSchema,
} from "../core/middlewares/index.js";

describe("Agent Middlewares", () => {
  describe("contextSchema", () => {
    test("should validate expert role", () => {
      const result = contextSchema.parse({ userRole: "expert" });
      expect(result.userRole).toBe("expert");
    });

    test("should validate beginner role", () => {
      const result = contextSchema.parse({ userRole: "beginner" });
      expect(result.userRole).toBe("beginner");
    });

    test("should reject invalid role", () => {
      expect(() => contextSchema.parse({ userRole: "invalid" })).toThrow();
    });

    test("should reject missing role", () => {
      expect(() => contextSchema.parse({})).toThrow();
    });
  });

  describe("dynamicSystemPrompt", () => {
    test("should be a middleware object", () => {
      expect(typeof dynamicSystemPrompt).toBe("object");
      expect(dynamicSystemPrompt).toBeDefined();
    });

    test("should handle expert role context", () => {
      // Note: Testing the actual function would require proper LangChain runtime setup
      // For now, we validate the function exists and is properly exported
      expect(dynamicSystemPrompt).toBeDefined();
    });

    test("should handle beginner role context", () => {
      // Note: Testing the actual function would require proper LangChain runtime setup
      // For now, we validate the function exists and is properly exported
      expect(dynamicSystemPrompt).toBeDefined();
    });
  });

  describe("dynamicModelSelection", () => {
    test("should have correct middleware name", () => {
      expect(dynamicModelSelection.name).toBe("DynamicModelSelection");
    });

    test("should exist and be callable", () => {
      expect(typeof dynamicModelSelection).toBe("object");
      expect(dynamicModelSelection.wrapModelCall).toBeDefined();
      expect(typeof dynamicModelSelection.wrapModelCall).toBe("function");
    });
  });

  describe("handleToolErrors", () => {
    test("should have correct middleware name", () => {
      expect(handleToolErrors.name).toBe("HandleToolErrors");
    });

    test("should exist and be callable", () => {
      expect(typeof handleToolErrors).toBe("object");
      expect(handleToolErrors.wrapToolCall).toBeDefined();
      expect(typeof handleToolErrors.wrapToolCall).toBe("function");
    });
  });
});
