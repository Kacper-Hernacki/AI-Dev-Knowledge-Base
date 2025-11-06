import { describe, test, expect } from "vitest";
import { search, getWeather } from "../tools.js";

describe("Agent Tools", () => {
  describe("search tool", () => {
    test("should have correct name and description", () => {
      expect(search.name).toBe("search");
      expect(search.description).toBe("Search for information");
    });

    test("should return search results for a query", async () => {
      const result = await search.invoke({ query: "LangChain framework" });
      expect(result).toBe("Results for: LangChain framework");
    });

    test("should handle different queries", async () => {
      const testQueries = ["AI", "machine learning", "test query"];
      
      for (const query of testQueries) {
        const result = await search.invoke({ query });
        expect(result).toBe(`Results for: ${query}`);
      }
    });

    test("should have valid schema", () => {
      expect(search.schema).toBeDefined();
      expect(search.schema.shape.query).toBeDefined();
    });

    test("should validate schema with valid input", () => {
      const validInput = { query: "test" };
      expect(() => search.schema.parse(validInput)).not.toThrow();
    });

    test("should reject invalid schema input", () => {
      const invalidInput = { query: 123 }; // should be string
      expect(() => search.schema.parse(invalidInput)).toThrow();
    });
  });

  describe("getWeather tool", () => {
    test("should have correct name and description", () => {
      expect(getWeather.name).toBe("get_weather");
      expect(getWeather.description).toBe("Get weather information for a location");
    });

    test("should return weather information for a location", async () => {
      const result = await getWeather.invoke({ location: "New York" });
      expect(result).toBe("Weather in New York: Sunny, 72°F");
    });

    test("should handle different locations", async () => {
      const testLocations = ["London", "Tokyo", "Paris"];
      
      for (const location of testLocations) {
        const result = await getWeather.invoke({ location });
        expect(result).toBe(`Weather in ${location}: Sunny, 72°F`);
      }
    });

    test("should have valid schema", () => {
      expect(getWeather.schema).toBeDefined();
      expect(getWeather.schema.shape.location).toBeDefined();
    });

    test("should validate schema with valid input", () => {
      const validInput = { location: "Berlin" };
      expect(() => getWeather.schema.parse(validInput)).not.toThrow();
    });

    test("should reject invalid schema input", () => {
      const invalidInput = { location: 123 }; // should be string
      expect(() => getWeather.schema.parse(invalidInput)).toThrow();
    });
  });
});
