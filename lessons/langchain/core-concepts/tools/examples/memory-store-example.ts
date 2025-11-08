/**
 * Memory Store Example
 * Demonstrates how to use persistent memory with tools following LangChain patterns
 */

import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { InMemoryStore } from "@langchain/langgraph";

/**
 * Create memory-aware tools following LangChain's pattern
 */
export async function demonstrateMemoryStore() {
  console.log("\n💾 Memory Store Demo");
  console.log("=".repeat(50));

  // Create the store - tools will capture it via closure
  const store = new InMemoryStore();

  // Tool to get user info from memory
  const getUserInfo = tool(
    async ({ user_id }) => {
      const value = await store.get(["users"], user_id);
      console.log(`  📖 get_user_info: ${user_id}`, value);

      if (!value) {
        return `User ${user_id} not found in memory`;
      }

      return JSON.stringify(value);
    },
    {
      name: "get_user_info",
      description: "Look up user info from memory",
      schema: z.object({
        user_id: z.string()
      })
    }
  );

  // Tool to save user info to memory
  const saveUserInfo = tool(
    async ({ user_id, name, age, email }) => {
      console.log(`  💾 save_user_info: ${user_id}, ${name}, ${age}, ${email}`);
      await store.put(["users"], user_id, { name, age, email });
      return "Successfully saved user info";
    },
    {
      name: "save_user_info",
      description: "Save user info to memory",
      schema: z.object({
        user_id: z.string(),
        name: z.string(),
        age: z.number(),
        email: z.string()
      })
    }
  );

  // Tool to search users
  const searchUsers = tool(
    async () => {
      const items = await store.search(["users"]);
      const userIds = items.map((item: any) => item.key);
      console.log(`  📋 search_users:`, userIds);
      return `Found ${userIds.length} users: ${userIds.join(", ")}`;
    },
    {
      name: "search_users",
      description: "Search all users in memory",
      schema: z.object({})
    }
  );

  try {
    console.log("\n1️⃣ Save user info:");
    const saveResult = await saveUserInfo.invoke({
      user_id: "abc123",
      name: "Foo",
      age: 25,
      email: "foo@langchain.dev"
    });
    console.log(`  ✅ ${saveResult}`);

    console.log("\n2️⃣ Save another user:");
    await saveUserInfo.invoke({
      user_id: "def456",
      name: "Bar",
      age: 30,
      email: "bar@langchain.dev"
    });
    console.log(`  ✅ User saved`);

    console.log("\n3️⃣ Get user info:");
    const getResult = await getUserInfo.invoke({ user_id: "abc123" });
    console.log(`  ✅ Result: ${getResult}`);

    console.log("\n4️⃣ Search all users:");
    const searchResult = await searchUsers.invoke({});
    console.log(`  ✅ ${searchResult}`);

    console.log("\n5️⃣ Try to get non-existent user:");
    const notFound = await getUserInfo.invoke({ user_id: "xyz999" });
    console.log(`  ✅ ${notFound}`);

  } catch (error) {
    console.error("❌ Memory store demo failed:", error);
  }
}

/**
 * Demonstrate namespaced memory
 */
export async function demonstrateNamespacedMemory() {
  console.log("\n🗂️  Namespaced Memory Demo");
  console.log("=".repeat(50));

  const store = new InMemoryStore();

  // Tool to save preferences
  const savePreference = tool(
    async ({ user_id, key, value }) => {
      await store.put(["preferences", user_id], key, value);
      return `Saved preference ${key} for user ${user_id}`;
    },
    {
      name: "save_preference",
      description: "Save user preference",
      schema: z.object({
        user_id: z.string(),
        key: z.string(),
        value: z.string()
      })
    }
  );

  // Tool to get preference
  const getPreference = tool(
    async ({ user_id, key }) => {
      const item = await store.get(["preferences", user_id], key);
      // InMemoryStore returns { value, key, namespace, ... }
      return item?.value || `Preference ${key} not found`;
    },
    {
      name: "get_preference",
      description: "Get user preference",
      schema: z.object({
        user_id: z.string(),
        key: z.string()
      })
    }
  );

  try {
    console.log("\n📝 Saving preferences for different users:");

    await savePreference.invoke({
      user_id: "user1",
      key: "theme",
      value: "dark"
    });
    console.log("  ✅ Saved user1 theme preference");

    await savePreference.invoke({
      user_id: "user2",
      key: "theme",
      value: "light"
    });
    console.log("  ✅ Saved user2 theme preference");

    console.log("\n📖 Retrieving preferences:");
    const pref1 = await getPreference.invoke({
      user_id: "user1",
      key: "theme"
    });
    console.log(`  User1 theme: ${pref1}`);

    const pref2 = await getPreference.invoke({
      user_id: "user2",
      key: "theme"
    });
    console.log(`  User2 theme: ${pref2}`);

  } catch (error) {
    console.error("❌ Namespaced memory demo failed:", error);
  }
}

/**
 * Run all memory examples
 */
export async function runMemoryExamples() {
  await demonstrateMemoryStore();
  await demonstrateNamespacedMemory();

  console.log("\n" + "=".repeat(50));
  console.log("✅ Memory examples completed!");
  console.log("\n💡 Key takeaways:");
  console.log("   • Use namespaces to organize data: ['users'], ['preferences', user_id]");
  console.log("   • Store persists across tool invocations");
  console.log("   • Perfect for user preferences, session data, and context");
  console.log("=".repeat(50));
}

// Run if executed directly
if (import.meta.main) {
  runMemoryExamples().catch(console.error);
}
