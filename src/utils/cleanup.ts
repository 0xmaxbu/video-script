import { promises as fs } from "fs";
import { z } from "zod";
import path from "path";
import { logger } from "./logger";

export const CleanupOptionsSchema = z.object({
  remotionProjects: z.boolean().default(true),
  screenshots: z.boolean().default(true),
  olderThanMs: z.number().positive().optional(),
});

export type CleanupOptions = z.infer<typeof CleanupOptionsSchema>;

export const CleanupResultSchema = z.object({
  deletedFiles: z.array(z.string()),
  freedBytes: z.number().nonnegative(),
  errors: z.array(
    z.object({
      path: z.string(),
      error: z.string(),
    }),
  ),
});

export type CleanupResult = z.infer<typeof CleanupResultSchema>;

/**
 * Default patterns for files that should be preserved during cleanup
 */
export const DEFAULT_PRESERVE_PATTERNS = ["*.mp4", "*.srt", "*.json"] as const;

/**
 * Matches a filename against a glob pattern (supports * wildcard only)
 */
export function matchPattern(filename: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" +
      pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") +
      "$",
  );
  return regex.test(filename);
}

/**
 * Checks if a file should be preserved based on patterns
 */
export function shouldPreserve(
  filePath: string,
  patterns: readonly string[],
): boolean {
  const filename = path.basename(filePath);
  return patterns.some((pattern) => matchPattern(filename, pattern));
}

async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function isFileOlderThan(
  filePath: string,
  olderThanMs: number,
): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    const now = Date.now();
    const fileAge = now - stats.mtimeMs;
    return fileAge > olderThanMs;
  } catch {
    return false;
  }
}

async function collectFiles(
  dirPath: string,
  files: string[] = [],
): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await collectFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
  } catch {
    void 0;
  }

  return files;
}

/**
 * Cleans up temporary files generated during video production
 *
 * @param outputDir - The output directory containing temporary files
 * @param options - Cleanup options (what to clean, age filters)
 * @returns Promise with cleanup result including deleted files and freed bytes
 *
 * @example
 * ```typescript
 * const result = await cleanupTempFiles('./output', {
 *   remotionProjects: true,
 *   screenshots: true,
 *   olderThanMs: 3600000 // 1 hour
 * });
 * console.log(`Freed ${result.freedBytes} bytes`);
 * ```
 */
export async function cleanupTempFiles(
  outputDir: string,
  options?: CleanupOptions,
): Promise<CleanupResult> {
  const deletedFiles: string[] = [];
  const errors: Array<{ path: string; error: string }> = [];
  let freedBytes = 0;

  try {
    const validatedOptions = CleanupOptionsSchema.parse(options || {});
    const { remotionProjects, screenshots, olderThanMs } = validatedOptions;

    try {
      await fs.access(outputDir);
    } catch {
      return {
        deletedFiles: [],
        freedBytes: 0,
        errors: [],
      };
    }

    if (remotionProjects) {
      const remotionDir = path.join(outputDir, "remotion-projects");
      const remotionFiles = await collectFiles(remotionDir);

      for (const filePath of remotionFiles) {
        try {
          if (olderThanMs !== undefined) {
            const isOld = await isFileOlderThan(filePath, olderThanMs);
            if (!isOld) continue;
          }

          const fileSize = await getFileSize(filePath);
          await fs.unlink(filePath);

          deletedFiles.push(filePath);
          freedBytes += fileSize;
        } catch (error) {
          errors.push({
            path: filePath,
            error:
              error instanceof Error ? error.message : "Failed to delete file",
          });
        }
      }

      try {
        await fs.rmdir(remotionDir);
      } catch {
        void 0;
      }
    }

    if (screenshots) {
      const screenshotsDir = path.join(outputDir, "screenshots");
      const screenshotFiles = await collectFiles(screenshotsDir);

      for (const filePath of screenshotFiles) {
        try {
          if (olderThanMs !== undefined) {
            const isOld = await isFileOlderThan(filePath, olderThanMs);
            if (!isOld) continue;
          }

          const fileSize = await getFileSize(filePath);
          await fs.unlink(filePath);

          deletedFiles.push(filePath);
          freedBytes += fileSize;
        } catch (error) {
          errors.push({
            path: filePath,
            error:
              error instanceof Error ? error.message : "Failed to delete file",
          });
        }
      }

      try {
        await fs.rmdir(screenshotsDir);
      } catch {
        void 0;
      }
    }

    return {
      deletedFiles,
      freedBytes,
      errors,
    };
  } catch (error) {
    return {
      deletedFiles: [],
      freedBytes: 0,
      errors: [
        {
          path: outputDir,
          error:
            error instanceof Error ? error.message : "Unknown cleanup error",
        },
      ],
    };
  }
}

async function collectAllEntries(
  dirPath: string,
  entries: { path: string; isDir: boolean }[] = [],
): Promise<{ path: string; isDir: boolean }[]> {
  try {
    const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of dirEntries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        entries.push({ path: fullPath, isDir: true });
        await collectAllEntries(fullPath, entries);
      } else {
        entries.push({ path: fullPath, isDir: false });
      }
    }
  } catch {
    void 0;
  }

  return entries;
}

export interface CleanupTempOptions {
  preservePatterns?: readonly string[];
}

export async function cleanupRemotionTempDir(
  tempDir: string,
  options?: CleanupTempOptions,
): Promise<void> {
  const preservePatterns =
    options?.preservePatterns ?? DEFAULT_PRESERVE_PATTERNS;
  const deletedFiles: string[] = [];
  const preservedFiles: string[] = [];
  const errors: Array<{ path: string; error: string }> = [];

  try {
    await fs.access(tempDir);
  } catch {
    logger.debug(`Temp directory does not exist: ${tempDir}`);
    return;
  }

  logger.start(`Cleaning up temp directory: ${tempDir}`);

  const allEntries = await collectAllEntries(tempDir);
  const files = allEntries.filter((e) => !e.isDir);
  const directories = allEntries.filter((e) => e.isDir);

  for (const file of files) {
    if (shouldPreserve(file.path, preservePatterns)) {
      preservedFiles.push(file.path);
      continue;
    }

    try {
      await fs.unlink(file.path);
      deletedFiles.push(file.path);
    } catch (error) {
      errors.push({
        path: file.path,
        error: error instanceof Error ? error.message : "Failed to delete file",
      });
    }
  }

  const sortedDirs = directories.sort((a, b) => b.path.length - a.path.length);
  for (const dir of sortedDirs) {
    try {
      await fs.rmdir(dir.path);
    } catch {
      void 0;
    }
  }

  if (deletedFiles.length > 0) {
    logger.info(`Deleted ${deletedFiles.length} temporary files`);
    deletedFiles.forEach((f) => logger.debug(`  Deleted: ${f}`));
  }

  if (preservedFiles.length > 0) {
    logger.debug(`Preserved ${preservedFiles.length} output files`);
    preservedFiles.forEach((f) => logger.debug(`  Preserved: ${f}`));
  }

  if (errors.length > 0) {
    logger.warn(`Encountered ${errors.length} errors during cleanup`);
    errors.forEach((e) => logger.debug(`  Error: ${e.path} - ${e.error}`));
  }

  try {
    await fs.rmdir(tempDir);
    logger.succeed(`Temp directory cleaned: ${tempDir}`);
  } catch {
    logger.info(`Temp directory partially cleaned (some items preserved)`);
  }
}
