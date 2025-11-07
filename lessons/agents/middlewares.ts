import { createMiddleware, ToolMessage, AIMessage } from "langchain";
import { SystemMessage } from "@langchain/core/messages";
import { advancedModel, basicModel } from "./models.js";
import z from "zod/v3";

// DynamicModelSelection middleware: returns AIMessage properly
const dynamicModelSelection = createMiddleware({
  name: "DynamicModelSelection",
  wrapModelCall: async (request, handler) => {
    // Choose model based on conversation complexity
    const messageCount = request.messages.length;

    // Call handler with chosen model
    const response = await handler({
      ...request,
      model: messageCount > 10 ? advancedModel : basicModel,
    });

    // Ensure response is AIMessage instance: if not, wrap it
    if (AIMessage.isInstance(response)) {
      return response;
    }
    const content =
      typeof response === "string" ? response : JSON.stringify(response);
    return new AIMessage({ content });
  },
});

// HandleToolErrors middleware: returns ToolMessage on error
const handleToolErrors = createMiddleware({
  name: "HandleToolErrors",
  wrapToolCall: (request, handler) => {
    try {
      return handler(request);
    } catch (error) {
      return new ToolMessage({
        content: `Tool error: Please check your input and try again. (${error})`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});

// Context schema with user roles
const contextSchema = z.object({
  userRole: z.enum(["expert", "beginner"]),
});

// Custom dynamicSystemPrompt middleware with proper wrapModelCall
const dynamicSystemPrompt = createMiddleware({
  name: "DynamicSystemPromptMiddleware",
  contextSchema, // Add this to inform TypeScript about the context type
  wrapModelCall: async (request, handler) => {
    // Call your function to get the prompt string
    const userRole = request.runtime.context.userRole || "beginner";
    let systemPrompt: string;
    if (userRole === "expert") {
      systemPrompt =
        "You are an expert AI assistant. Provide precise, technically detailed answers.";
    } else {
      systemPrompt =
        "You are a friendly AI tutor. Explain concepts clearly with simple language.";
    }

    // Wrap prompt into SystemMessage and prepend to messages
    const systemMessage = new SystemMessage(systemPrompt);
    const newRequest = {
      ...request,
      messages: [systemMessage, ...request.messages],
    };

    // Call the handler with modified request
    const response = await handler(newRequest);

    // Ensure response is AIMessage instance
    if (!AIMessage.isInstance(response)) {
      const content =
        typeof response === "string" ? response : JSON.stringify(response);
      return new AIMessage({ content });
    }
    return response;
  },
});

export {
  dynamicModelSelection,
  handleToolErrors,
  dynamicSystemPrompt,
  contextSchema,
};
