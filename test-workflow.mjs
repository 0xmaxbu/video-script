/**
 * Test script for video generation workflow
 * Run: node test-workflow.mjs
 *
 * This script tests the complete video generation pipeline:
 * 1. Research Agent - gathers info from URLs
 * 2. Script Agent - creates video script with scenes
 * 3. Map Step - transforms output
 * 4. Human Review - (skipped with _skipReview)
 * 5. Screenshot Agent - captures images
 * 6. Compose Agent - generates Remotion project
 */

import { mastra } from "./src/mastra/index.js";
import { researchAgent } from "./src/mastra/agents/research-agent.js";
import { scriptAgent } from "./src/mastra/agents/script-agent.js";

// Test configuration
const TEST_TOPIC = "TypeScript 泛型详解";
const TEST_LINKS = [
  "https://www.typescriptlang.org/docs/handbook/2/generics.html",
];

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(section, message) {
  console.log(`${colors.cyan}[${section}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.yellow}❌ ${message}${colors.reset}`);
}

// ============================================
// STEP 1: Test Research Agent
// ============================================
async function testResearchAgent() {
  log("STEP 1", "Testing Research Agent...");

  try {
    const result = await researchAgent.run({
      input: {
        title: TEST_TOPIC,
        links: TEST_LINKS,
      },
    });

    const output = JSON.parse(result.text);
    logSuccess("Research Agent completed");

    console.log(`\n${colors.blue}=== Research Output ===${colors.reset}`);
    console.log(`Title: ${output.title}`);
    console.log(`Overview: ${output.overview?.slice(0, 100)}...`);
    console.log(`Key Points: ${output.keyPoints?.length || 0}`);
    console.log(`Scenes: ${output.scenes?.length || 0}`);
    console.log(`Sources: ${output.sources?.length || 0}`);

    return output;
  } catch (error) {
    logError(`Research Agent failed: ${error.message}`);
    throw error;
  }
}

// ============================================
// STEP 2: Test Script Agent
// ============================================
async function testScriptAgent(researchOutput) {
  log("STEP 2", "Testing Script Agent...");

  try {
    const result = await scriptAgent.run({
      input: {
        researchOutput,
        targetDuration: 180, // 3 minutes
      },
    });

    const output = JSON.parse(result.text);
    logSuccess("Script Agent completed");

    console.log(`\n${colors.blue}=== Script Output ===${colors.reset}`);
    console.log(`Title: ${output.title}`);
    console.log(`Total Duration: ${output.totalDuration}s`);
    console.log(`Scenes: ${output.scenes?.length || 0}`);

    if (output.scenes) {
      output.scenes.forEach((scene, i) => {
        console.log(
          `  Scene ${i + 1}: ${scene.title} (${scene.startTime}s - ${scene.endTime}s)`,
        );
      });
    }

    return output;
  } catch (error) {
    logError(`Script Agent failed: ${error.message}`);
    throw error;
  }
}

// ============================================
// STEP 3: Test Full Workflow
// ============================================
async function testWorkflow() {
  log("WORKFLOW", "Testing complete video generation workflow...");

  try {
    const workflow = mastra.workflows["video-generation-workflow"];

    if (!workflow) {
      throw new Error("Workflow not found in mastra instance");
    }

    console.log(
      `\n${colors.magenta}=== Starting Full Workflow ===${colors.reset}`,
    );

    // Run workflow with test input
    const result = await workflow.run({
      input: {
        title: TEST_TOPIC,
        links: TEST_LINKS,
      },
      runtimeVariables: {
        _skipReview: true,
      },
    });

    logSuccess("Workflow completed");

    console.log(`\n${colors.blue}=== Workflow Result ===${colors.reset}`);
    console.log(`Project Path: ${result.result?.projectPath}`);
    console.log(`Ready for Render: ${result.result?.readyForRender}`);
    console.log(`Video Config: ${JSON.stringify(result.result?.videoConfig)}`);

    if (result.result?.warnings) {
      console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
      result.result.warnings.forEach((w) => console.log(`  - ${w}`));
    }

    return result;
  } catch (error) {
    logError(`Workflow failed: ${error.message}`);
    throw error;
  }
}

// ============================================
// Main Test Runner
// ============================================
async function main() {
  console.log(
    `\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.cyan}║   Video Generation Test Suite         ║${colors.reset}`,
  );
  console.log(
    `${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`,
  );

  console.log(`Topic: ${TEST_TOPIC}`);
  console.log(`Links: ${TEST_LINKS.join(", ")}\n`);

  const args = process.argv.slice(2);
  const testMode = args[0] || "full";

  try {
    switch (testMode) {
      case "research":
        await testResearchAgent();
        break;

      case "script":
        const researchOutput = await testResearchAgent();
        await testScriptAgent(researchOutput);
        break;

      case "full":
      default:
        await testWorkflow();
        break;
    }

    console.log(
      `\n${colors.green}╔════════════════════════════════════════╗${colors.reset}`,
    );
    console.log(
      `${colors.green}║   All Tests Passed! 🎉                ║${colors.reset}`,
    );
    console.log(
      `${colors.green}╚════════════════════════════════════════╝${colors.reset}\n`,
    );
  } catch (error) {
    console.error(`\n${colors.yellow}Test failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests
main();
