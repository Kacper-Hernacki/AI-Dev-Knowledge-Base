import { createMiddleware, AIMessage } from "langchain";
import { SystemMessage } from "@langchain/core/messages";
import { Logger } from "../../utils/logger.js";
import { USER_ROLES, type UserRole } from "../../config/constants.js";

/**
 * System prompt templates for different user roles
 */
const SYSTEM_PROMPTS = {
  [USER_ROLES.EXPERT]: 
    "You are an expert AI assistant. Provide precise, technically detailed answers with industry best practices and advanced concepts.",
  
  [USER_ROLES.BEGINNER]: 
    "You are a friendly AI tutor. Explain concepts clearly with simple language, examples, and step-by-step guidance.",
} as const;

/**
 * DynamicSystemPrompt middleware: adapts system prompt based on user role
 * Provides context-aware responses for different expertise levels
 */
import z from "zod/v3";

const contextSchema = z.object({
  userRole: z.enum(["expert", "beginner"]),
});

export const dynamicSystemPrompt = createMiddleware({
  name: "DynamicSystemPromptMiddleware",
  contextSchema,
  wrapModelCall: async (request, handler) => {
    // Get user role from context, default to beginner
    const userRole = (request.runtime.context?.userRole as UserRole) || USER_ROLES.BEGINNER;
    const systemPrompt = SYSTEM_PROMPTS[userRole];
    
    Logger.debug(`System prompt applied for role: ${userRole}`, {
      userRole,
      promptLength: systemPrompt.length
    });

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
      const content = typeof response === "string" ? response : JSON.stringify(response);
      return new AIMessage({ content });
    }
    
    return response;
  },
});