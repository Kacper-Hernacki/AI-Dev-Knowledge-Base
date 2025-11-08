/**
 * Summarizer - Utilities for summarizing conversation history
 * Provides flexible summarization strategies
 */

import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Summarization configuration
 */
export interface SummarizerConfig {
  model: BaseChatModel;
  maxTokensBeforeSummary?: number;
  messagesToKeep?: number;
  summaryPrompt?: string;
  incrementalSummary?: boolean;
}

/**
 * Summarization result
 */
export interface SummaryResult {
  summary: string;
  originalCount: number;
  keptCount: number;
  summarizedCount: number;
}

/**
 * Summarizer class for conversation summarization
 */
export class Summarizer {
  private config: SummarizerConfig;
  private existingSummary?: string;

  constructor(config: SummarizerConfig) {
    this.config = {
      maxTokensBeforeSummary: 4000,
      messagesToKeep: 10,
      summaryPrompt: "Summarize the following conversation concisely:",
      incrementalSummary: false,
      ...config,
    };
  }

  /**
   * Check if summarization is needed
   */
  shouldSummarize(messages: BaseMessage[]): boolean {
    const totalLength = messages.reduce((sum, msg) => {
      const content = typeof msg.content === "string" ? msg.content : "";
      return sum + content.length;
    }, 0);

    return totalLength > (this.config.maxTokensBeforeSummary || 4000);
  }

  /**
   * Summarize messages
   */
  async summarize(messages: BaseMessage[]): Promise<SummaryResult> {
    const messagesToKeep = this.config.messagesToKeep || 10;

    // Get messages to summarize (all except the last N)
    const toSummarize = messages.slice(0, -messagesToKeep);
    const toKeep = messages.slice(-messagesToKeep);

    if (toSummarize.length === 0) {
      return {
        summary: this.existingSummary || "",
        originalCount: messages.length,
        keptCount: messages.length,
        summarizedCount: 0,
      };
    }

    // Create summary
    let prompt: string;
    if (this.config.incrementalSummary && this.existingSummary) {
      prompt = `Previous summary: ${this.existingSummary}\n\nNew messages:\n${this.formatMessages(
        toSummarize
      )}\n\nUpdate the summary to include new information:`;
    } else {
      prompt = `${this.config.summaryPrompt}\n\n${this.formatMessages(
        toSummarize
      )}`;
    }

    const response = await this.config.model.invoke([
      new HumanMessage(prompt),
    ]);

    const summary =
      typeof response.content === "string"
        ? response.content
        : "Summary created";

    this.existingSummary = summary;

    return {
      summary,
      originalCount: messages.length,
      keptCount: toKeep.length,
      summarizedCount: toSummarize.length,
    };
  }

  /**
   * Create messages with summary
   */
  async createMessagesWithSummary(
    messages: BaseMessage[]
  ): Promise<BaseMessage[]> {
    if (!this.shouldSummarize(messages)) {
      return messages;
    }

    const result = await this.summarize(messages);
    const messagesToKeep = this.config.messagesToKeep || 10;
    const recentMessages = messages.slice(-messagesToKeep);

    return [
      new SystemMessage(`Previous conversation summary: ${result.summary}`),
      ...recentMessages,
    ];
  }

  /**
   * Format messages for summarization
   */
  private formatMessages(messages: BaseMessage[]): string {
    return messages
      .map((msg) => {
        const type = msg.getType();
        const content = typeof msg.content === "string" ? msg.content : "";
        return `${type}: ${content}`;
      })
      .join("\n");
  }

  /**
   * Reset summarizer state
   */
  reset(): void {
    this.existingSummary = undefined;
  }

  /**
   * Get existing summary
   */
  getExistingSummary(): string | undefined {
    return this.existingSummary;
  }
}

/**
 * Summarization strategies
 */
export class SummarizationStrategies {
  /**
   * Full history summarization
   */
  static fullHistory(config: {
    model: BaseChatModel;
    prompt?: string;
  }): Summarizer {
    return new Summarizer({
      model: config.model,
      messagesToKeep: 0,
      summaryPrompt: config.prompt || "Summarize the entire conversation:",
      incrementalSummary: false,
    });
  }

  /**
   * Rolling window summarization
   */
  static rollingWindow(config: {
    model: BaseChatModel;
    windowSize?: number;
  }): Summarizer {
    return new Summarizer({
      model: config.model,
      messagesToKeep: config.windowSize || 10,
      incrementalSummary: true,
    });
  }

  /**
   * Hierarchical summarization
   */
  static async hierarchical(
    messages: BaseMessage[],
    model: BaseChatModel,
    chunkSize = 20
  ): Promise<string> {
    if (messages.length <= chunkSize) {
      const summarizer = new Summarizer({ model });
      const result = await summarizer.summarize(messages);
      return result.summary;
    }

    // Split into chunks
    const chunks: BaseMessage[][] = [];
    for (let i = 0; i < messages.length; i += chunkSize) {
      chunks.push(messages.slice(i, i + chunkSize));
    }

    // Summarize each chunk
    const chunkSummaries: string[] = [];
    for (const chunk of chunks) {
      const summarizer = new Summarizer({ model });
      const result = await summarizer.summarize(chunk);
      chunkSummaries.push(result.summary);
    }

    // Create summary of summaries
    const summaryMessages = chunkSummaries.map(
      (summary, i) => new HumanMessage(`Chunk ${i + 1}: ${summary}`)
    );

    const finalPrompt = new HumanMessage(
      `Summarize these summaries into a cohesive overview:\n${chunkSummaries.join(
        "\n\n"
      )}`
    );

    const finalResponse = await model.invoke([finalPrompt]);

    return typeof finalResponse.content === "string"
      ? finalResponse.content
      : "Hierarchical summary created";
  }
}
