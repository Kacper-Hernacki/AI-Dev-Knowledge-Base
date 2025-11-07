import { createAgent, type BaseMessage, HumanMessage, type ToolCall } from "langchain";
import { getWeather, search } from "./tools.js";
import {
  contextSchema,
  dynamicModelSelection,
  dynamicSystemPrompt,
  handleToolErrors,
} from "./middlewares.js";
import z from "zod/v3";
import { MessagesZodState } from "@langchain/langgraph";

const customAgentState = z.object({
  messages: MessagesZodState.shape.messages,
  userPreferences: z.record(z.string(), z.string()).optional(),
});

const structuredFormat = z.object({
  title: z.string().describe("The title of the article"),
  subtitle: z.string().describe("The subtitle of the article"),
  content: z.string().describe("The content of the article"),
  readingTime: z
    .number()
    .describe("The reading time of the article in minutes"),
  date: z.string().describe("The date of the article"),
});

export const agent = createAgent({
  model: "gpt-4o-mini", //? Base model
  tools: [search, getWeather],
  stateSchema: customAgentState,
  contextSchema,
  middleware: [handleToolErrors, dynamicSystemPrompt, dynamicModelSelection],
  responseFormat: structuredFormat,
});

const result_beginner = await agent.invoke(
  {
    messages: [
      new HumanMessage(
        "Write a short article about the benefits of machine learning"
      ),
    ],
    userPreferences: {},
  },
  { context: { userRole: "beginner" } }
);

const result_expert = await agent.invoke(
  {
    messages: [
      new HumanMessage(
        "Write a short article about the benefits of machine learning"
      ),
    ],
    userPreferences: {},
  },
  { context: { userRole: "expert" } }
);

const result_beginner_structured = JSON.parse(
  result_beginner.messages.at(-1)!.content as string
);
const result_expert_structured = JSON.parse(
  result_expert.messages.at(-1)!.content as string
);

// show structured messages
console.log("result_expert_structured", result_expert_structured);
console.log("result_beginner_structured", result_beginner_structured);

const stream = await agent.stream(
  {
    messages: [
      new HumanMessage("Search for AI news and summarize the findings"),
    ],
    userPreferences: {},
  },
  { 
    streamMode: "values",
    context: { userRole: "beginner" }
  }
);

for await (const chunk of stream) {
  // Each chunk contains the full state at that point
  const latestMessage = chunk.messages.at(-1);
  if (latestMessage?.content) {
    console.log(`Agent: ${latestMessage.content}`);
  } else if (latestMessage?.tool_calls) {
    const toolCallNames = latestMessage.tool_calls.map((tc: ToolCall) => tc.name);
    console.log(`Calling tools: ${toolCallNames.join(", ")}`);
  }
}
