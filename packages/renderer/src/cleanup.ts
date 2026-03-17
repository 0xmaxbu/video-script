import { promises as fs } from "fs";
import path from "path";

/**
 * Default patterns for files that should be preserved during cleanup
 */
export const DEFAULT_PRESERVE_PATTERNS = ["*.mp4", "*.srt", "*.json"] as const;

/**
 * Matches a filename against a glob pattern (supports * wildcard only)
 */
function matchPattern(filename: string, pattern: string): boolean {
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
function shouldPreserve(
  filePath: string,
  patterns: readonly string[],
): boolean {
  const filename = path.basename(filePath);
  return patterns.some((pattern) => matchPattern(filename, pattern));
}

export interface CleanupTempOptions {
  preservePatterns?: readonly string[];
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

export async function cleanupRemotionTempDir(
  tempDir: string,
  options?: CleanupTempOptions,
): Promise<void> {
  const preservePatterns =
    options?.preservePatterns ?? DEFAULT_PRESERVE_PATTERNS;

  try {
    await fs.access(tempDir);
  } catch {
    return;
  }

  const allEntries = await collectAllEntries(tempDir);
  const files = allEntries.filter((e) => !e.isDir);
  const directories = allEntries.filter((e) => e.isDir);

  for (const file of files) {
    if (shouldPreserve(file.path, preservePatterns)) {
      continue;
    }

    try {
      await fs.unlink(file.path);
    } catch {
      void 0;
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

  try {
    await fs.rmdir(tempDir);
  } catch {
    void 0;
  }
}
