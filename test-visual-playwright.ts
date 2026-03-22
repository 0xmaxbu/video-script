#!/usr/bin/env node
/**
 * Test script for Visual Agent output using Playwright
 * Captures screenshots of media resources defined in visual.json
 */

import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { z } from "zod";

const VisualSchema = z.object({
  scenes: z.array(z.object({
    sceneId: z.string(),
    layoutTemplate: z.string(),
    mediaResources: z.array(z.object({
      id: z.string(),
      type: z.string(),
      url: z.string(),
      role: z.string(),
    })).optional(),
  })),
});

async function testVisualOutput(visualPath: string, outputDir: string) {
  console.log(`\n🎨 Testing Visual Agent output...`);
  console.log(`   Input: ${visualPath}`);
  console.log(`   Output: ${outputDir}\n`);

  // Read visual.json
  if (!existsSync(visualPath)) {
    console.error(`❌ visual.json not found at ${visualPath}`);
    process.exit(1);
  }

  const visualContent = readFileSync(visualPath, "utf-8");
  const visual = VisualSchema.parse(JSON.parse(visualContent));

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const results: Array<{ url: string; success: boolean; error?: string; path?: string }> = [];

  // Process each scene
  for (const scene of visual.scenes) {
    console.log(`\n📐 Scene: ${scene.sceneId} (${scene.layoutTemplate})`);

    if (!scene.mediaResources || scene.mediaResources.length === 0) {
      console.log(`   No media resources`);
      continue;
    }

    for (const resource of scene.mediaResources) {
      const filename = `${scene.sceneId}-${resource.id}.png`;
      const filepath = join(outputDir, filename);

      console.log(`   📷 Capturing: ${resource.type} - ${resource.url.substring(0, 60)}...`);

      try {
        const page = await context.newPage();

        // Handle network errors gracefully
        page.on("response", (response) => {
          if (!response.ok() && response.status() !== 0) {
            console.log(`   ⚠️  ${response.status()} ${response.statusText()}`);
          }
        });

        await page.goto(resource.url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        // Wait a bit for any lazy-loaded content
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: filepath,
          fullPage: false,
        });

        await page.close();

        console.log(`   ✅ Saved: ${filename}`);
        results.push({ url: resource.url, success: true, path: filepath });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`   ❌ Failed: ${errorMsg}`);
        results.push({ url: resource.url, success: false, error: errorMsg });
      }
    }
  }

  await browser.close();

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 Results: ${results.filter(r => r.success).length}/${results.length} successful`);
  console.log(`${"=".repeat(60)}\n`);

  // List saved files
  console.log(`📁 Saved screenshots:`);
  results
    .filter(r => r.success && r.path)
    .forEach(r => console.log(`   ${r.path}`));

  if (results.some(r => !r.success)) {
    console.log(`\n❌ Failed URLs:`);
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`   ${r.url}`));
    console.log(`   Error: ${results.find(r => !r.success)?.error}`);
  }
}

// Main
const visualPath = process.argv[2] || "./output/visual.json";
const outputDir = process.argv[3] || "./output/test-screenshots";

testVisualOutput(visualPath, outputDir).catch(console.error);
