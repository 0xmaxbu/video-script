# Proposal: Fix Script Agent - Incremental Scene Generation

## Problem Statement

The Script Agent frequently fails during script generation due to LLM instability:

1. **Multiple JSON outputs**: LLM generates 2-3 different JSON responses in one output
2. **Truncation**: Each JSON is truncated mid-way, never completes
3. **Parsing failure**: Current CLI cannot handle this pattern, causing 100% failure rate

### Current Flow

```
Research → Script Agent → 2-3 truncated JSONs → CLI JSON parsing fails
```

## Proposed Solution

### 1. CLI JSON Parser Enhancement

Improve the CLI's JSON extraction to handle multiple LLM outputs:

- Split by markdown code fences
- Extract all complete JSON candidates
- Score by completeness (scene count, structure validity)
- Try parsing each candidate
- Fall back to manual extraction for truncated JSONs using brace counting

### 2. Agent Prompt Strategy Change

**Change from**: Output entire script in one LLM call
**Change to**: Output one scene at a time via sequential tool calls

**Benefits**:

- Each LLM call outputs smaller, complete JSON (one scene)
- No truncation risk with limited output
- Easier validation per scene
- Better error recovery (fail one scene, not entire script)

## Scope

### Included

- [x] CLI JSON parser improvement
- [x] Agent prompt redesign for incremental output
- [x] ScriptOutput schema support for partial updates
- [x] Error handling for scene-level failures

### Excluded (for MVP)

- [ ] Streaming UI feedback
- [ ] Scene editing/correction mid-generation
- [ ] Parallel scene generation

## Success Criteria

1. Script generation succeeds >90% of the time
2. Each scene is validated individually
3. Failed scenes can be retried without regenerating entire script
4. Backward compatible with existing research.json format

## Impact

- **Fixes**: Current blocking issue preventing E2E pipeline completion
- **Improves**: Developer experience with more resilient LLM interaction
- **Enables**: Future streaming UI and progressive rendering
