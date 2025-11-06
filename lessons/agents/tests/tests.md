# Agent Testing Structure

## Overview
This directory contains comprehensive unit tests for all agent components, using Vitest for a Node.js-based workflow.

## Test Files

### 🛠️ `tools.test.ts`
Tests for agent tools:
- Search tool functionality and schema validation
- Weather tool functionality and schema validation
- Input/output validation
- Error handling

### 🔗 `middlewares.test.ts`
Tests for agent middlewares:
- Context schema validation (expert/beginner roles)
- Dynamic system prompt middleware
- Dynamic model selection middleware
- Tool error handling middleware

### 🤖 `models.test.ts`
Tests for AI models:
- Basic model (gpt-4o-mini) configuration
- Advanced model (gpt-4o) configuration
- Model differentiation
- Instance validation

### ⚙️ `index.test.ts`
Tests for agent configuration:
- Structured response format schema
- Component integration
- Import validation
- Message and context structure

## Running Tests

```bash
# Run all agent unit tests
npm run test:unit

# Run specific test file
npx vitest run lessons/agents/tests/tools.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Test Features

✅ **Proper assertions** - Uses `expect()` with real pass/fail conditions  
✅ **Isolated testing** - Each component tested independently  
✅ **Schema validation** - Tests Zod schemas and type safety  
✅ **Error handling** - Tests both success and failure scenarios  
✅ **Fast execution** - Vitest-powered test runner  
✅ **TypeScript support** - Full type checking in tests  

## API Integration Tests

For API endpoint testing, use:
```bash
# Run API integration tests (requires running server)
npm run test:api
```

See `../../test-api.ts` for comprehensive API endpoint testing including:
- Health endpoint validation
- Agent invoke endpoint testing
- Error handling validation
- CORS header verification
