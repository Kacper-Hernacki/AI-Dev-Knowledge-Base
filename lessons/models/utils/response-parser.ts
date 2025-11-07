/**
 * Response parser utility for models lesson
 * Provides utilities for parsing and formatting model responses
 */

import { AIMessage } from "@langchain/core/messages";
import { Logger } from "./logger.js";

export interface ParsedResponse {
  content: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
  contentBlocks?: Array<{
    type: string;
    content: string;
  }>;
}

export interface StructuredOutput<T = any> {
  parsed: T;
  raw: ParsedResponse;
  isValid: boolean;
  validationErrors?: string[];
}

/**
 * Response parser utility class
 */
export class ResponseParser {

  /**
   * Parse AI message to structured format
   */
  static parseAIMessage(message: AIMessage): ParsedResponse {
    Logger.debug("Parsing AI message", {
      messageType: message.constructor.name,
      hasUsageMetadata: !!message.usage_metadata,
      timestamp: new Date().toISOString()
    });

    const parsed: ParsedResponse = {
      content: message.content as string,
      metadata: message.response_metadata
    };

    // Extract token usage if available
    if (message.usage_metadata) {
      parsed.tokenUsage = {
        promptTokens: message.usage_metadata.input_tokens || 0,
        completionTokens: message.usage_metadata.output_tokens || 0,
        totalTokens: message.usage_metadata.total_tokens || 0
      };
    }

    // Parse content blocks if available
    if (Array.isArray(message.content)) {
      parsed.contentBlocks = message.content.map((block, index) => ({
        type: typeof block === "object" && block !== null && "type" in block 
          ? (block.type as string) 
          : "text",
        content: typeof block === "string" 
          ? block 
          : typeof block === "object" && block !== null && "text" in block
            ? (block.text as string)
            : `Block ${index}`
      }));
    }

    Logger.debug("AI message parsed", {
      contentLength: parsed.content.length,
      hasTokenUsage: !!parsed.tokenUsage,
      hasContentBlocks: !!parsed.contentBlocks,
      timestamp: new Date().toISOString()
    });

    return parsed;
  }

  /**
   * Extract JSON from response text
   */
  static extractJSON<T = any>(text: string): T | null {
    Logger.debug("Extracting JSON from text", {
      textLength: text.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Look for JSON patterns in the text
      const jsonPatterns = [
        /```json\s*(\{[\s\S]*?\})\s*```/g,
        /```\s*(\{[\s\S]*?\})\s*```/g,
        /(\{[\s\S]*\})/g
      ];

      for (const pattern of jsonPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              // Clean the match
              const cleaned = match
                .replace(/```json|```/g, "")
                .trim();
              
              const parsed = JSON.parse(cleaned);
              
              Logger.info("JSON extracted successfully", {
                extractedKeys: Object.keys(parsed || {}),
                timestamp: new Date().toISOString()
              });

              return parsed as T;
            } catch {
              continue; // Try next match
            }
          }
        }
      }

      // Try direct parse as fallback
      const parsed = JSON.parse(text);
      Logger.info("JSON parsed directly", {
        extractedKeys: Object.keys(parsed || {}),
        timestamp: new Date().toISOString()
      });

      return parsed as T;

    } catch (error) {
      Logger.warn("JSON extraction failed", {
        error: error instanceof Error ? error.message : String(error),
        textPreview: text.slice(0, 100),
        timestamp: new Date().toISOString()
      });

      return null;
    }
  }

  /**
   * Parse streaming chunks into complete response
   */
  static async parseStreamingResponse(
    stream: AsyncIterable<any>,
    onChunk?: (chunk: string) => void
  ): Promise<ParsedResponse> {
    Logger.debug("Starting streaming response parsing", {
      timestamp: new Date().toISOString()
    });

    let fullContent = "";
    let finalMessage: any = null;

    try {
      for await (const chunk of stream) {
        const chunkText = chunk.content as string || "";
        fullContent += chunkText;

        if (onChunk) {
          onChunk(chunkText);
        }

        // Keep the last chunk for metadata
        finalMessage = chunk;
      }

      const result: ParsedResponse = {
        content: fullContent,
        metadata: finalMessage?.response_metadata
      };

      // Extract token usage if available from final message
      if (finalMessage?.usage_metadata) {
        result.tokenUsage = {
          promptTokens: finalMessage.usage_metadata.input_tokens || 0,
          completionTokens: finalMessage.usage_metadata.output_tokens || 0,
          totalTokens: finalMessage.usage_metadata.total_tokens || 0
        };
      }

      Logger.info("Streaming response parsed", {
        totalLength: fullContent.length,
        hasTokenUsage: !!result.tokenUsage,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      Logger.error("Streaming response parsing failed", {
        error: error instanceof Error ? error.message : String(error),
        partialContent: fullContent.slice(0, 100),
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Validate and parse structured output
   */
  static validateStructuredOutput<T>(
    response: string | any,
    schema: any,
    schemaName: string = "unknown"
  ): StructuredOutput<T> {
    Logger.debug("Validating structured output", {
      schemaName,
      responseType: typeof response,
      timestamp: new Date().toISOString()
    });

    try {
      let parsed: any;
      
      // If response is string, try to extract JSON
      if (typeof response === "string") {
        parsed = this.extractJSON(response);
        if (!parsed) {
          return {
            parsed: response as T,
            raw: { content: response },
            isValid: false,
            validationErrors: ["Could not extract JSON from response"]
          };
        }
      } else {
        parsed = response;
      }

      // Validate with schema if provided
      if (schema && schema.parse) {
        try {
          const validated = schema.parse(parsed);
          
          Logger.info("Structured output validation successful", {
            schemaName,
            validatedKeys: Object.keys(validated || {}),
            timestamp: new Date().toISOString()
          });

          return {
            parsed: validated as T,
            raw: { content: JSON.stringify(parsed) },
            isValid: true
          };

        } catch (validationError) {
          const errors = this.extractValidationErrors(validationError);
          
          Logger.warn("Structured output validation failed", {
            schemaName,
            errors,
            timestamp: new Date().toISOString()
          });

          return {
            parsed: parsed as T,
            raw: { content: JSON.stringify(parsed) },
            isValid: false,
            validationErrors: errors
          };
        }
      }

      // No schema validation, assume valid
      return {
        parsed: parsed as T,
        raw: { content: JSON.stringify(parsed) },
        isValid: true
      };

    } catch (error) {
      Logger.error("Structured output parsing failed", {
        schemaName,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });

      return {
        parsed: response as T,
        raw: { content: typeof response === "string" ? response : JSON.stringify(response) },
        isValid: false,
        validationErrors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Extract validation errors from Zod error
   */
  private static extractValidationErrors(error: any): string[] {
    if (error && typeof error === "object" && "issues" in error) {
      // Zod error
      return error.issues.map((issue: any) => 
        `${issue.path.join(".")}: ${issue.message}`
      );
    }
    
    return [error instanceof Error ? error.message : String(error)];
  }

  /**
   * Format response for display
   */
  static formatResponse(response: ParsedResponse, options: {
    includeMetadata?: boolean;
    maxLength?: number;
    prettyPrint?: boolean;
  } = {}): string {
    const { 
      includeMetadata = false, 
      maxLength = 1000,
      prettyPrint = false 
    } = options;

    let formatted = response.content;

    // Truncate if too long
    if (formatted.length > maxLength) {
      formatted = formatted.slice(0, maxLength) + "...";
    }

    // Add metadata if requested
    if (includeMetadata && response.metadata) {
      const metadataStr = prettyPrint 
        ? JSON.stringify(response.metadata, null, 2)
        : JSON.stringify(response.metadata);
      
      formatted += `\n\nMetadata: ${metadataStr}`;
    }

    // Add token usage if available
    if (includeMetadata && response.tokenUsage) {
      formatted += `\n\nToken Usage: ${JSON.stringify(response.tokenUsage)}`;
    }

    return formatted;
  }

  /**
   * Compare multiple responses
   */
  static compareResponses(responses: Array<{ name: string; response: ParsedResponse }>): {
    lengthComparison: Array<{ name: string; length: number }>;
    tokenUsageComparison?: Array<{ name: string; tokens: number }>;
    summary: {
      shortest: string;
      longest: string;
      averageLength: number;
      totalResponses: number;
    };
  } {
    Logger.info("Comparing responses", {
      count: responses.length,
      timestamp: new Date().toISOString()
    });

    const lengthComparison = responses.map(({ name, response }) => ({
      name,
      length: response.content.length
    })).sort((a, b) => a.length - b.length);

    const tokenUsageComparison = responses
      .filter(({ response }) => response.tokenUsage)
      .map(({ name, response }) => ({
        name,
        tokens: response.tokenUsage!.totalTokens
      }))
      .sort((a, b) => a.tokens - b.tokens);

    const lengths = lengthComparison.map(r => r.length);
    const averageLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

    const summary = {
      shortest: lengthComparison[0]?.name || "none",
      longest: lengthComparison[lengthComparison.length - 1]?.name || "none",
      averageLength: Math.round(averageLength),
      totalResponses: responses.length
    };

    return {
      lengthComparison,
      tokenUsageComparison: tokenUsageComparison.length > 0 ? tokenUsageComparison : undefined,
      summary
    };
  }
}