import { HumanMessage, type ToolCall } from "langchain";
import type { UserRole } from "../config/constants.js";
import type { 
  StreamOptions, 
  ParsedResponse, 
  ChunkData,
  ResponseParsingError 
} from "./types.js";
import { ResponseParser } from "../utils/response-parser.js";

export class AgentService {
  constructor(private agent: ReturnType<typeof import("./agent-factory.js").AgentFactory.createArticleAgent>) {}

  async generateArticle(prompt: string, userRole: UserRole): Promise<ParsedResponse> {
    const result = await this.agent.invoke(
      {
        messages: [new HumanMessage(prompt)],
        userPreferences: {},
      },
      { context: { userRole } }
    );
    
    return ResponseParser.parseStructuredResponse(result);
  }

  async compareRoleResponses(prompt: string): Promise<{
    beginner: ParsedResponse;
    expert: ParsedResponse;
  }> {
    const [beginnerResult, expertResult] = await Promise.all([
      this.generateArticle(prompt, "beginner"),
      this.generateArticle(prompt, "expert"),
    ]);
    
    return {
      beginner: beginnerResult,
      expert: expertResult,
    };
  }

  async *streamResponse(prompt: string, options: StreamOptions): AsyncGenerator<ChunkData> {
    const stream = await this.agent.stream(
      {
        messages: [new HumanMessage(prompt)],
        userPreferences: {},
      },
      {
        streamMode: options.streamMode || "values",
        context: { userRole: options.userRole }
      }
    );

    for await (const chunk of stream) {
      yield this.processChunk(chunk);
    }
  }

  private processChunk(chunk: any): ChunkData {
    const latestMessage = chunk.messages.at(-1);
    
    if (latestMessage?.content) {
      return {
        type: 'content',
        content: latestMessage.content,
      };
    } else if (latestMessage?.tool_calls) {
      const toolCallNames = latestMessage.tool_calls.map((tc: ToolCall) => tc.name);
      return {
        type: 'tool_call',
        toolCalls: toolCallNames,
      };
    }
    
    return { type: 'content' };
  }
}