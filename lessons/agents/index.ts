import { createAgent } from "langchain";
import { getWeather, search } from "./tools.js";
import {
  contextSchema,
  dynamicModelSelection,
  dynamicSystemPrompt,
  handleToolErrors,
} from "./middlewares.js";
import z from "zod";

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
  contextSchema,
  middleware: [handleToolErrors, dynamicSystemPrompt, dynamicModelSelection],
  responseFormat: structuredFormat,
});

const result_beginner = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Write a short article about the benefits of machine learning",
      },
    ],
  },
  { context: { userRole: "beginner" } }
);

const result_expert = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Write a short article about the benefits of machine learning",
      },
    ],
  },
  { context: { userRole: "expert" } }
);

console.log("result_beginner", result_beginner);
console.log("result_expert", result_expert);
const result_beginner_structured = JSON.parse(
  result_beginner.messages.at(-1)!.content as string
);
const result_expert_structured = JSON.parse(
  result_expert.messages.at(-1)!.content as string
);

console.log("result_expert_structured", result_expert_structured);
console.log("result_beginner_structured", result_beginner_structured);
