# Agent Testing Structure

## Overview

This directory contains comprehensive unit tests for the refactored agent architecture, using Bun's native test runner for optimal performance.

## Test Files

### 🛠️ `tools.test.ts`

Tests for agent tools:

- **Search tool** - Information retrieval functionality and schema validation
- **Deep Research tool** - Comprehensive analysis and multi-faceted insights
- **Legacy compatibility** - Backward compatibility with getWeather alias
- Input/output validation and error handling

### 🔗 `middlewares.test.ts`

Tests for agent middlewares (refactored structure):

- **Context schema validation** - Expert/beginner role handling
- **Dynamic system prompt** - Role-based prompt adaptation
- **Dynamic model selection** - Complexity-based model switching
- **Error handling** - Robust tool error recovery

### 🤖 `models.test.ts`

Tests for AI models (moved to config):

- **Basic model** (gpt-4o-mini) configuration and validation
- **Advanced model** (gpt-4o) configuration and validation
- **Environment validation** - API key and configuration checks
- **Model differentiation** - Separate instances and configs

### ⚙️ `index.test.ts`

Tests for the new architecture:

- **AgentFactory** - Factory pattern for agent creation
- **AgentService** - High-level business operations
- **ResponseParser** - JSON parsing and error handling
- **Schema validation** - Structured response format
- **Integration testing** - Component interaction

## Running Tests

```bash
# Run all agent unit tests
bun test

# Run specific test file
bun test lessons/agents/tests/tools.test.ts

# Run tests in watch mode
bun test --watch

# Run unit tests only
bun test lessons/agents/tests/
```

## Test Features

✅ **Clean Architecture** - Tests follow the new modular structure  
✅ **Factory Pattern** - Validates AgentFactory and AgentService  
✅ **Tool Integration** - Tests search and deepResearch tools  
✅ **Schema validation** - Tests Zod schemas and type safety  
✅ **Error handling** - Tests both success and failure scenarios  
✅ **Fast execution** - Bun's native test runner for optimal performance  
✅ **TypeScript support** - Full type checking in tests  
✅ **Legacy compatibility** - Ensures backward compatibility

## New Architecture Features Tested

🏭 **Factory Pattern** - AgentFactory.createArticleAgent() and variants  
🔧 **Service Layer** - AgentService business logic and operations  
📊 **Response Parsing** - Structured JSON response handling  
🛡️ **Error Recovery** - Graceful failure handling throughout  
🎯 **Role-based Logic** - Expert vs Beginner response differentiation  
🔍 **Deep Research** - Advanced analysis beyond basic search
