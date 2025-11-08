/**
 * Messages Lesson Demo
 * Interactive demonstration of all message features
 */

import { runAllExamples } from "./examples/index.js";

console.log("╔═══════════════════════════════════════════════════════════╗");
console.log("║     LangChain Messages Lesson - Interactive Demo         ║");
console.log("╚═══════════════════════════════════════════════════════════╝");

console.log("\n📚 This demo showcases:");
console.log("  • Basic message creation (system, human, AI, tool)");
console.log("  • Multimodal messages (images, PDFs, audio, video)");
console.log("  • Conversation management and history");
console.log("  • Message parsing and content extraction");
console.log("  • Token usage tracking and cost calculation");
console.log("  • Message validation and transformations");
console.log("\n" + "─".repeat(60) + "\n");

// Run all examples
await runAllExamples();

console.log("\n" + "═".repeat(60));
console.log("✨ Demo completed!");
console.log("═".repeat(60));
