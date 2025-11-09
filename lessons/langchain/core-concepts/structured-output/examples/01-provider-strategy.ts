/**
 * Provider Strategy Example
 * Demonstrates using provider-native structured output (OpenAI, Grok)
 */

import { z } from "zod";
import { createAgent, providerStrategy } from "langchain";

/**
 * Example 1: Contact Information Extraction with Zod Schema
 */
export async function extractContactInfoZod() {
  console.log("\n📇 Contact Info Extraction (Zod Schema)");
  console.log("=".repeat(50));

  // Define structured output schema
  const ContactInfo = z.object({
    name: z.string().describe("The name of the person"),
    email: z.string().describe("The email address of the person"),
    phone: z.string().describe("The phone number of the person"),
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
          "Extract contact info from: John Doe, john@example.com, (555) 123-4567",
      },
    ],
  });

  console.log("\n📥 Input:");
  console.log("  'John Doe, john@example.com, (555) 123-4567'");
  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Provider-native structured output");
  console.log("✅ Strong type safety with Zod");
  console.log("✅ Automatic validation");
}

/**
 * Example 2: Contact Information with JSON Schema
 */
export async function extractContactInfoJSON() {
  console.log("\n📇 Contact Info Extraction (JSON Schema)");
  console.log("=".repeat(50));

  const contactInfoSchema = {
    type: "object" as const,
    description: "Contact information for a person.",
    properties: {
      name: { type: "string" as const, description: "The name of the person" },
      email: { type: "string" as const, description: "The email address of the person" },
      phone: { type: "string" as const, description: "The phone number of the person" },
    },
    required: ["name", "email", "phone"],
  };

  const agent = createAgent({
    model: "gpt-4o-mini",
    tools: [],
    responseFormat: providerStrategy(contactInfoSchema),
  });

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "Extract contact info from: Alice Smith, alice.smith@company.com, +1-555-987-6543",
      },
    ],
  });

  console.log("\n📥 Input:");
  console.log("  'Alice Smith, alice.smith@company.com, +1-555-987-6543'");
  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ JSON Schema support");
  console.log("✅ Works with any JSON Schema validator");
  console.log("✅ Language-agnostic format");
}

/**
 * Example 3: Complex Nested Structure
 */
export async function extractComplexData() {
  console.log("\n🏢 Complex Nested Structure");
  console.log("=".repeat(50));

  const CompanyInfo = z.object({
    company: z.string().describe("Company name"),
    employees: z.array(
      z.object({
        name: z.string(),
        role: z.string(),
        email: z.string(),
      })
    ).describe("List of employees"),
    founded: z.number().describe("Year founded"),
    headquarters: z.object({
      city: z.string(),
      country: z.string(),
    }).describe("Headquarters location"),
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
        content: `Extract company data:
          TechCorp was founded in 2015 and is headquartered in San Francisco, USA.
          Key employees: Jane Doe (CEO, jane@techcorp.com), Bob Smith (CTO, bob@techcorp.com)`,
      },
    ],
  });

  console.log("\n📥 Input: Complex company description");
  console.log("\n📤 Structured Output:");
  console.log(JSON.stringify(result.structuredResponse, null, 2));

  console.log("\n✅ Supports nested objects");
  console.log("✅ Handles arrays of objects");
  console.log("✅ Maintains type safety");
}

// Run if executed directly
if (import.meta.main) {
  await extractContactInfoZod();
  await extractContactInfoJSON();
  await extractComplexData();
}
