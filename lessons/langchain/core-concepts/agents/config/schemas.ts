import z from "zod/v3";
import { MessagesZodState } from "@langchain/langgraph";

export const agentStateSchema = z.object({
  messages: MessagesZodState.shape.messages,
  userPreferences: z.record(z.string(), z.string()).optional(),
});

export const articleSchema = z.object({
  title: z.string().describe("The title of the article"),
  subtitle: z.string().describe("The subtitle of the article"),
  content: z.string().describe("The content of the article"),
  readingTime: z
    .number()
    .describe("The reading time of the article in minutes"),
  date: z.string().describe("The date of the article"),
});

export type AgentState = z.infer<typeof agentStateSchema>;
export type ArticleFormat = z.infer<typeof articleSchema>;