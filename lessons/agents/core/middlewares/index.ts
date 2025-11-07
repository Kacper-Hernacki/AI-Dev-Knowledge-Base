// Middleware exports with proper organization
export { handleToolErrors } from "./error-handler.js";
export { dynamicModelSelection } from "./model-selection.js";
export { dynamicSystemPrompt } from "./system-prompt.js";

// Legacy context schema export for backward compatibility
import z from "zod/v3";
export const contextSchema = z.object({
  userRole: z.enum(["expert", "beginner"]),
});

// Middleware configuration helper
export function getDefaultMiddlewares() {
  return [
    handleToolErrors,
    dynamicSystemPrompt,
    dynamicModelSelection,
  ];
}