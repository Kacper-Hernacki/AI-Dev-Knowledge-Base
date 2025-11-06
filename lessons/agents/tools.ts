import * as z from "zod";
import { tool } from "langchain";

const search = tool(({ query }) => `Results for: ${query}`, {
  name: "search",
  description: "Search for information",
  schema: z.object({
    query: z.string().describe("The query to search for"),
  }),
});

const getWeather = tool(
  ({ location }) => `Weather in ${location}: Sunny, 72°F`,
  {
    name: "get_weather",
    description: "Get weather information for a location",
    schema: z.object({
      location: z.string().describe("The location to get weather for"),
    }),
  }
);

export { search, getWeather };
