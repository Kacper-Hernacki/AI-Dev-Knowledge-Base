import { isDevelopment } from "../config/env.js";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  static debug(message: string, data?: any): void {
    if (isDevelopment()) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  static info(message: string, data?: any): void {
    console.info(this.formatMessage('info', message, data));
  }

  static warn(message: string, data?: any): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  static error(message: string, data?: any): void {
    console.error(this.formatMessage('error', message, data));
  }

  static agentResponse(userRole: string, response: any): void {
    this.debug(`Agent response for ${userRole}`, {
      userRole,
      responseType: typeof response,
      hasContent: !!response?.structuredResponse,
    });
  }

  static toolCall(toolNames: string[]): void {
    this.info(`Calling tools: ${toolNames.join(', ')}`);
  }

  static streamChunk(content: string): void {
    this.debug(`Stream chunk: ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`);
  }
}