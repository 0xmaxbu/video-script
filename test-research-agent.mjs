import { researchAgent } from "./dist/mastra/agents/index.js";

// Test 1: Simple agent call without tools
console.log("Testing research agent...");
const result = await researchAgent.generate("Tell me about TypeScript generics. Just say hello.");
console.log("Output type:", typeof result.text);
console.log("First 100 chars:", result.text?.substring(0, 100));
console.log("Contains 'hello':", result.text?.toLowerCase().includes("hello"));
