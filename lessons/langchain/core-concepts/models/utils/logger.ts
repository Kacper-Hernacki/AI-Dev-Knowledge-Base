/**
 * Logger utility for models lesson
 * Provides structured logging for model operations
 */

export interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

export class Logger {
  private static logHistory: LogEntry[] = [];
  private static maxHistorySize = 100;

  /**
   * Log info message
   */
  static info(message: string, data?: Record<string, any>): void {
    this.log("info", message, data);
  }

  /**
   * Log warning message
   */
  static warn(message: string, data?: Record<string, any>): void {
    this.log("warn", message, data);
  }

  /**
   * Log error message
   */
  static error(message: string, data?: Record<string, any>): void {
    this.log("error", message, data);
  }

  /**
   * Log debug message
   */
  static debug(message: string, data?: Record<string, any>): void {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG) {
      this.log("debug", message, data);
    }
  }

  /**
   * Core logging method
   */
  private static log(level: LogEntry["level"], message: string, data?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    // Add to history
    this.logHistory.push(entry);
    
    // Maintain max history size
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }

    // Console output
    const prefix = this.getPrefix(level);
    const dataStr = data ? ` ${JSON.stringify(data, null, 2)}` : "";
    
    switch (level) {
      case "info":
        console.log(`${prefix} ${message}${dataStr}`);
        break;
      case "warn":
        console.warn(`${prefix} ${message}${dataStr}`);
        break;
      case "error":
        console.error(`${prefix} ${message}${dataStr}`);
        break;
      case "debug":
        console.debug(`${prefix} ${message}${dataStr}`);
        break;
    }
  }

  /**
   * Get emoji prefix for log level
   */
  private static getPrefix(level: LogEntry["level"]): string {
    const prefixes = {
      info: "ℹ️ ",
      warn: "⚠️ ",
      error: "❌",
      debug: "🔍"
    };
    return prefixes[level];
  }

  /**
   * Get log history
   */
  static getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Get log history filtered by level
   */
  static getHistoryByLevel(level: LogEntry["level"]): LogEntry[] {
    return this.logHistory.filter(entry => entry.level === level);
  }

  /**
   * Clear log history
   */
  static clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON
   */
  static exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Get performance summary from logs
   */
  static getPerformanceSummary(): {
    totalOperations: number;
    averageLatency: number;
    errors: number;
    warnings: number;
    operationsByType: Record<string, number>;
  } {
    const operations = this.logHistory.filter(entry => 
      entry.data?.latency !== undefined || 
      entry.message.includes("completed") ||
      entry.message.includes("failed")
    );

    const latencies = operations
      .filter(entry => entry.data?.latency)
      .map(entry => entry.data!.latency as number);

    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length 
      : 0;

    const errors = this.getHistoryByLevel("error").length;
    const warnings = this.getHistoryByLevel("warn").length;

    // Count operations by type
    const operationsByType: Record<string, number> = {};
    operations.forEach(entry => {
      const operationType = this.extractOperationType(entry.message);
      operationsByType[operationType] = (operationsByType[operationType] || 0) + 1;
    });

    return {
      totalOperations: operations.length,
      averageLatency: Math.round(averageLatency),
      errors,
      warnings,
      operationsByType
    };
  }

  /**
   * Extract operation type from log message
   */
  private static extractOperationType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("text generation")) return "text_generation";
    if (lowerMessage.includes("streaming")) return "streaming";
    if (lowerMessage.includes("batch")) return "batch";
    if (lowerMessage.includes("movie")) return "movie_info";
    if (lowerMessage.includes("article")) return "article_summary";
    if (lowerMessage.includes("classification")) return "classification";
    if (lowerMessage.includes("conversation")) return "conversation";
    if (lowerMessage.includes("comparison")) return "model_comparison";
    if (lowerMessage.includes("model created")) return "model_creation";
    
    return "other";
  }
}