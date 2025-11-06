import { ChatOpenAI } from "@langchain/openai";

const basicModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});
const advancedModel = new ChatOpenAI({
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
});

export { basicModel, advancedModel };
