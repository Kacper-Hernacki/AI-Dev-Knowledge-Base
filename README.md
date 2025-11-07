# LangChain Lesson (Node + TypeScript)

Hands-on playground for building LangChain features in TypeScript. The repo includes an Express API starter (`src/`) plus a growing catalog of lessons under `lessons/` that mirror the official LangChain docs (core concepts + advanced concepts). Each lesson keeps code, docs, demos, and tests together so you can explore features like agents, models, streaming, structured output, and more.

## Requirements

- Node.js 20+ (LangChain relies on `AbortSignal.any`)
- Bun 1.1+ (used for demos and the Bun test runner)
- `cp` access to create `.env/.env` with provider keys (see below)

## Getting started

```bash
npm install          # install dependencies
npm run dev          # start the Express dev server with tsx
npm run start        # run src/index.ts without the file watcher
```

Create `.env/.env` (the repo already contains the directory) and add any keys you need:

```
PORT=3000
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
```

## NPM scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the API server with hot reload (`tsx --watch`) |
| `npm run start` | Start the API server in production mode |
| `npm run typecheck` | Run TypeScript in `--noEmit` mode |
| `npm test` | Run the Bun test suite (all lessons) |
| `npm run test:watch` | Watch mode for Bun tests |
| `npm run test:all` | Run Bun tests scoped to `lessons/` |
| `npm run agents:demo` | Execute the LangChain agents demo script |
| `npm run agents:test` / `npm run agents:test:watch` | Run agent-focused Bun tests |
| `npm run agents:examples` | Execute agent examples entry point |
| `npm run models:demo` | Run the models demo |
| `npm run models:test` / `npm run models:test:watch` | Run model-focused tests |
| `npm run models:examples` | Execute model examples entry |
| `npm run lessons:list` | Inspect top-level lesson directories |
| `npm run lessons:run` | Helper message that explains Bun commands per lesson |

> Most lesson scripts call Bun directly via `bun --env-file=.env ...`. Feel free to substitute a different runner if you prefer, but ensure environment variables are loaded.

## Repository layout

```
src/
  index.ts          # Express server bootstrap with /health route
  routes/           # add API routes here
  services/         # shared server/service logic
lessons/
  README.md         # high-level overview of lesson philosophy
  langchain/
    core-concepts/  # foundational topics (agents, messages, streaming, etc.)
    advanced-concepts/ # deeper topics (guardrails, retrieval, multi-agent, etc.)
```

Each lesson folder generally follows this pattern:

```
lesson-name/
  docs/lesson-name.md   # mirrors LangChain documentation
  demo.ts               # Bun runnable script
  examples/             # mini-scenarios
  tests/                # Bun test suites
  core|config|utils     # reusable code for the lesson
  lesson.md             # long-form walkthrough (where applicable)
```

If a lesson currently only contains docs, you will still see `docs/<lesson>.md` populated with a stub so contributors know what to fill in next.

## Working with lessons

1. **Read the docs** under `lessons/langchain/**/docs`. They summarize the concept directly from LangChain's latest guidance.
2. **Run the demo** via Bun (or the provided npm script) to see the concept in action, e.g. `npm run agents:demo` or `bun --env-file=.env lessons/langchain/core-concepts/streaming/demo.ts`.
3. **Open the tests** (Bun's native runner lives in each lesson's `tests/` directory) to understand expected behavior.
4. **Extend the examples** or **add new providers/tools**—all lessons are modular TypeScript modules.

## API server (optional)

The Express server in `src/` gives you a place to expose lesson outputs via REST. Currently it exposes `/health`; wire in lesson routes under `src/routes/` as you build end-to-end demos.

## Contributing

- Prefer TypeScript + Bun for new lessons.
- Keep lesson scaffolding consistent (`docs`, `demo.ts`, `tests`, etc.).
- Use the existing docs files as the canonical source when adding UI or blog content.
- Run `npm run typecheck` and `npm test` before opening a PR.

## References

- [LangChain JS Docs](https://js.langchain.com)
- [LangGraph](https://langchain.dev/langgraph)
- [Bun Test Runner](https://bun.sh/docs/test)
- [Express](https://expressjs.com)
