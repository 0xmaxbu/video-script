import { promises as fs } from "fs";
import { z } from "zod";

/**
 * Converts milliseconds to SRT timestamp format (HH:MM:SS,mmm)
 */
function millisToSrtTimestamp(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = millis % 1000;

  const pad = (num: number, size: number) => String(num).padStart(size, "0");

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
}

/**
 * Schema for SRT generation input
 */
export const GenerateSrtInputSchema = z.object({
  script: z.object({
    title: z.string(),
    totalDuration: z.number().positive(),
    scenes: z.array(
      z.object({
        id: z.string(),
        type: z.enum(["intro", "feature", "code", "outro"]),
        title: z.string(),
        narration: z.string(),
        duration: z.number().positive(),
      }),
    ),
  }),
  outputPath: z.string().min(1),
});

export type GenerateSrtInput = z.infer<typeof GenerateSrtInputSchema>;

/**
 * Schema for SRT generation output
 */
export const GenerateSrtOutputSchema = z.object({
  srtPath: z.string(),
  entryCount: z.number().int().nonnegative(),
  success: z.boolean(),
  error: z.string().optional(),
});

export type GenerateSrtOutput = z.infer<typeof GenerateSrtOutputSchema>;

/**
 * Generates SRT subtitle file from ScriptOutput
 *
 * @param input - Object containing script and output path
 * @returns Promise with generation result
 *
 * @example
 * ```typescript
 * const result = await generateSrt({
 *   script: scriptOutput,
 *   outputPath: './output/subtitles.srt'
 * });
 * ```
 */
export async function generateSrt(
  input: GenerateSrtInput,
): Promise<GenerateSrtOutput> {
  try {
    // Validate input
    const validated = GenerateSrtInputSchema.parse(input);

    const { script, outputPath } = validated;
    const srtLines: string[] = [];

    let currentTimeMs = 0;
    let entryNumber = 1;

    // Generate SRT entries for each scene with narration
    for (const scene of script.scenes) {
      // Skip scenes with empty narration
      if (!scene.narration || scene.narration.trim().length === 0) {
        currentTimeMs += scene.duration * 1000;
        continue;
      }

      const startTime = currentTimeMs;
      const endTime = currentTimeMs + scene.duration * 1000;

      const startTimestamp = millisToSrtTimestamp(startTime);
      const endTimestamp = millisToSrtTimestamp(endTime);

      // Add SRT entry
      srtLines.push(`${entryNumber}`);
      srtLines.push(`${startTimestamp} --> ${endTimestamp}`);
      srtLines.push(scene.narration);
      srtLines.push("");

      currentTimeMs = endTime;
      entryNumber++;
    }

    // Write SRT file
    const srtContent = srtLines.join("\n");
    await fs.writeFile(outputPath, srtContent, "utf-8");

    return {
      srtPath: outputPath,
      entryCount: entryNumber - 1,
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      srtPath: input.outputPath,
      entryCount: 0,
      success: false,
      error: errorMessage,
    };
  }
}
