/**
 * Message Builder - Factory for creating LangChain messages
 * Provides a fluent interface for building complex messages with multimodal content
 */

import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  type BaseMessage
} from "@langchain/core/messages";

/**
 * Content block types for multimodal messages
 */
export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  source_type: "url" | "base64" | "id";
  url?: string;
  data?: string;
  id?: string;
  mimeType?: string;
}

export interface AudioContent {
  type: "audio";
  source_type: "base64" | "id";
  data?: string;
  id?: string;
  mimeType?: string;
}

export interface VideoContent {
  type: "video";
  source_type: "base64" | "id";
  data?: string;
  id?: string;
  mimeType?: string;
}

export interface FileContent {
  type: "file";
  source_type: "url" | "base64" | "id";
  url?: string;
  data?: string;
  id?: string;
  mimeType?: string;
  filename?: string;
}

export type ContentBlock =
  | TextContent
  | ImageContent
  | AudioContent
  | VideoContent
  | FileContent;

/**
 * Message Builder for creating messages with a fluent API
 */
export class MessageBuilder {
  /**
   * Create a system message with instructions
   */
  static system(content: string): SystemMessage {
    return new SystemMessage(content);
  }

  /**
   * Create a human message (user input)
   */
  static human(content: string): HumanMessage {
    return new HumanMessage(content);
  }

  /**
   * Create a human message with metadata
   */
  static humanWithMetadata(
    content: string,
    metadata: { name?: string; id?: string; [key: string]: any }
  ): HumanMessage {
    return new HumanMessage({
      content,
      ...metadata
    });
  }

  /**
   * Create an AI message (assistant response)
   */
  static ai(content: string): AIMessage {
    return new AIMessage(content);
  }

  /**
   * Create a tool message with execution results
   */
  static tool(
    content: string,
    toolCallId: string,
    toolName?: string
  ): ToolMessage {
    return new ToolMessage({
      content,
      tool_call_id: toolCallId,
      name: toolName
    });
  }

  /**
   * Create a tool message with artifact data
   */
  static toolWithArtifact(
    content: string,
    toolCallId: string,
    toolName: string,
    artifact: Record<string, any>
  ): ToolMessage {
    return new ToolMessage({
      content,
      tool_call_id: toolCallId,
      name: toolName,
      artifact
    });
  }

  /**
   * Create a multimodal human message
   */
  static multimodal(contentBlocks: ContentBlock[]): HumanMessage {
    return new HumanMessage({
      content: contentBlocks as any
    });
  }

  /**
   * Create a message with image from URL
   */
  static withImage(text: string, imageUrl: string): HumanMessage {
    return new HumanMessage({
      content: [
        { type: "text", text },
        {
          type: "image",
          source_type: "url",
          url: imageUrl
        }
      ] as any
    });
  }

  /**
   * Create a message with image from base64 data
   */
  static withImageData(text: string, imageData: string, mimeType: string = "image/jpeg"): HumanMessage {
    return new HumanMessage({
      content: [
        { type: "text", text },
        {
          type: "image",
          source_type: "base64",
          data: imageData,
          mimeType
        }
      ] as any
    });
  }

  /**
   * Create a message with PDF document
   */
  static withPDF(text: string, pdfUrl: string): HumanMessage {
    return new HumanMessage({
      content: [
        { type: "text", text },
        {
          type: "file",
          source_type: "url",
          url: pdfUrl,
          mimeType: "application/pdf"
        }
      ] as any
    });
  }

  /**
   * Create a message with audio
   */
  static withAudio(text: string, audioData: string, mimeType: string = "audio/mpeg"): HumanMessage {
    return new HumanMessage({
      content: [
        { type: "text", text },
        {
          type: "audio",
          source_type: "base64",
          data: audioData,
          mimeType
        }
      ] as any
    });
  }

  /**
   * Create a conversation from an array of role/content pairs
   */
  static conversation(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  ): BaseMessage[] {
    return messages.map(({ role, content }) => {
      switch (role) {
        case "system":
          return this.system(content);
        case "user":
          return this.human(content);
        case "assistant":
          return this.ai(content);
        default:
          throw new Error(`Unknown role: ${role}`);
      }
    });
  }

  /**
   * Create messages from OpenAI chat format
   */
  static fromChatFormat(
    messages: Array<{
      role: string;
      content: string | ContentBlock[];
      name?: string;
    }>
  ): BaseMessage[] {
    return messages.map((msg) => {
      const content = msg.content;
      const metadata = msg.name ? { name: msg.name } : {};

      switch (msg.role) {
        case "system":
          return new SystemMessage({ content, ...metadata });
        case "user":
          return new HumanMessage({ content, ...metadata });
        case "assistant":
          return new AIMessage({ content, ...metadata });
        default:
          throw new Error(`Unknown role: ${msg.role}`);
      }
    });
  }
}

/**
 * Fluent builder for creating complex multimodal messages
 */
export class MultimodalMessageBuilder {
  private contentBlocks: ContentBlock[] = [];

  /**
   * Add text content
   */
  addText(text: string): this {
    this.contentBlocks.push({ type: "text", text });
    return this;
  }

  /**
   * Add image from URL
   */
  addImageUrl(url: string, mimeType?: string): this {
    this.contentBlocks.push({
      type: "image",
      source_type: "url",
      url,
      mimeType
    });
    return this;
  }

  /**
   * Add image from base64 data
   */
  addImageData(data: string, mimeType: string = "image/jpeg"): this {
    this.contentBlocks.push({
      type: "image",
      source_type: "base64",
      data,
      mimeType
    });
    return this;
  }

  /**
   * Add PDF document
   */
  addPDF(url: string, filename?: string): this {
    this.contentBlocks.push({
      type: "file",
      source_type: "url",
      url,
      mimeType: "application/pdf",
      filename
    });
    return this;
  }

  /**
   * Add audio content
   */
  addAudio(data: string, mimeType: string = "audio/mpeg"): this {
    this.contentBlocks.push({
      type: "audio",
      source_type: "base64",
      data,
      mimeType
    });
    return this;
  }

  /**
   * Add video content
   */
  addVideo(data: string, mimeType: string = "video/mp4"): this {
    this.contentBlocks.push({
      type: "video",
      source_type: "base64",
      data,
      mimeType
    });
    return this;
  }

  /**
   * Build the final HumanMessage
   */
  build(): HumanMessage {
    if (this.contentBlocks.length === 0) {
      throw new Error("Cannot build message with no content blocks");
    }

    return new HumanMessage({
      content: this.contentBlocks as any
    });
  }

  /**
   * Clear all content blocks and start fresh
   */
  clear(): this {
    this.contentBlocks = [];
    return this;
  }
}
