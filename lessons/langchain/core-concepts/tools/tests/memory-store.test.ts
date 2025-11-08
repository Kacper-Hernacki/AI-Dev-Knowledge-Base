/**
 * Tests for InMemoryStore integration
 */

import { describe, test, expect } from "bun:test";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { InMemoryStore } from "@langchain/langgraph";

describe("InMemoryStore Integration", () => {
  describe("Basic store operations", () => {
    test("should save and retrieve data using closure pattern", async () => {
      const store = new InMemoryStore();

      const saveTool = tool(
        async ({ key, value }) => {
          await store.put(["test"], key, value);
          return "Saved";
        },
        {
          name: "save",
          description: "Save data",
          schema: z.object({
            key: z.string(),
            value: z.string()
          })
        }
      );

      const getTool = tool(
        async ({ key }) => {
          const item = await store.get(["test"], key);
          return item?.value || "Not found";
        },
        {
          name: "get",
          description: "Get data",
          schema: z.object({
            key: z.string()
          })
        }
      );

      await saveTool.invoke({ key: "foo", value: "bar" });
      const result = await getTool.invoke({ key: "foo" });

      expect(result).toBe("bar");
    });

    test("should handle non-existent keys", async () => {
      const store = new InMemoryStore();

      const getTool = tool(
        async ({ key }) => {
          const item = await store.get(["test"], key);
          return item?.value || "Not found";
        },
        {
          name: "get",
          description: "Get data",
          schema: z.object({
            key: z.string()
          })
        }
      );

      const result = await getTool.invoke({ key: "nonexistent" });
      expect(result).toBe("Not found");
    });

    test("should return metadata with values", async () => {
      const store = new InMemoryStore();

      await store.put(["test"], "key1", "value1");
      const item = await store.get(["test"], "key1");

      expect(item).toHaveProperty("value");
      expect(item).toHaveProperty("key");
      expect(item).toHaveProperty("namespace");
      expect(item).toHaveProperty("createdAt");
      expect(item).toHaveProperty("updatedAt");

      expect(item?.value).toBe("value1");
      expect(item?.key).toBe("key1");
      expect(item?.namespace).toEqual(["test"]);
    });
  });

  describe("Namespaced storage", () => {
    test("should isolate data in different namespaces", async () => {
      const store = new InMemoryStore();

      const saveUser = tool(
        async ({ user_id, name }) => {
          await store.put(["users"], user_id, { name });
          return "Saved";
        },
        {
          name: "save_user",
          description: "Save user",
          schema: z.object({
            user_id: z.string(),
            name: z.string()
          })
        }
      );

      const savePref = tool(
        async ({ user_id, key, value }) => {
          await store.put(["preferences", user_id], key, value);
          return "Saved";
        },
        {
          name: "save_pref",
          description: "Save preference",
          schema: z.object({
            user_id: z.string(),
            key: z.string(),
            value: z.string()
          })
        }
      );

      await saveUser.invoke({ user_id: "user1", name: "Alice" });
      await savePref.invoke({ user_id: "user1", key: "theme", value: "dark" });

      const userItem = await store.get(["users"], "user1");
      const prefItem = await store.get(["preferences", "user1"], "theme");

      expect(userItem?.value).toEqual({ name: "Alice" });
      expect(prefItem?.value).toBe("dark");
    });

    test("should support nested namespaces", async () => {
      const store = new InMemoryStore();

      await store.put(["app", "settings", "user1"], "language", "en");
      await store.put(["app", "settings", "user2"], "language", "fr");

      const item1 = await store.get(["app", "settings", "user1"], "language");
      const item2 = await store.get(["app", "settings", "user2"], "language");

      expect(item1?.value).toBe("en");
      expect(item2?.value).toBe("fr");
    });
  });

  describe("Search functionality", () => {
    test("should search items in namespace", async () => {
      const store = new InMemoryStore();

      const searchTool = tool(
        async ({ namespace }) => {
          const items = await store.search(namespace);
          return items.map((item: any) => item.key);
        },
        {
          name: "search",
          description: "Search items",
          schema: z.object({
            namespace: z.array(z.string())
          })
        }
      );

      await store.put(["users"], "user1", { name: "Alice" });
      await store.put(["users"], "user2", { name: "Bob" });
      await store.put(["users"], "user3", { name: "Charlie" });

      const keys = await searchTool.invoke({ namespace: ["users"] });

      expect(keys).toHaveLength(3);
      expect(keys).toContain("user1");
      expect(keys).toContain("user2");
      expect(keys).toContain("user3");
    });

    test("should return empty array for empty namespace", async () => {
      const store = new InMemoryStore();

      const items = await store.search(["empty"]);

      expect(items).toEqual([]);
    });
  });

  describe("Complex data types", () => {
    test("should store and retrieve objects", async () => {
      const store = new InMemoryStore();

      const userTool = tool(
        async ({ user_id, data }) => {
          await store.put(["users"], user_id, data);
          return "Saved";
        },
        {
          name: "save_user",
          description: "Save user",
          schema: z.object({
            user_id: z.string(),
            data: z.object({
              name: z.string(),
              age: z.number(),
              email: z.string()
            })
          })
        }
      );

      await userTool.invoke({
        user_id: "123",
        data: {
          name: "Alice",
          age: 30,
          email: "alice@example.com"
        }
      });

      const item = await store.get(["users"], "123");

      expect(item?.value).toEqual({
        name: "Alice",
        age: 30,
        email: "alice@example.com"
      });
    });

    test("should store and retrieve arrays", async () => {
      const store = new InMemoryStore();

      await store.put(["cart"], "session1", ["item1", "item2", "item3"]);
      const item = await store.get(["cart"], "session1");

      expect(item?.value).toEqual(["item1", "item2", "item3"]);
    });
  });

  describe("Multiple tools sharing store", () => {
    test("should allow multiple tools to access same store", async () => {
      const store = new InMemoryStore();

      const addTool = tool(
        async ({ key, value }) => {
          const existing = await store.get(["counter"], key);
          const newValue = (existing?.value || 0) + value;
          await store.put(["counter"], key, newValue);
          return newValue;
        },
        {
          name: "add",
          description: "Add to counter",
          schema: z.object({
            key: z.string(),
            value: z.number()
          })
        }
      );

      const getTool = tool(
        async ({ key }) => {
          const item = await store.get(["counter"], key);
          return item?.value || 0;
        },
        {
          name: "get",
          description: "Get counter",
          schema: z.object({
            key: z.string()
          })
        }
      );

      await addTool.invoke({ key: "clicks", value: 5 });
      await addTool.invoke({ key: "clicks", value: 3 });
      const result = await getTool.invoke({ key: "clicks" });

      expect(result).toBe(8);
    });
  });

  describe("Delete operations", () => {
    test("should delete items from store", async () => {
      const store = new InMemoryStore();

      await store.put(["test"], "key1", "value1");
      let item = await store.get(["test"], "key1");
      expect(item?.value).toBe("value1");

      await store.delete(["test"], "key1");
      item = await store.get(["test"], "key1");
      expect(item).toBe(null);
    });

    test("should handle deleting non-existent keys", async () => {
      const store = new InMemoryStore();

      // Should not throw
      await store.delete(["test"], "nonexistent");

      const item = await store.get(["test"], "nonexistent");
      expect(item).toBe(null);
    });
  });
});
