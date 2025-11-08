/**
 * PostgreSQL Checkpointer Example
 * Demonstrates production-grade persistence with PostgresSaver
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

/**
 * Demonstrate PostgreSQL-backed memory for production
 */
export async function demonstratePostgresMemory() {
  console.log("\n🐘 PostgreSQL Checkpointer");
  console.log("=".repeat(50));

  console.log("\n📋 Setup Instructions:");
  console.log("  1. Install PostgreSQL locally:");
  console.log("     brew install postgresql");
  console.log("\n  2. Start PostgreSQL:");
  console.log("     brew services start postgresql");
  console.log("\n  3. Create database:");
  console.log("     createdb langchain_memory");
  console.log("\n  4. Set connection string:");
  console.log(
    '     DB_URI="postgresql://postgres:postgres@localhost:5432/langchain_memory"'
  );

  // Connection string - configure for your environment
  const DB_URI = process.env.POSTGRES_URI ||
    "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";

  try {
    console.log("\n🔌 Connecting to PostgreSQL...");
    const checkpointer = PostgresSaver.fromConnString(DB_URI);
    await checkpointer.setup();
    console.log("  ✅ Connected successfully!");

    // Initialize model
    const model = new ChatAnthropic({
      model: "claude-3-5-haiku-20241022",
      temperature: 0,
    });

    // Create agent with PostgreSQL checkpointer
    const agent = createReactAgent({
      llm: model,
      tools: [],
      checkpointSaver: checkpointer,
    });

    const config = { configurable: { thread_id: "postgres_thread_1" } };

    console.log("\n1️⃣ Saving conversation to PostgreSQL:");
    const response1 = await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: "Remember this: my user ID is user_12345",
          },
        ],
      },
      config
    );
    console.log(
      `  AI: ${response1.messages[response1.messages.length - 1].content}`
    );

    console.log("\n2️⃣ Retrieving from PostgreSQL:");
    const response2 = await agent.invoke(
      { messages: [{ role: "user", content: "What's my user ID?" }] },
      config
    );
    console.log(
      `  AI: ${response2.messages[response2.messages.length - 1].content}`
    );

    console.log("\n✅ Data persists in PostgreSQL across restarts!");
    console.log("💡 Tip: Check your database to see stored checkpoints");
  } catch (error) {
    console.error("❌ PostgreSQL demo failed:", error);
    console.log("\n⚠️  Make sure PostgreSQL is running and accessible!");
  }
}

/**
 * Demonstrate checkpoint management
 */
export async function demonstrateCheckpointManagement() {
  console.log("\n📊 Checkpoint Management");
  console.log("=".repeat(50));

  const DB_URI = process.env.POSTGRES_URI ||
    "postgresql://postgres:postgres@localhost:5442/postgres?sslmode=disable";

  try {
    const checkpointer = PostgresSaver.fromConnString(DB_URI);
    await checkpointer.setup();

    console.log("\n💡 PostgreSQL Features:");
    console.log("  • Persistent storage across application restarts");
    console.log("  • Scalable for production workloads");
    console.log("  • Thread isolation for multiple conversations");
    console.log("  • Automatic checkpoint versioning");
    console.log("  • Transaction support for consistency");

    console.log("\n📝 Best Practices:");
    console.log("  • Use connection pooling for high traffic");
    console.log("  • Implement cleanup for old conversations");
    console.log("  • Monitor database size and performance");
    console.log("  • Use indexes on thread_id for fast lookups");
  } catch (error) {
    console.error("❌ Checkpoint management demo failed:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  await demonstratePostgresMemory();
  await demonstrateCheckpointManagement();
}
