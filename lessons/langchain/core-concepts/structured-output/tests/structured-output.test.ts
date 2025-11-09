/**
 * Structured Output Tests
 * Tests for structured output functionality
 */

import { describe, test, expect } from "bun:test";
import { z } from "zod";
import { createAgent, providerStrategy, toolStrategy } from "langchain";

describe("Structured Output", () => {
  describe("Provider Strategy", () => {
    test.skip("should extract contact info with Zod schema", async () => {
      const ContactInfo = z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
      });

      const agent = createAgent({
        model: "gpt-4o-mini",
        tools: [],
        responseFormat: providerStrategy(ContactInfo),
      });

      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content:
              "Extract: John Doe, john@example.com, (555) 123-4567",
          },
        ],
      });

      expect(result.structuredResponse).toBeDefined();
      expect(result.structuredResponse.name).toBe("John Doe");
      expect(result.structuredResponse.email).toBe("john@example.com");
      expect(result.structuredResponse.phone).toContain("555");
    });

    test.skip("should handle nested objects", async () => {
      const CompanyInfo = z.object({
        company: z.string(),
        headquarters: z.object({
          city: z.string(),
          country: z.string(),
        }),
      });

      const agent = createAgent({
        model: "gpt-4o-mini",
        tools: [],
        responseFormat: providerStrategy(CompanyInfo),
      });

      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content:
              "TechCorp is headquartered in San Francisco, USA",
          },
        ],
      });

      expect(result.structuredResponse.company).toBe("TechCorp");
      expect(result.structuredResponse.headquarters.city).toBe(
        "San Francisco"
      );
      expect(result.structuredResponse.headquarters.country).toBe("USA");
    });
  });

  describe("Tool Strategy", () => {
    test.skip("should analyze product review", async () => {
      const ProductReview = z.object({
        rating: z.number().min(1).max(5).optional(),
        sentiment: z.enum(["positive", "negative"]),
        keyPoints: z.array(z.string()),
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        responseFormat: toolStrategy(ProductReview),
      });

      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content:
              "Analyze: 'Great product! 5 stars. Fast shipping but expensive'",
          },
        ],
      });

      expect(result.structuredResponse.sentiment).toBe("positive");
      expect(result.structuredResponse.rating).toBe(5);
      expect(result.structuredResponse.keyPoints.length).toBeGreaterThan(0);
    });

    test.skip("should handle union types", async () => {
      const ProductReview = z.object({
        rating: z.number(),
        sentiment: z.enum(["positive", "negative"]),
      });

      const CustomerComplaint = z.object({
        issueType: z.enum(["product", "service", "shipping"]),
        severity: z.enum(["low", "medium", "high"]),
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        responseFormat: toolStrategy([ProductReview, CustomerComplaint]),
      });

      // Test review
      const reviewResult = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Analyze: 'Great product! 5 stars'",
          },
        ],
      });

      expect(reviewResult.structuredResponse).toHaveProperty("rating");
      expect(reviewResult.structuredResponse).toHaveProperty("sentiment");

      // Test complaint
      const complaintResult = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Complaint: Package never arrived. Very urgent!",
          },
        ],
      });

      expect(complaintResult.structuredResponse).toHaveProperty("issueType");
      expect(complaintResult.structuredResponse).toHaveProperty("severity");
    });
  });

  describe("Error Handling", () => {
    test.skip("should retry on validation error", async () => {
      const ProductRating = z.object({
        rating: z.number().min(1).max(5),
        comment: z.string(),
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        responseFormat: toolStrategy(ProductRating),
      });

      // Provide rating of 10 (exceeds max of 5)
      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Rate: Amazing product, 10/10!",
          },
        ],
      });

      // Should have retried and corrected to valid rating
      expect(result.structuredResponse.rating).toBeLessThanOrEqual(5);
      expect(result.structuredResponse.rating).toBeGreaterThanOrEqual(1);
      expect(result.structuredResponse.comment).toBeTruthy();
    });

    test.skip("should use custom error message", async () => {
      const Schema = z.object({
        value: z.number().min(1).max(100),
      });

      const customMessage =
        "Please provide a value between 1 and 100";

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        responseFormat: toolStrategy(Schema, {
          handleError: customMessage,
        }),
      });

      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Value is 200",
          },
        ],
      });

      // Should have corrected the value
      expect(result.structuredResponse.value).toBeLessThanOrEqual(100);
    });
  });

  describe("Custom Tool Message Content", () => {
    test.skip("should use custom message in conversation", async () => {
      const TaskItem = z.object({
        title: z.string(),
        completed: z.boolean(),
      });

      const customMessage = "Task added to your list!";

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        responseFormat: toolStrategy(TaskItem, {
          toolMessageContent: customMessage,
        }),
      });

      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Add task: Review PR, not done",
          },
        ],
      });

      // Check that custom message appears in conversation
      const toolMessage = result.messages.find(
        (m) => m._getType() === "tool"
      );
      expect(toolMessage).toBeDefined();
      expect(toolMessage?.content).toBe(customMessage);
    });

    test.skip("should support dynamic message generation", async () => {
      const Validation = z.object({
        isValid: z.boolean(),
        errors: z.array(z.string()).optional(),
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        responseFormat: toolStrategy(Validation, {
          toolMessageContent: (result) => {
            return result.isValid
              ? "Validation passed"
              : "Validation failed";
          },
        }),
      });

      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Validate: Email is valid@email.com",
          },
        ],
      });

      const toolMessage = result.messages.find(
        (m) => m._getType() === "tool"
      );
      expect(toolMessage?.content).toContain("Validation");
    });
  });

  describe("Complex Scenarios", () => {
    test.skip("should handle optional fields", async () => {
      const Schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        responseFormat: toolStrategy(Schema),
      });

      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Required field: hello",
          },
        ],
      });

      expect(result.structuredResponse.required).toBe("hello");
      // optional field may or may not be present
    });

    test.skip("should validate enums", async () => {
      const Schema = z.object({
        status: z.enum(["pending", "approved", "rejected"]),
      });

      const agent = createAgent({
        model: "claude-3-5-haiku-20241022",
        tools: [],
        responseFormat: toolStrategy(Schema),
      });

      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content: "Status: approved",
          },
        ],
      });

      expect(["pending", "approved", "rejected"]).toContain(
        result.structuredResponse.status
      );
    });
  });
});
