import type { ParsedResponse, ResponseParsingError } from "../core/types.js";

export class ResponseParser {
  static parseStructuredResponse(result: any): ParsedResponse {
    try {
      const content = result.messages.at(-1)?.content as string;
      
      if (!content) {
        throw new Error("No content found in agent response");
      }
      
      const parsed = JSON.parse(content);
      
      // Validate the structure
      if (!parsed.structuredResponse) {
        throw new Error("Invalid response structure: missing structuredResponse");
      }
      
      return {
        structuredResponse: parsed.structuredResponse,
        messages: result.messages,
      };
    } catch (error) {
      const parseError = new Error(`Failed to parse agent response: ${error instanceof Error ? error.message : 'Unknown error'}`) as ResponseParsingError;
      parseError.name = 'ResponseParsingError';
      parseError.context = { result, error };
      throw parseError;
    }
  }
  
  static safeParseStructuredResponse(result: any): ParsedResponse | null {
    try {
      return this.parseStructuredResponse(result);
    } catch {
      return null;
    }
  }
}