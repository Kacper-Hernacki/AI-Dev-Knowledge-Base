# Structured Output

Structured output transforms unstructured LLM responses into typed, validated data structures. Instead of parsing natural language, you get reliable JSON objects that match your schema.

## Overview

**What is Structured Output?**

Structured output allows agents to return data in a specific, predictable format using Zod schemas or JSON Schema. The agent automatically validates and returns typed data in the `structuredResponse` field.

**Why Use Structured Output?**

- ✅ **Type Safety** - Get strongly-typed data instead of parsing strings
- ✅ **Validation** - Automatic schema validation with helpful error messages
- ✅ **Reliability** - Guaranteed format, no parsing errors
- ✅ **Developer Experience** - IntelliSense and compile-time checking

## Quick Start

```typescript
import { z } from "zod";
import { createAgent, toolStrategy } from "langchain";

// Define your schema
const ContactInfo = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

// Create agent with structured output
const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  tools: [],
  responseFormat: toolStrategy(ContactInfo),
});

// Get structured data
const result = await agent.invoke({
  messages: [{
    role: "user",
    content: "Extract: John Doe, john@example.com, 555-1234"
  }],
});

console.log(result.structuredResponse);
// { name: "John Doe", email: "john@example.com", phone: "555-1234" }
```

---

## Table of Contents

1. [Response Format](#response-format)
2. [Provider Strategy](#provider-strategy)
3. [Tool Calling Strategy](#tool-calling-strategy)
4. [Custom Tool Message Content](#custom-tool-message-content)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Response Format

The `responseFormat` parameter controls how agents return structured data.

### Schema Types

You can provide either:
- **Zod Schema** - Type-safe validation with TypeScript inference
- **JSON Schema** - Language-agnostic, works with any validator

```typescript
import { z } from "zod";
import { createAgent } from "langchain";

// Option 1: Zod Schema (recommended for TypeScript)
const zodSchema = z.object({
  title: z.string(),
  count: z.number(),
});

// Option 2: JSON Schema
const jsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    count: { type: "number" },
  },
  required: ["title", "count"],
};

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: zodSchema, // or jsonSchema
});
```

### Strategy Selection

LangChain automatically chooses the best strategy:

| Model | Native Support | Default Strategy |
|-------|---------------|------------------|
| OpenAI (gpt-4o, gpt-4o-mini) | ✅ Yes | Provider Strategy |
| Anthropic (Claude) | ❌ No | Tool Strategy |
| Other Models | Varies | Tool Strategy (fallback) |

You can explicitly choose a strategy:

```typescript
import { providerStrategy, toolStrategy } from "langchain";

// Force provider strategy (OpenAI/Grok only)
responseFormat: providerStrategy(schema)

// Force tool calling strategy (works with all models)
responseFormat: toolStrategy(schema)
```

---

## Provider Strategy

Provider strategy uses native structured output from model providers (OpenAI, Grok). This is the most reliable method when available.

### How It Works

```
User Input → Model with Native Structured Output → Validated JSON
```

The model provider enforces the schema at the API level, ensuring high reliability.

### Example: Contact Information

```typescript
import { z } from "zod";
import { createAgent, providerStrategy } from "langchain";

const ContactInfo = z.object({
  name: z.string().describe("The name of the person"),
  email: z.string().describe("The email address"),
  phone: z.string().describe("The phone number"),
});

const agent = createAgent({
  model: "gpt-4o-mini", // OpenAI model with native support
  tools: [],
  responseFormat: providerStrategy(ContactInfo),
});

const result = await agent.invoke({
  messages: [{
    role: "user",
    content: "Extract: Alice Smith, alice@example.com, +1-555-9876"
  }],
});

console.log(result.structuredResponse);
// {
//   name: "Alice Smith",
//   email: "alice@example.com",
//   phone: "+1-555-9876"
// }
```

### Example: Nested Objects

```typescript
const CompanyInfo = z.object({
  company: z.string(),
  employees: z.array(z.object({
    name: z.string(),
    role: z.string(),
    email: z.string(),
  })),
  founded: z.number(),
  headquarters: z.object({
    city: z.string(),
    country: z.string(),
  }),
});

const agent = createAgent({
  model: "gpt-4o-mini",
  responseFormat: providerStrategy(CompanyInfo),
});

const result = await agent.invoke({
  messages: [{
    role: "user",
    content: `
      TechCorp was founded in 2015, headquartered in San Francisco, USA.
      Employees: Jane Doe (CEO, jane@techcorp.com), Bob Smith (CTO, bob@techcorp.com)
    `
  }],
});

console.log(result.structuredResponse);
// {
//   company: "TechCorp",
//   employees: [
//     { name: "Jane Doe", role: "CEO", email: "jane@techcorp.com" },
//     { name: "Bob Smith", role: "CTO", email: "bob@techcorp.com" }
//   ],
//   founded: 2015,
//   headquarters: { city: "San Francisco", country: "USA" }
// }
```

### Advantages

✅ **Highest Reliability** - Provider-enforced validation
✅ **Strict Schema Compliance** - No workarounds needed
✅ **Performance** - Faster than tool calling

### Limitations

❌ **Limited Models** - Only OpenAI and Grok currently
❌ **No Custom Messages** - Can't customize tool message content
❌ **Provider Lock-in** - Tied to specific providers

---

## Tool Calling Strategy

Tool calling strategy works with ALL models that support tool calling. The agent creates a hidden tool for your schema and calls it to return structured data.

### How It Works

```
User Input → Model Calls "Structured Output" Tool → Validated JSON
```

The model thinks it's calling a tool, but it's actually generating your structured output.

### Example: Product Review Analysis

```typescript
import { z } from "zod";
import { createAgent, toolStrategy } from "langchain";

const ProductReview = z.object({
  rating: z.number().min(1).max(5).optional(),
  sentiment: z.enum(["positive", "negative"]),
  keyPoints: z.array(z.string()).describe(
    "Key points, lowercase, 1-3 words each"
  ),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  tools: [],
  responseFormat: toolStrategy(ProductReview),
});

const result = await agent.invoke({
  messages: [{
    role: "user",
    content: "Analyze: 'Great product! 5 stars. Fast shipping but expensive'"
  }],
});

console.log(result.structuredResponse);
// {
//   rating: 5,
//   sentiment: "positive",
//   keyPoints: ["fast shipping", "expensive"]
// }
```

### Example: Union Types (Multiple Schemas)

Handle different response types dynamically:

```typescript
const ProductReview = z.object({
  rating: z.number().min(1).max(5),
  sentiment: z.enum(["positive", "negative"]),
  keyPoints: z.array(z.string()),
});

const CustomerComplaint = z.object({
  issueType: z.enum(["product", "service", "shipping", "billing"]),
  severity: z.enum(["low", "medium", "high"]),
  description: z.string(),
});

// Agent can return EITHER schema
const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  tools: [],
  responseFormat: toolStrategy([ProductReview, CustomerComplaint]),
});

// Review input → ProductReview output
const review = await agent.invoke({
  messages: [{ role: "user", content: "Great product! 5 stars" }],
});

// Complaint input → CustomerComplaint output
const complaint = await agent.invoke({
  messages: [{ role: "user", content: "Package never arrived. Urgent!" }],
});
```

### Example: Complex Validation

```typescript
const EventRegistration = z.object({
  attendeeName: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional(),
  ticketType: z.enum(["standard", "vip", "student"]),
  dietaryRestrictions: z.array(z.string()).default([]),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string().regex(/^\+?[\d\s-()]+$/),
  }).optional(),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(EventRegistration),
});

const result = await agent.invoke({
  messages: [{
    role: "user",
    content: `
      Register: Sarah Johnson, sarah@email.com, age 28, VIP ticket,
      vegetarian/no nuts, emergency contact Mike Johnson +1-555-0123
    `
  }],
});

console.log(result.structuredResponse);
// {
//   attendeeName: "Sarah Johnson",
//   email: "sarah@email.com",
//   age: 28,
//   ticketType: "vip",
//   dietaryRestrictions: ["vegetarian", "no nuts"],
//   emergencyContact: {
//     name: "Mike Johnson",
//     phone: "+1-555-0123"
//   }
// }
```

### Advantages

✅ **Universal Support** - Works with all tool-calling models
✅ **Custom Messages** - Can customize tool message content
✅ **Flexible** - Union types, optional fields, complex validation
✅ **Error Handling** - Automatic retry with helpful feedback

### Limitations

⚠️ **Extra Token Usage** - Tool calling adds tokens
⚠️ **Slightly Slower** - Extra model call for tool

---

## Custom Tool Message Content

Customize the message that appears in conversation history when structured output is generated.

### Default vs Custom Messages

**Default Message:**
```
"Returning structured response: {'name': 'John', 'email': 'john@example.com'}"
```

**Custom Message:**
```
"✅ Contact information saved successfully!"
```

### Example: Simple Custom Message

```typescript
import { z } from "zod";
import { createAgent, toolStrategy } from "langchain";

const MeetingAction = z.object({
  task: z.string(),
  assignee: z.string(),
  priority: z.enum(["low", "medium", "high"]),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(MeetingAction, {
    toolMessageContent: "Action item captured and added to meeting notes!",
  }),
});

const result = await agent.invoke({
  messages: [{
    role: "user",
    content: "Sarah needs to update the timeline ASAP"
  }],
});

// Check conversation history
for (const msg of result.messages) {
  console.log(`${msg._getType()}: ${msg.content}`);
}

// Output:
// user: Sarah needs to update the timeline ASAP
// assistant: [tool_calls...]
// tool: Action item captured and added to meeting notes!
```

### Example: Dynamic Messages

Generate messages based on the structured output:

```typescript
const DataValidation = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(DataValidation, {
    toolMessageContent: (result) => {
      if (result.isValid) {
        return "✅ Data validation passed successfully";
      } else {
        const errorCount = result.errors?.length || 0;
        const warningCount = result.warnings?.length || 0;
        return `❌ Validation failed: ${errorCount} error(s), ${warningCount} warning(s)`;
      }
    },
  }),
});

// Valid data
const validResult = await agent.invoke({
  messages: [{ role: "user", content: "Validate: valid@email.com, age 25" }],
});
// Tool message: "✅ Data validation passed successfully"

// Invalid data
const invalidResult = await agent.invoke({
  messages: [{ role: "user", content: "Validate: invalid email, age -5" }],
});
// Tool message: "❌ Validation failed: 2 error(s), 0 warning(s)"
```

### Example: Context-Specific Messages

```typescript
// Bug report agent
const bugAgent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(BugReport, {
    toolMessageContent: "🐛 Bug report filed and assigned to engineering",
  }),
});

// Feature request agent
const featureAgent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(FeatureRequest, {
    toolMessageContent: "💡 Feature request added to product roadmap",
  }),
});
```

### Use Cases

✅ **User Feedback** - Confirm actions to users
✅ **Workflow Tracking** - Show progress through steps
✅ **Error Context** - Provide actionable feedback
✅ **Multi-Agent Systems** - Differentiate agent actions

---

## Error Handling

Structured output includes intelligent error handling with automatic retry.

### Types of Errors

1. **Schema Validation Error** - Output doesn't match schema
2. **Multiple Structured Outputs Error** - Model tries to return multiple schemas
3. **Parsing Error** - Invalid JSON or format

### Schema Validation Error

**Scenario:** Model provides data that violates schema constraints.

```typescript
const ProductRating = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string(),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(ProductRating),
});

// User provides "10/10" but max is 5
const result = await agent.invoke({
  messages: [{ role: "user", content: "Amazing product, 10/10!" }],
});

// Automatic retry with error feedback:
// 1. Model returns: { rating: 10, comment: "Amazing product" }
// 2. Validation fails: "rating must be ≤ 5"
// 3. Agent sends error to model
// 4. Model corrects: { rating: 5, comment: "Amazing product" }

console.log(result.structuredResponse);
// { rating: 5, comment: "Amazing product" }
```

**Conversation Flow:**

```
User:      "Amazing product, 10/10!"
Assistant: [calls tool with rating: 10]
Tool:      "Error: rating must be ≤ 5. Please fix your mistakes."
Assistant: [calls tool with rating: 5]  ← Automatic retry!
Tool:      "Returning structured response: {...}"
```

### Multiple Structured Outputs Error

**Scenario:** Model tries to call multiple structured output tools when only one is expected.

```typescript
const ContactInfo = z.object({
  name: z.string(),
  email: z.string(),
});

const EventDetails = z.object({
  event_name: z.string(),
  date: z.string(),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy([ContactInfo, EventDetails]),
});

const result = await agent.invoke({
  messages: [{
    role: "user",
    content: "John (john@email.com) is organizing Tech Conf on March 15. Extract contact only."
  }],
});

// If model tries to return BOTH schemas:
// 1. Model calls ContactInfo AND EventDetails
// 2. Error: "Only one structured response expected"
// 3. Model retries with just ContactInfo

console.log(result.structuredResponse);
// { name: "John", email: "john@email.com" }
```

### Error Handling Strategies

#### 1. Default Error Handling (Automatic Retry)

```typescript
const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(schema),
  // Default: handleError: true
});

// Automatically retries with error feedback
```

#### 2. Custom Error Message

```typescript
const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(ProductRating, {
    handleError: "Please provide a rating between 1-5 and include a comment.",
  }),
});

// Error message becomes more user-friendly
```

#### 3. Conditional Error Handling

```typescript
import { ToolInputParsingException } from "@langchain/core/tools";

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(UserProfile, {
    handleError: (error) => {
      if (error instanceof ToolInputParsingException) {
        return "Username must be 3-20 chars, age 13-120, bio under 500 chars.";
      }
      return error.message; // Default for other errors
    },
  }),
});
```

#### 4. No Error Handling (Fail Fast)

```typescript
const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(schema, {
    handleError: false, // Disable retry, throw immediately
  }),
});

// Useful for strict validation scenarios
```

### Example: Complex Error Scenarios

```typescript
const OrderDetails = z.object({
  orderId: z.string().regex(/^ORD-\d{6}$/),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })).min(1),
  total: z.number().positive(),
  shipping: z.object({
    address: z.string().min(10),
    zipCode: z.string().regex(/^\d{5}$/),
  }),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(OrderDetails, {
    handleError: (error) => {
      if (error.message.includes("orderId")) {
        return "Order ID must be in format ORD-123456";
      }
      if (error.message.includes("zipCode")) {
        return "Zip code must be exactly 5 digits";
      }
      if (error.message.includes("items")) {
        return "At least one item required with positive quantity and price";
      }
      return "Please check all fields meet the requirements";
    },
  }),
});
```

### Error Handling Best Practices

✅ **Use Default for Most Cases** - Automatic retry works well
✅ **Custom Messages for UX** - Better guidance improves success rate
✅ **Fail Fast for Critical** - Use `handleError: false` for strict validation
✅ **Log Errors** - Track validation failures for schema improvements

---

## Best Practices

### Schema Design

**✅ DO: Use Descriptive Field Names**

```typescript
// Good
const schema = z.object({
  customerName: z.string(),
  orderTotal: z.number(),
  deliveryAddress: z.string(),
});

// Bad
const schema = z.object({
  n: z.string(),
  t: z.number(),
  addr: z.string(),
});
```

**✅ DO: Add Descriptions**

```typescript
const schema = z.object({
  rating: z.number().describe("Product rating from 1-5 stars"),
  feedback: z.string().describe("Customer's detailed feedback"),
  wouldRecommend: z.boolean().describe("Whether customer would recommend"),
});
```

**✅ DO: Use Appropriate Constraints**

```typescript
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  zipCode: z.string().regex(/^\d{5}$/),
});
```

**❌ DON'T: Over-complicate Schemas**

```typescript
// Too complex - split into multiple schemas
const schema = z.object({
  user: z.object({
    profile: z.object({
      personal: z.object({
        // ...10 more levels deep
      }),
    }),
  }),
});
```

### Strategy Selection

**When to Use Provider Strategy:**

✅ Using OpenAI (gpt-4o, gpt-4o-mini) or Grok
✅ Need highest reliability
✅ Performance is critical
✅ Don't need custom tool messages

**When to Use Tool Strategy:**

✅ Using Anthropic (Claude) or other models
✅ Need custom tool message content
✅ Want union types (multiple schemas)
✅ Need flexible error handling

### Performance Optimization

**Minimize Token Usage:**

```typescript
// Use concise descriptions
const schema = z.object({
  name: z.string().describe("Customer name"),
  // Not: "The full legal name of the customer including first, middle, and last names"
});
```

**Batch Related Fields:**

```typescript
// Good - related fields together
const Address = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

const schema = z.object({
  shipping: Address,
  billing: Address,
});
```

### Type Safety

**Leverage TypeScript Inference:**

```typescript
import { z } from "zod";

const ContactInfo = z.object({
  name: z.string(),
  email: z.string(),
});

// TypeScript infers the type
type ContactInfoType = z.infer<typeof ContactInfo>;
// { name: string; email: string; }

function processContact(contact: ContactInfoType) {
  // Full type safety!
  console.log(contact.name.toUpperCase());
}

const result = await agent.invoke({...});
processContact(result.structuredResponse); // Type-safe!
```

---

## Common Patterns

### Pattern 1: Data Extraction

Extract structured data from unstructured text.

```typescript
const ArticleMetadata = z.object({
  title: z.string(),
  author: z.string(),
  publishDate: z.string(),
  tags: z.array(z.string()),
  wordCount: z.number(),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(ArticleMetadata),
});

const result = await agent.invoke({
  messages: [{
    role: "user",
    content: `Extract metadata from:
      "Understanding AI Safety" by Sarah Chen
      Published: March 15, 2024
      This comprehensive guide explores modern AI safety concerns...
      [2,450 words]
      Tags: AI, Safety, Ethics`
  }],
});
```

### Pattern 2: Classification

Classify input into predefined categories.

```typescript
const EmailClassification = z.object({
  category: z.enum(["sales", "support", "billing", "spam"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  requiresResponse: z.boolean(),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(EmailClassification),
});
```

### Pattern 3: Validation

Validate data and return structured results.

```typescript
const FormValidation = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
  warnings: z.array(z.string()).optional(),
  sanitizedData: z.record(z.any()).optional(),
});

const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(FormValidation, {
    toolMessageContent: (result) =>
      result.isValid ? "✅ Validation passed" : "❌ Validation failed",
  }),
});
```

### Pattern 4: Multi-Step Workflows

Combine multiple structured outputs.

```typescript
// Step 1: Extract requirements
const Requirements = z.object({
  features: z.array(z.string()),
  constraints: z.array(z.string()),
  deadline: z.string().optional(),
});

// Step 2: Create action plan
const ActionPlan = z.object({
  tasks: z.array(z.object({
    title: z.string(),
    assignee: z.string(),
    dueDate: z.string(),
    priority: z.enum(["low", "medium", "high"]),
  })),
  timeline: z.string(),
});

// Use different agents for each step
const extractAgent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(Requirements),
});

const planAgent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(ActionPlan),
});

// Step 1
const requirements = await extractAgent.invoke({
  messages: [{ role: "user", content: projectDescription }],
});

// Step 2
const plan = await planAgent.invoke({
  messages: [{
    role: "user",
    content: `Create action plan for: ${JSON.stringify(requirements.structuredResponse)}`
  }],
});
```

---

## Troubleshooting

### Issue: Schema Validation Keeps Failing

**Symptoms:** Model repeatedly fails to generate valid output.

**Solutions:**

1. **Simplify Schema** - Complex schemas are harder for models

```typescript
// Too complex
const schema = z.object({
  data: z.array(z.object({
    nested: z.object({
      deep: z.object({
        // ...
      })
    })
  }))
});

// Simpler
const NestedData = z.object({
  deep: z.string(),
});

const schema = z.object({
  data: z.array(NestedData),
});
```

2. **Add Better Descriptions**

```typescript
const schema = z.object({
  date: z.string().describe("Date in YYYY-MM-DD format"),
  amount: z.number().describe("Dollar amount (no currency symbol)"),
});
```

3. **Use Custom Error Messages**

```typescript
responseFormat: toolStrategy(schema, {
  handleError: "Provide dates as YYYY-MM-DD and amounts as numbers only.",
})
```

### Issue: Wrong Schema Selected (Union Types)

**Symptoms:** Model chooses the wrong schema from union types.

**Solutions:**

1. **Add Clear Descriptions**

```typescript
const Review = z.object({
  // ...
}).describe("Use for POSITIVE feedback about products");

const Complaint = z.object({
  // ...
}).describe("Use for PROBLEMS and ISSUES");
```

2. **Guide in Prompt**

```typescript
const result = await agent.invoke({
  messages: [{
    role: "user",
    content: "This is a COMPLAINT: Package never arrived..."
  }],
});
```

### Issue: Performance is Slow

**Symptoms:** Structured output takes too long.

**Solutions:**

1. **Use Provider Strategy** (if available)

```typescript
// Faster with OpenAI
responseFormat: providerStrategy(schema)
```

2. **Simplify Schema**

```typescript
// Remove unnecessary optional fields
const schema = z.object({
  required1: z.string(),
  required2: z.number(),
  // Remove optional fields that aren't critical
});
```

3. **Use Faster Model**

```typescript
const agent = createAgent({
  model: "gpt-4o-mini", // or "claude-3-5-haiku-20241022"
  responseFormat: toolStrategy(schema),
});
```

### Issue: TypeScript Errors

**Symptoms:** Type errors with structured response.

**Solutions:**

1. **Use Type Inference**

```typescript
import { z } from "zod";

const schema = z.object({ name: z.string() });
type SchemaType = z.infer<typeof schema>;

// Now result.structuredResponse is properly typed
```

2. **Explicitly Type Middleware**

```typescript
const agent = createAgent({
  model: "claude-3-5-haiku-20241022",
  responseFormat: toolStrategy(schema),
}) as const; // Use 'as const' if needed
```

---

## API Reference

### `providerStrategy()`

Create provider-native structured output strategy.

```typescript
function providerStrategy<T>(
  schema: ZodSchema<T> | JsonSchemaFormat
): ProviderStrategy<T>
```

**Parameters:**
- `schema` - Zod schema or JSON Schema object

**Returns:** `ProviderStrategy<T>`

**Example:**

```typescript
import { providerStrategy } from "langchain";

const strategy = providerStrategy(ContactInfo);
```

### `toolStrategy()`

Create tool calling structured output strategy.

```typescript
function toolStrategy<T>(
  schema: ZodSchema<T> | JsonSchemaFormat | Array<ZodSchema | JsonSchemaFormat>,
  options?: ToolStrategyOptions
): ToolStrategy<T>
```

**Parameters:**
- `schema` - Single schema or array of schemas (union types)
- `options.toolMessageContent` - Custom message for tool response
  - `string` - Static message
  - `(result: T) => string` - Dynamic message based on output
- `options.handleError` - Error handling strategy
  - `true` - Default retry with error feedback (default)
  - `false` - No retry, throw immediately
  - `string` - Custom error message
  - `(error: ToolStrategyError) => string` - Dynamic error handling

**Returns:** `ToolStrategy<T>`

**Example:**

```typescript
import { toolStrategy } from "langchain";

const strategy = toolStrategy(ProductReview, {
  toolMessageContent: "Review analyzed successfully!",
  handleError: (error) => `Validation failed: ${error.message}`,
});
```

---

## Summary

**Key Takeaways:**

✅ **Use Structured Output** for reliable, typed data from LLMs
✅ **Provider Strategy** for OpenAI/Grok (highest reliability)
✅ **Tool Strategy** for all other models (universal support)
✅ **Custom Messages** improve user experience
✅ **Error Handling** with automatic retry ensures success
✅ **Type Safety** with Zod and TypeScript inference

**Next Steps:**

1. Run the demos: `bun run structured-output:demo`
2. Try the examples: `bun run structured-output:examples`
3. Run tests: `bun run structured-output:test`
4. Build your own schemas for your use case

**Resources:**

- [Official Documentation](https://docs.claude.com/en/docs/langchain/structured-output)
- [Zod Documentation](https://zod.dev)
- [JSON Schema](https://json-schema.org)
- [Example Code](./examples/)

---

*Built with LangChain v1.0+ | Updated: 2025*
