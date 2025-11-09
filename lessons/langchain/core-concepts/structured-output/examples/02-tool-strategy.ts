/**
 * Tool Strategy Example
 * Demonstrates tool calling strategy for structured output
 */

import { z } from "zod";
import { createAgent, toolStrategy } from "langchain";

/**
 * Example 1: Product Review Analysis with Zod
 */
export async function analyzeProductReview() {
  console.log("\n⭐ Product Review Analysis (Zod)");
  console.log("=".repeat(50));

  const ProductReview = z.object({
    rating: z.number().min(1).max(5).optional(),
    sentiment: z.enum(["positive", "negative"]),
    keyPoints: z
      .array(z.string())
      .describe("The key points of the review. Lowercase, 1-3 words each."),
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
          "Analyze this review: 'Great product! 5 out of 5 stars. Fast shipping, but expensive'",
      },
    ],
  });

  console.log("\n📥 Input:");
  console.log("  'Great product! 5 out of 5 stars. Fast shipping, but expensive'");
  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Works with all tool-calling models");
  console.log("✅ Automatic retry on validation errors");
  console.log("✅ Type-safe with Zod schemas");
}

/**
 * Example 2: Product Review with JSON Schema
 */
export async function analyzeProductReviewJSON() {
  console.log("\n⭐ Product Review Analysis (JSON Schema)");
  console.log("=".repeat(50));

  const productReviewSchema = {
    type: "object",
    description: "Analysis of a product review.",
    properties: {
      rating: {
        type: ["integer", "null"],
        description: "The rating of the product (1-5)",
        minimum: 1,
        maximum: 5,
      },
      sentiment: {
        type: "string",
        enum: ["positive", "negative"],
        description: "The sentiment of the review",
      },
      key_points: {
        type: "array",
        items: { type: "string" },
        description: "The key points of the review",
      },
    },
    required: ["sentiment", "key_points"],
  };

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(productReviewSchema),
  });

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Analyze this review: 'Terrible experience. Product broke after 2 days. Would not recommend.'",
      },
    ],
  });

  console.log("\n📥 Input:");
  console.log(
    "  'Terrible experience. Product broke after 2 days. Would not recommend.'"
  );
  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ JSON Schema validation");
  console.log("✅ Supports null values");
  console.log("✅ Cross-language compatibility");
}

/**
 * Example 3: Union Types - Multiple Response Formats
 */
export async function handleUnionTypes() {
  console.log("\n🔀 Union Types - Multiple Response Formats");
  console.log("=".repeat(50));

  const ProductReview = z.object({
    rating: z.number().min(1).max(5).optional(),
    sentiment: z.enum(["positive", "negative"]),
    keyPoints: z
      .array(z.string())
      .describe("The key points of the review. Lowercase, 1-3 words each."),
  });

  const CustomerComplaint = z.object({
    issueType: z.enum(["product", "service", "shipping", "billing"]),
    severity: z.enum(["low", "medium", "high"]),
    description: z.string().describe("Brief description of the complaint"),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy([ProductReview, CustomerComplaint]),
  });

  // Test with review
  console.log("\n📝 Test 1: Product Review");
  const result1 = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Analyze this review: 'Great product! 5 out of 5 stars. Fast shipping, but expensive'",
      },
    ],
  });

  console.log("\n📤 Output (ProductReview):");
  console.log(JSON.stringify(result1.structuredResponse, null, 2));

  // Test with complaint
  console.log("\n📝 Test 2: Customer Complaint");
  const result2 = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Process this complaint: 'My package never arrived. Tracking shows it was lost. This is urgent!'",
      },
    ],
  });

  console.log("\n📤 Output (CustomerComplaint):");
  console.log(JSON.stringify(result2.structuredResponse, null, 2));

  console.log("\n✅ Agent chooses appropriate schema");
  console.log("✅ Supports multiple output types");
  console.log("✅ Dynamic response format selection");
}

/**
 * Example 4: Optional Fields and Complex Validation
 */
export async function complexValidation() {
  console.log("\n🔍 Complex Validation Rules");
  console.log("=".repeat(50));

  const EventRegistration = z.object({
    attendeeName: z.string().min(2).max(100),
    email: z.string().email(),
    age: z.number().min(18).max(120).optional(),
    ticketType: z.enum(["standard", "vip", "student"]),
    dietaryRestrictions: z.array(z.string()).default([]),
    emergencyContact: z
      .object({
        name: z.string(),
        phone: z.string().regex(/^\+?[\d\s-()]+$/),
      })
      .optional(),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(EventRegistration),
  });

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `Register attendee:
          Name: Sarah Johnson
          Email: sarah.j@email.com
          Age: 28
          Ticket: VIP
          Dietary: Vegetarian, No nuts
          Emergency contact: Mike Johnson, +1-555-0123`,
      },
    ],
  });

  console.log("\n📥 Input: Event registration details");
  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Email validation");
  console.log("✅ Regex pattern matching");
  console.log("✅ Min/max constraints");
  console.log("✅ Nested optional objects");
}

// Run if executed directly
if (import.meta.main) {
  await analyzeProductReview();
  await analyzeProductReviewJSON();
  await handleUnionTypes();
  await complexValidation();
}
