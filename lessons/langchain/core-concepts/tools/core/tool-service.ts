/**
 * Tool Service - High-level tool management
 * Provides utilities for tool validation, parsing, and orchestration
 */

import type { AIMessage } from "@langchain/core/messages";
import { ToolExecutor, type ToolExecutionResult } from "./tool-executor.js";
import type { ToolConfig } from "./tool-builder.js";

/**
 * Tool call from AI message
 */
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

/**
 * Tool registry entry
 */
export interface RegisteredTool {
  tool: any;
  name: string;
  description: string;
  schema: any;
  category?: string;
  tags?: string[];
}

/**
 * Tool Service - Manage tools and their execution
 */
export class ToolService {
  private tools: Map<string, RegisteredTool> = new Map();
  private executor: ToolExecutor;

  constructor() {
    this.executor = new ToolExecutor();
  }

  /**
   * Register a tool
   */
  registerTool(
    tool: any,
    metadata?: {
      category?: string;
      tags?: string[];
    }
  ): void {
    const registered: RegisteredTool = {
      tool,
      name: tool.name,
      description: tool.description || "",
      schema: tool.schema,
      category: metadata?.category,
      tags: metadata?.tags
    };

    this.tools.set(tool.name, registered);
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: any[], category?: string): void {
    tools.forEach(tool => this.registerTool(tool, { category }));
  }

  /**
   * Get tool by name
   */
  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): RegisteredTool[] {
    return this.getAllTools().filter(t => t.category === category);
  }

  /**
   * Get tools by tag
   */
  getToolsByTag(tag: string): RegisteredTool[] {
    return this.getAllTools().filter(t => t.tags?.includes(tag));
  }

  /**
   * Search tools by name or description
   */
  searchTools(query: string): RegisteredTool[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTools().filter(
      t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Parse tool calls from AI message
   */
  parseToolCalls(message: AIMessage): ToolCall[] {
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return [];
    }

    return message.tool_calls.map(tc => ({
      id: tc.id || `call_${Date.now()}`,
      name: tc.name,
      args: tc.args || {}
    }));
  }

  /**
   * Execute tool call from AI message
   */
  async executeToolCall(
    toolCall: ToolCall,
    config?: ToolConfig
  ): Promise<ToolExecutionResult> {
    const registered = this.getTool(toolCall.name);

    if (!registered) {
      return {
        success: false,
        error: `Tool ${toolCall.name} not found`,
        executionTime: 0,
        toolName: toolCall.name,
        args: toolCall.args
      };
    }

    return this.executor.executeTool(registered.tool, toolCall.args, config);
  }

  /**
   * Execute all tool calls from AI message
   */
  async executeToolCalls(
    message: AIMessage,
    config?: ToolConfig
  ): Promise<ToolExecutionResult[]> {
    const toolCalls = this.parseToolCalls(message);

    const results: ToolExecutionResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeToolCall(toolCall, config);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute tool calls in parallel
   */
  async executeToolCallsParallel(
    message: AIMessage,
    config?: ToolConfig
  ): Promise<ToolExecutionResult[]> {
    const toolCalls = this.parseToolCalls(message);

    const promises = toolCalls.map(tc => this.executeToolCall(tc, config));

    return Promise.all(promises);
  }

  /**
   * Validate tool arguments against schema
   */
  validateToolArgs(toolName: string, args: any): {
    valid: boolean;
    errors?: string[];
  } {
    const registered = this.getTool(toolName);

    if (!registered) {
      return {
        valid: false,
        errors: [`Tool ${toolName} not found`]
      };
    }

    try {
      registered.schema.parse(args);
      return { valid: true };
    } catch (error: any) {
      const errors = error.errors?.map((e: any) => e.message) || [
        error instanceof Error ? error.message : String(error)
      ];
      return {
        valid: false,
        errors
      };
    }
  }

  /**
   * Get tool schema for a specific tool
   */
  getToolSchema(toolName: string): any {
    const registered = this.getTool(toolName);
    return registered?.schema;
  }

  /**
   * Get tools in format suitable for model binding
   */
  getToolsForBinding(): any[] {
    return this.getAllTools().map(t => t.tool);
  }

  /**
   * Check if tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Remove tool from registry
   */
  unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Clear all registered tools
   */
  clearTools(): void {
    this.tools.clear();
  }

  /**
   * Get tool count
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * Get execution statistics
   */
  getExecutionStats() {
    return this.executor.getStatistics();
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ToolExecutionResult[] {
    return this.executor.getHistory();
  }

  /**
   * Clear execution history
   */
  clearExecutionHistory(): void {
    this.executor.clearHistory();
  }

  /**
   * Export tool definitions
   */
  exportToolDefinitions(): Array<{
    name: string;
    description: string;
    schema: any;
    category?: string;
    tags?: string[];
  }> {
    return this.getAllTools().map(t => ({
      name: t.name,
      description: t.description,
      schema: t.schema,
      category: t.category,
      tags: t.tags
    }));
  }

  /**
   * Create tool catalog for documentation
   */
  createCatalog(): string {
    const tools = this.getAllTools();

    let catalog = "# Tool Catalog\n\n";

    // Group by category
    const byCategory: Record<string, RegisteredTool[]> = {};

    tools.forEach(tool => {
      const category = tool.category || "Uncategorized";
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(tool);
    });

    // Generate catalog
    Object.entries(byCategory).forEach(([category, categoryTools]) => {
      catalog += `## ${category}\n\n`;

      categoryTools.forEach(tool => {
        catalog += `### ${tool.name}\n\n`;
        catalog += `**Description:** ${tool.description}\n\n`;

        if (tool.tags && tool.tags.length > 0) {
          catalog += `**Tags:** ${tool.tags.join(", ")}\n\n`;
        }

        catalog += `**Schema:**\n\`\`\`json\n${JSON.stringify(tool.schema, null, 2)}\n\`\`\`\n\n`;
      });
    });

    return catalog;
  }
}

/**
 * Default tool service instance
 */
export const defaultToolService = new ToolService();

/**
 * Register a tool with the default service
 */
export function registerTool(
  tool: any,
  metadata?: { category?: string; tags?: string[] }
): void {
  defaultToolService.registerTool(tool, metadata);
}

/**
 * Execute tool calls from AI message
 */
export async function executeToolCalls(
  message: AIMessage,
  config?: ToolConfig
): Promise<ToolExecutionResult[]> {
  return defaultToolService.executeToolCalls(message, config);
}
