# Debugging Agent Middleware and Structured Output

This document outlines a debugging process for an issue encountered with LangChain agents when using middleware in conjunction with the `responseFormat` option for structured output.

## The Problem

The core issue was a conflict between the agent's middleware pipeline and the `responseFormat` feature.

1.  **Initial Error**: When using middleware, the agent would throw an error: `expected AIMessage, got object`.
2.  **Root Cause**:
    *   When `responseFormat` is used, the model invocation part of the agent correctly returns a parsed JavaScript `object`.
    *   However, the agent's internal `AgentNode` (which processes middleware) strictly expects an `AIMessage` instance to be returned from any `wrapModelCall` chain.
    *   This conflict between the expected type (`AIMessage`) and the actual returned type (`object`) caused the agent to crash.

## The Journey (Failed Attempts)

Several workarounds were attempted, which highlighted the nature of the problem:

1.  **The Defensive Wrapper**: A middleware was created to intercept the `object` and wrap it back into an `AIMessage` (e.g., `new AIMessage({ content: JSON.stringify(response) })`).
    *   **Result**: This solved the crash, but the agent's final `structuredResponse` field was `undefined`. The agent's final processing step did not know how to parse the JSON string from the `AIMessage`'s `content`.

2.  **Incorrect Middleware Implementation**: At one point, we incorrectly used `new AIMessage()` to create a system prompt instead of `new SystemMessage()`. This led to a different error (`dynamicSystemPromptMiddleware function must return a string`), which confirmed our understanding of how that specific helper works.

3.  **`additional_kwargs`**: An attempt was made to pass the structured object via the `additional_kwargs` of the `AIMessage`. This also did not work, as the final processing step does not look for the structured response there.

## The Solution & Workaround

The final solution acknowledges that this is a limitation or bug in the current version of the LangChain agent framework. The solution involves two parts:

1.  **Keep the Defensive Wrapper**: The middleware chain **must** return an `AIMessage`. So, we keep the middleware that wraps the `object` response into an `AIMessage` with a JSON string content. This gets us past the `AgentNode` error. The `middlewares.ts` file was updated accordingly.

2.  **Manual Parsing**: Since the agent fails to automatically parse the final `AIMessage`'s content back into the `structuredResponse` field, we must do it manually in our application code.

### Example Implementation

In `lessons/agents/index.ts`, we extract the content from the last message and parse it:

```typescript
// The agent's result object
const result_expert = await agent.invoke(...);

// Manually parse the structured response
const lastMessage = result_expert.messages.at(-1);
const structuredResponse = JSON.parse(lastMessage.content as string);

console.log("result_expert_structured", structuredResponse);
```

This approach successfully retrieves the structured data, providing a reliable workaround until the underlying framework bug is addressed.
