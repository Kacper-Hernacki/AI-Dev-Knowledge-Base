// Export all examples for easy access
export { basicUsageExample } from "./basic-usage.js";
export { demonstrateRoleComparison } from "./comparison.js";
export { streamingExample } from "./streaming.js";

// Example runner function
export async function runAllExamples() {
  const { basicUsageExample } = await import("./basic-usage.js");
  const { demonstrateRoleComparison } = await import("./comparison.js");
  const { streamingExample } = await import("./streaming.js");
  
  console.log("🚀 Running all agent examples...\n");
  
  try {
    console.log("1️⃣  Basic Usage Example");
    await basicUsageExample();
    
    console.log("\n2️⃣  Role Comparison Example");
    await demonstrateRoleComparison();
    
    console.log("\n3️⃣  Streaming Example");
    await streamingExample();
    
    console.log("\n✅ All examples completed successfully!");
  } catch (error) {
    console.error("\n❌ Example execution failed:", error);
    throw error;
  }
}

// Run all examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}