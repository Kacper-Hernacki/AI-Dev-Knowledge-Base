/**
 * Tool Executor - Manages tool invocation and execution
 * Handles error recovery, retries, and result parsing
 */

import type { ToolConfig } from "./tool-builder.js";

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  toolName: string;
  args: any;
}

/**
 * Tool execution options
 */
export interface ExecutionOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onProgress?: (message: string) => void;
  maxParallel?: number;
  stopOnError?: boolean;
}

/**
 * Tool Executor - Execute tools with error handling and monitoring
 */
export class ToolExecutor {
  private executionHistory: ToolExecutionResult[] = [];
  private readonly maxHistorySize: number;

  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Execute a tool with error handling
   */
  async executeTool(
    tool: any,
    args: any,
    config?: ToolConfig,
    options?: ExecutionOptions
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const toolName = tool.name || "unknown_tool";

    try {
      // Set up timeout if specified
      let result: any;

      if (options?.timeout) {
        result = await this.executeWithTimeout(
          tool.invoke(args, config),
          options.timeout
        );
      } else {
        result = await tool.invoke(args, config);
      }

      const executionTime = Date.now() - startTime;

      const executionResult: ToolExecutionResult = {
        success: true,
        result,
        executionTime,
        toolName,
        args
      };

      this.addToHistory(executionResult);
      return executionResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const executionResult: ToolExecutionResult = {
        success: false,
        error: errorMessage,
        executionTime,
        toolName,
        args
      };

      this.addToHistory(executionResult);

      // Retry logic
      if (options?.retries && options.retries > 0) {
        if (options.retryDelay) {
          await this.delay(options.retryDelay);
        }

        return this.executeTool(tool, args, config, {
          ...options,
          retries: options.retries - 1
        });
      }

      return executionResult;
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeTools(
    tools: Array<{ tool: any; args: any; config?: ToolConfig }>,
    options?: ExecutionOptions
  ): Promise<ToolExecutionResult[]> {
    // Respect maxParallel limit
    if (options?.maxParallel && options.maxParallel > 0) {
      return this.executeWithConcurrencyLimit(tools, options);
    }

    const promises = tools.map(({ tool, args, config }) =>
      this.executeTool(tool, args, config, options)
    );

    return Promise.all(promises);
  }

  /**
   * Execute tools with concurrency limit
   */
  private async executeWithConcurrencyLimit(
    tools: Array<{ tool: any; args: any; config?: ToolConfig }>,
    options: ExecutionOptions
  ): Promise<ToolExecutionResult[]> {
    const maxParallel = options.maxParallel || 1;
    const results: ToolExecutionResult[] = [];

    for (let i = 0; i < tools.length; i += maxParallel) {
      const batch = tools.slice(i, i + maxParallel);
      const batchPromises = batch.map(({ tool, args, config }) =>
        this.executeTool(tool, args, config, options)
      );
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Execute tools sequentially
   */
  async executeToolsSequential(
    tools: Array<{ tool: any; args: any; config?: ToolConfig }>,
    options?: ExecutionOptions
  ): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const { tool, args, config } of tools) {
      const result = await this.executeTool(tool, args, config, options);
      results.push(result);

      // Stop on first failure if specified
      if (!result.success) {
        if (options?.onProgress) {
          options.onProgress(`Tool ${result.toolName} failed: ${result.error}`);
        }

        if (options?.stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add result to execution history
   */
  private addToHistory(result: ToolExecutionResult): void {
    this.executionHistory.push(result);

    // Trim history if too large
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get execution history
   */
  getHistory(): ToolExecutionResult[] {
    return [...this.executionHistory];
  }

  /**
   * Get history for specific tool
   */
  getToolHistory(toolName: string): ToolExecutionResult[] {
    return this.executionHistory.filter(r => r.toolName === toolName);
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    averageExecutionTime: number;
    byTool: Record<string, { count: number; successRate: number; averageTime: number }>;
  } {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(r => r.success).length;
    const failed = total - successful;

    const avgTime = total > 0
      ? this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0) / total
      : 0;

    const byTool: Record<string, { count: number; successRate: number; averageTime: number }> = {};

    this.executionHistory.forEach(result => {
      if (!byTool[result.toolName]) {
        byTool[result.toolName] = { count: 0, successRate: 0, averageTime: 0 };
      }

      byTool[result.toolName].count++;
    });

    // Calculate success rates and average time
    Object.keys(byTool).forEach(toolName => {
      const toolResults = this.getToolHistory(toolName);
      const successes = toolResults.filter(r => r.success).length;
      byTool[toolName].successRate = successes / toolResults.length;
      byTool[toolName].averageTime = toolResults.reduce((sum, r) => sum + r.executionTime, 0) / toolResults.length;
    });

    return {
      totalExecutions: total,
      successCount: successful,
      failureCount: failed,
      averageExecutionTime: avgTime,
      byTool
    };
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Format execution result for display
   */
  formatResult(result: ToolExecutionResult): string {
    const status = result.success ? "✅ SUCCESS" : "❌ FAILED";
    const time = `${result.executionTime}ms`;

    let output = `${status} [${result.toolName}] (${time})\n`;
    output += `Args: ${JSON.stringify(result.args)}\n`;

    if (result.success) {
      output += `Result: ${JSON.stringify(result.result)}`;
    } else {
      output += `Error: ${result.error}`;
    }

    return output;
  }

  /**
   * Format multiple results
   */
  formatResults(results: ToolExecutionResult[]): string {
    return results.map(r => this.formatResult(r)).join("\n\n");
  }
}

/**
 * Singleton executor instance
 */
export const defaultExecutor = new ToolExecutor();

/**
 * Execute a tool with the default executor
 */
export async function executeTool(
  tool: any,
  args: any,
  config?: ToolConfig,
  options?: ExecutionOptions
): Promise<ToolExecutionResult> {
  return defaultExecutor.executeTool(tool, args, config, options);
}

/**
 * Execute multiple tools in parallel with the default executor
 */
export async function executeTools(
  tools: Array<{ tool: any; args: any; config?: ToolConfig }>,
  options?: ExecutionOptions
): Promise<ToolExecutionResult[]> {
  return defaultExecutor.executeTools(tools, options);
}
