/**
 * Tool Builder - Factory for creating LangChain tools
 * Provides utilities for building tools with proper schema validation and context access
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Tool context interface - available in tool execution
 */
export interface ToolContext {
  user_id?: string;
  session_id?: string;
  [key: string]: any;
}

/**
 * Tool configuration
 */
export interface ToolConfig {
  context?: ToolContext;
  store?: any;
  streamWriter?: (message: string) => void;
  [key: string]: any;
}

/**
 * Tool function signature
 */
export type ToolFunction<T = any, R = any> = (
  args: T,
  config?: ToolConfig
) => R | Promise<R>;

/**
 * Tool definition
 */
export interface ToolDefinition<T = any> {
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  func: ToolFunction<T>;
}

/**
 * Tool Builder - Factory for creating tools with validation
 */
export class ToolBuilder {
  /**
   * Create a basic tool
   */
  static createTool<T>(definition: ToolDefinition<T>) {
    return tool(definition.func, {
      name: definition.name,
      description: definition.description,
      schema: definition.schema,
    });
  }

  /**
   * Create a search tool
   */
  static createSearchTool(
    searchFunction: (query: string, limit?: number) => Promise<any[]>
  ) {
    return this.createTool({
      name: "search_database",
      description: "Search the database for records matching the query.",
      schema: z.object({
        query: z.string().describe("Search terms to look for"),
        limit: z.number().optional().describe("Maximum number of results"),
      }),
      func: async ({ query, limit = 10 }) => {
        const results = await searchFunction(query, limit);
        return JSON.stringify(results);
      },
    });
  }

  /**
   * Create a weather tool
   */
  static createWeatherTool(getWeatherFunc: (city: string) => Promise<string>) {
    return this.createTool({
      name: "get_weather",
      description: "Get current weather for a specified city.",
      schema: z.object({
        city: z.string().describe("The city name"),
      }),
      func: async ({ city }) => {
        return await getWeatherFunc(city);
      },
    });
  }

  /**
   * Create a calculator tool
   */
  static createCalculatorTool() {
    return this.createTool({
      name: "calculator",
      description:
        "Perform mathematical calculations. Supports +, -, *, /, and parentheses.",
      schema: z.object({
        expression: z.string().describe("Mathematical expression to evaluate"),
      }),

      func: ({ expression }) => {
        try {
          // Safe evaluation - only allow numbers and basic operators
          const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
          const result = eval(sanitized);
          return `${expression} = ${result}`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return `Error evaluating expression: ${message}`;
        }
      },
    });
  }

  /**
   * Create a tool with context access
   */
  static createContextTool<T>(
    definition: ToolDefinition<T> & {
      requiresContext?: boolean;
    }
  ) {
    const originalFunc = definition.func;

    return tool(
      (args: T, config?: ToolConfig) => {
        if (definition.requiresContext && !config?.context) {
          throw new Error(
            `Tool ${definition.name} requires context but none was provided`
          );
        }
        return originalFunc(args, config);
      },
      {
        name: definition.name,
        description: definition.description,
        schema: definition.schema,
      }
    );
  }

  /**
   * Create a tool with memory access
   */
  static createMemoryTool<T>(
    definition: ToolDefinition<T> & {
      requiresStore?: boolean;
    }
  ) {
    const originalFunc = definition.func;

    return tool(
      (args: T, config?: ToolConfig) => {
        if (definition.requiresStore && !config?.store) {
          throw new Error(
            `Tool ${definition.name} requires store but none was provided`
          );
        }
        return originalFunc(args, config);
      },
      {
        name: definition.name,
        description: definition.description,
        schema: definition.schema,
      }
    );
  }

  /**
   * Create a tool with streaming updates
   */
  static createStreamingTool<T>(definition: ToolDefinition<T>) {
    return tool(
      (args: T, config?: ToolConfig) => {
        const writer = config?.streamWriter;
        return definition.func(args, { ...config, streamWriter: writer });
      },
      {
        name: definition.name,
        description: definition.description,
        schema: definition.schema,
      }
    );
  }

  /**
   * Create a file operation tool
   */
  static createFileReadTool(readFunc: (path: string) => Promise<string>) {
    return this.createTool({
      name: "read_file",
      description: "Read contents of a file from the filesystem.",
      schema: z.object({
        path: z.string().describe("Path to the file to read"),
      }),
      func: async ({ path }) => {
        try {
          const content = await readFunc(path);
          return content;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return `Error reading file: ${message}`;
        }
      },
    });
  }

  /**
   * Create an API call tool
   */
  static createAPITool(
    apiName: string,
    endpoint: string,
    method: "GET" | "POST" = "GET"
  ) {
    return this.createTool({
      name: `call_${apiName}_api`,
      description: `Call the ${apiName} API endpoint.`,
      schema: z.object({
        params: z
          .record(z.string(), z.any())
          .optional()
          .describe("API parameters"),
        body: z.any().optional().describe("Request body for POST requests"),
      }),
      func: async ({ params, body }) => {
        try {
          const url = new URL(endpoint);
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              url.searchParams.append(key, String(value));
            });
          }

          const options: RequestInit = { method };
          if (method === "POST" && body) {
            options.body = JSON.stringify(body);
            options.headers = { "Content-Type": "application/json" };
          }

          const response = await fetch(url.toString(), options);
          const data = await response.json();
          return JSON.stringify(data);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return `API call failed: ${message}`;
        }
      },
    });
  }

  /**
   * Create a database query tool
   */
  static createDatabaseTool(queryFunc: (sql: string) => Promise<any[]>) {
    return this.createTool({
      name: "query_database",
      description: "Execute a SQL query against the database.",
      schema: z.object({
        sql: z.string().describe("SQL query to execute"),
      }),
      func: async ({ sql }) => {
        try {
          const results = await queryFunc(sql);
          return JSON.stringify(results);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return `Database error: ${message}`;
        }
      },
    });
  }

  /**
   * Create a tool that validates input
   */
  static createValidatedTool<T>(
    definition: ToolDefinition<T> & {
      validator?: (args: T) => boolean | string;
    }
  ) {
    const originalFunc = definition.func;
    const validator = definition.validator;

    return tool(
      (args: T, config?: ToolConfig) => {
        if (validator) {
          const validationResult = validator(args);
          if (validationResult !== true) {
            const errorMsg =
              typeof validationResult === "string"
                ? validationResult
                : "Validation failed";
            throw new Error(errorMsg);
          }
        }
        return originalFunc(args, config);
      },
      {
        name: definition.name,
        description: definition.description,
        schema: definition.schema,
      }
    );
  }

  /**
   * Create multiple tools from definitions
   */
  static createTools(definitions: ToolDefinition<any>[]) {
    return definitions.map((def) => this.createTool(def));
  }
}

/**
 * Common tool schemas for reuse
 */
export const CommonSchemas = {
  search: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().optional().describe("Result limit"),
  }),

  weather: z.object({
    city: z.string().describe("City name"),
    units: z.enum(["celsius", "fahrenheit"]).optional(),
  }),

  fileOperation: z.object({
    path: z.string().describe("File path"),
  }),

  calculation: z.object({
    expression: z.string().describe("Mathematical expression"),
  }),

  apiCall: z.object({
    params: z.record(z.string(), z.any()).optional(),
    body: z.any().optional(),
  }),

  userInfo: z.object({
    user_id: z.string().describe("User identifier"),
  }),
};

/**
 * Create a tool with default values
 */
export function createToolWithDefaults<T extends z.ZodObject<any>>(definition: {
  name: string;
  description?: string;
  schema: T;
  func: (args: z.infer<T>, config?: ToolConfig) => Promise<string> | string;
}) {
  return tool(definition.func, {
    name: definition.name,
    description: definition.description || "A custom tool",
    schema: definition.schema,
  });
}
