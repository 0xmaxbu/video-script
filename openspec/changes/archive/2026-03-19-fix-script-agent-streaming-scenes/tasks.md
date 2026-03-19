# Tasks: Fix Script Agent - Incremental Scene Generation

## Implementation Order

### Task 1: Create JSON Parser Utility

**File**: `src/utils/json-parser.ts`

**Steps**:

1. Create `parseScriptFromLLMOutput()` function
2. Implement code fence splitting
3. Implement brace-counting JSON extraction
4. Implement scoring system
5. Add comprehensive error handling
6. Write unit tests

**Acceptance**: `npm test -- json-parser.test.ts` passes

---

### Task 2: Update ScriptOutput Schema

**File**: `src/types/script.ts`

**Steps**:

1. Add optional `status` field to Scene type
2. Add `SceneStatus` enum: `pending | complete | failed`
3. Add `SceneUpdate` interface for incremental updates

**Acceptance**: TypeScript compiles without errors

---

### Task 3: Update Script Agent Prompts

**File**: `src/mastra/agents/script-agent.ts`

**Steps**:

1. Create two-prompt strategy (structure + visualLayers)
2. Update `instructions` field with streaming approach
3. Add scene-level validation in prompt

**Acceptance**: Agent outputs valid single-scene JSON

---

### Task 4: Update CLI Script Command

**File**: `src/cli/index.ts`

**Changes**:

1. Import `parseScriptFromLLMOutput` utility
2. Replace direct JSON parsing with new parser
3. Add scene-by-scene generation loop
4. Add progress logging for each scene
5. Handle partial failures gracefully

**Acceptance**: CLI runs without TypeScript errors

---

### Task 5: Add Unit Tests for JSON Parser

**File**: `src/utils/__tests__/json-parser.test.ts`

**Test cases**:

- Single complete JSON
- Multiple complete JSONs (pick first/highest score)
- One complete, one truncated
- All truncated with balanced braces
- No JSON markers
- Invalid JSON structure

**Acceptance**: All tests pass with >80% coverage

---

### Task 6: E2E Integration Test

**Command**: Full pipeline with unsloth topic

**Steps**:

1. Clean output directory
2. Run `video-script research "Unsloth..." --links "..."`
3. Run `video-script script <dir>`
4. Run `video-script screenshot <dir>`
5. Run `video-script compose <dir>`

**Acceptance**: Video file generated successfully

---

## Files to Modify

| File                                      | Action |
| ----------------------------------------- | ------ |
| `src/utils/json-parser.ts`                | Create |
| `src/utils/__tests__/json-parser.test.ts` | Create |
| `src/types/script.ts`                     | Modify |
| `src/mastra/agents/script-agent.ts`       | Modify |
| `src/cli/index.ts`                        | Modify |

## Files to Delete

None

## Dependencies

- None (pure TypeScript implementation)

## Rollback Plan

If issues arise:

1. Revert `src/cli/index.ts` to previous version
2. Delete `src/utils/json-parser.ts`
3. Restore original single-prompt approach in agent
