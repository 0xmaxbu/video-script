import { ScriptOutput } from "../types/script.js";

export interface JSONParseResult {
  success: boolean;
  data?: ScriptOutput;
  error?: string;
  candidatesTried: number;
  bestScore: number;
}

export function parseScriptFromLLMOutput(
  _textContent: string,
): JSONParseResult {
  throw new Error("Not implemented");
}
