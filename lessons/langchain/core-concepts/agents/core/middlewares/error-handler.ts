import { createMiddleware, ToolMessage } from "langchain";
import { Logger } from "../../utils/logger.js";

/**
 * HandleToolErrors middleware: returns ToolMessage on error
 * Provides structured error handling for tool calls
 */
export const handleToolErrors = createMiddleware({
  name: "HandleToolErrors",
  wrapToolCall: (request, handler) => {
    try {
      const result = handler(request);
      Logger.debug(`Tool call successful: ${request.toolCall.name}`);
      return result;
    } catch (error) {
      const errorMessage = `Tool error: Please check your input and try again. (${error})`;
      
      Logger.error(`Tool call failed: ${request.toolCall.name}`, {
        toolName: request.toolCall.name,
        error: error instanceof Error ? error.message : String(error),
        request: request.toolCall.args
      });
      
      return new ToolMessage({
        content: errorMessage,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});