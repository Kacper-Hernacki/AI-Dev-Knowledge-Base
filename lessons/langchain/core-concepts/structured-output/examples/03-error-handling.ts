/**
 * Error Handling Examples
 * Demonstrates all error handling scenarios for structured output
 */

import { z } from "zod";
import { createAgent, toolStrategy } from "langchain";
import { ToolInputParsingException } from "@langchain/core/tools";

/**
 * Example 1: Schema Validation Error (Automatic Retry)
 */
export async function schemaValidationError() {
  console.log("\n❌ Schema Validation Error (Auto Retry)");
  console.log("=".repeat(50));

  const ProductRating = z.object({
    rating: z.number().min(1).max(5).describe("Rating from 1-5"),
    comment: z.string().describe("Review comment"),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(ProductRating),
  });

  console.log("\n📥 Input: 'Amazing product, 10/10!'");
  console.log("  (Note: 10 exceeds max rating of 5)");

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "Parse this review: 'Amazing product, 10/10!'",
      },
    ],
  });

  console.log("\n📤 Structured Output (after retry):");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Automatic validation");
  console.log("✅ Error feedback to model");
  console.log("✅ Automatic retry with corrections");
}

/**
 * Example 2: Multiple Structured Outputs Error
 */
export async function multipleOutputsError() {
  console.log("\n🔢 Multiple Structured Outputs Error");
  console.log("=".repeat(50));

  const ContactInfo = z.object({
    name: z.string().describe("Person's name"),
    email: z.string().describe("Email address"),
  });

  const EventDetails = z.object({
    event_name: z.string().describe("Name of the event"),
    date: z.string().describe("Event date"),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy([ContactInfo, EventDetails]),
  });

  console.log("\n📥 Input with both contact and event info");

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Extract info: John Doe (john@email.com) is organizing Tech Conference on March 15th. Extract only the contact info.",
      },
    ],
  });

  console.log("\n📤 Structured Output (single response):");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Detects multiple response attempts");
  console.log("✅ Prompts model to choose one");
  console.log("✅ Returns single structured output");
}

/**
 * Example 3: Custom Error Message
 */
export async function customErrorMessage() {
  console.log("\n💬 Custom Error Message");
  console.log("=".repeat(50));

  const ProductRating = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string(),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(ProductRating, {
      handleError: "Please provide a valid rating between 1-5 and include a comment.",
    }),
  });

  console.log("\n📥 Input with invalid rating");

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "Rate this: Excellent product! Rating: 100",
      },
    ],
  });

  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Custom, user-friendly error messages");
  console.log("✅ Better model guidance");
  console.log("✅ Improved retry success rate");
}

/**
 * Example 4: Conditional Error Handling
 */
export async function conditionalErrorHandling() {
  console.log("\n🔀 Conditional Error Handling");
  console.log("=".repeat(50));

  const UserProfile = z.object({
    username: z.string().min(3).max(20),
    age: z.number().min(13).max(120),
    bio: z.string().max(500),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(UserProfile, {
      handleError: (error) => {
        if (error instanceof ToolInputParsingException) {
          // Custom message for validation errors
          return "Username must be 3-20 characters, age must be 13-120, and bio under 500 characters.";
        }
        // Default message for other errors
        return error.message;
      },
    }),
  });

  console.log("\n📥 Input with validation errors");

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Create profile: username 'ab' (too short), age 150 (too old), bio 'I love coding'",
      },
    ],
  });

  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Handle specific error types");
  console.log("✅ Different messages per error");
  console.log("✅ Flexible error handling");
}

/**
 * Example 5: No Error Handling (Fail Fast)
 */
export async function noErrorHandling() {
  console.log("\n⚡ No Error Handling (Fail Fast)");
  console.log("=".repeat(50));

  const StrictSchema = z.object({
    value: z.number().positive(),
    category: z.enum(["A", "B", "C"]),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(StrictSchema, {
      handleError: false, // Disable error handling
    }),
  });

  console.log("\n📥 Input: Valid data");

  try {
    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: "Parse: value is 42, category is B",
        },
      ],
    });

    console.log("\n📤 Structured Output:");
    console.log(JSON.stringify(result.structuredResponse, null, 2));

    console.log("\n✅ No retry overhead");
    console.log("✅ Immediate error detection");
    console.log("✅ Useful for strict validation");
  } catch (error) {
    console.error("\n❌ Error thrown immediately:");
    console.error(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Example 6: Complex Error Scenarios
 */
export async function complexErrorScenarios() {
  console.log("\n🎯 Complex Error Scenarios");
  console.log("=".repeat(50));

  const OrderDetails = z.object({
    orderId: z.string().regex(/^ORD-\d{6}$/),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().positive(),
        price: z.number().positive(),
      })
    ).min(1),
    total: z.number().positive(),
    shipping: z.object({
      address: z.string().min(10),
      zipCode: z.string().regex(/^\d{5}$/),
    }),
  });

  const agent = createAgent({
    model: "claude-3-5-haiku-20241022",
    tools: [],
    responseFormat: toolStrategy(OrderDetails, {
      handleError: (error) => {
        // Provide detailed guidance based on error
        if (error.message.includes("orderId")) {
          return "Order ID must be in format ORD-123456";
        }
        if (error.message.includes("zipCode")) {
          return "Zip code must be exactly 5 digits";
        }
        if (error.message.includes("items")) {
          return "At least one item is required with positive quantity and price";
        }
        return "Please check all fields meet the requirements";
      },
    }),
  });

  console.log("\n📥 Input: Order with validation requirements");

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `Process order:
          Order ID: ORD-123456
          Items: Widget (qty: 2, price: $19.99), Gadget (qty: 1, price: $49.99)
          Total: $89.97
          Shipping: 123 Main Street, Springfield, 62701`,
      },
    ],
  });

  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Multiple validation rules");
  console.log("✅ Contextual error messages");
  console.log("✅ Complex nested validation");
}

// Run if executed directly
if (import.meta.main) {
  await schemaValidationError();
  await multipleOutputsError();
  await customErrorMessage();
  await conditionalErrorHandling();
  await noErrorHandling();
  await complexErrorScenarios();
}
