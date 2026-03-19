# Spec: Multi-JSON Script Parser

## Overview

Enhanced JSON parsing strategy for handling unstable LLM outputs that produce multiple truncated JSONs.

## Function Signature

```typescript
interface JSONParseResult {
  success: boolean;
  data?: ScriptOutput;
  error?: string;
  candidatesTried: number;
  bestScore: number;
}

function parseScriptFromLLMOutput(textContent: string): JSONParseResult;
```

## Algorithm

### Step 1: Code Fence Splitting

````typescript
const blocks = textContent.split(/```json\s*/).slice(1);
// Removes first element if empty (before first fence)
````

### Step 2: Per-Block Extraction

For each block:

1. Take only the part before any closing fence
2. Strip whitespace

### Step 3: JSON Candidate Extraction

For each cleaned block:

1. **Try direct parse first**
2. **If failed, use brace counting**:
   ```
   - Walk through string counting { and }
   - When count returns to 0, extract that substring
   - This handles truncated JSONs
   ```

### Step 4: Scoring

```typescript
function scoreCandidate(obj: object): number {
  let score = 0;

  if (obj.title) score += 10;
  if (obj.totalDuration) score += 5;
  if (Array.isArray(obj.scenes)) {
    score += obj.scenes.length * 100;
    // Bonus for complete scenes
    score +=
      obj.scenes.filter(
        (s) => s.id && s.type && s.title && s.narration && s.duration,
      ).length * 50;
  }

  return score;
}
```

### Step 5: Validation

Pass candidate through `ScriptOutputSchema.parse()` to ensure schema compliance.

## Return Value

- `success: true` if any candidate parses and validates
- `data`: The parsed ScriptOutput with highest score
- `candidatesTried`: Number of JSON candidates attempted
- `bestScore`: Score of winning candidate

## Error Handling

If no valid JSON found:

```typescript
{
  success: false,
  error: "No valid JSON found in LLM output",
  candidatesTried: N,
  bestScore: 0
}
```

## Test Cases

| Input                          | Expected                    |
| ------------------------------ | --------------------------- |
| Single complete JSON           | Parse succeeds              |
| Multiple complete JSONs        | Parse first (highest score) |
| One complete, one truncated    | Parse complete one          |
| All truncated (brace-balanced) | Extract and parse           |
| All truncated (unbalanced)     | Return error                |
| No JSON markers                | Return error                |

## File Location

`src/utils/json-parser.ts` (new file)
