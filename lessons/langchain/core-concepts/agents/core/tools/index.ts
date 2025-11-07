// Tool exports with proper organization
export { search } from "./search-tool.js";
export { deepResearch } from "./deep-research-tool.js";

// Import tools for internal use
import { search } from "./search-tool.js";
import { deepResearch } from "./deep-research-tool.js";

// Legacy alias for backward compatibility
export { deepResearch as getWeather } from "./deep-research-tool.js";

// Tool collection helpers
export const DEFAULT_TOOLS = {
  search,
  deepResearch,
} as const;

export function getAllTools() {
  return Object.values(DEFAULT_TOOLS);
}

export function getToolsByCategory() {
  return {
    information: [search, deepResearch],
    research: [deepResearch],
    analysis: [deepResearch],
  };
}

// Tool registry for dynamic loading
export const TOOL_REGISTRY = new Map<string, any>([
  ["search", search],
  ["deep_research", deepResearch],
  ["deepResearch", deepResearch], // camelCase alias
  ["research", deepResearch], // short alias
]);

export function getToolByName(name: string) {
  return TOOL_REGISTRY.get(name);
}