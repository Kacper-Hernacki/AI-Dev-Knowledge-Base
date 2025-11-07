import { createMiddleware, AIMessage } from "langchain";
import { Logger } from "../../utils/logger.js";
import { AGENT_CONFIG } from "../../config/constants.js";

/**
 * DynamicModelSelection middleware: chooses model based on conversation complexity
 * Automatically upgrades to advanced model for complex conversations
 */
export const dynamicModelSelection = createMiddleware({
  name: "DynamicModelSelection",
  wrapModelCall: async (request, handler) => {
    // Choose model based on conversation complexity
    const messageCount = request.messages.length;
    const isComplex = messageCount > AGENT_CONFIG.limits.complexityThreshold;
    
    // Import models dynamically to avoid circular dependencies
    const { basicModel, advancedModel } = await import("../../config/models.js");
    const selectedModel = isComplex ? advancedModel : basicModel;
    
    Logger.debug(`Model selection: ${isComplex ? 'advanced' : 'basic'}`, {
      messageCount,
      threshold: AGENT_CONFIG.limits.complexityThreshold,
      modelName: isComplex ? AGENT_CONFIG.models.advanced : AGENT_CONFIG.models.base
    });

    // Call handler with chosen model
    const response = await handler({
      ...request,
      model: selectedModel,
    });

    // Ensure response is AIMessage instance: if not, wrap it
    if (AIMessage.isInstance(response)) {
      return response;
    }
    
    const content = typeof response === "string" ? response : JSON.stringify(response);
    return new AIMessage({ content });
  },
});