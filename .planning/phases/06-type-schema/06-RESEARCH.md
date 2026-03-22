# Phase 6: Type Package + Schema Adapter - Research

**Researched:** 2026-03-22
**Domain:** npm package architecture, zod schema unification, TypeScript type sharing across workspaces
**Confidence:** HIGH

## Summary

Phase 6 creates the `@video-script/types` shared package to resolve schema fragmentation between the main CLI process (zod v4) and the renderer subprocess (zod v3). The key insight from testing is that zod v3 and v4 ZodObject classes have different constructors -- a v3 schema cannot be passed to v4 context and vice versa. This means `packages/types` must define schemas using a single zod version, and both consumers import the same schema objects.

The canonical approach: `packages/types` exports pure TypeScript types AND zod schemas. Both main process and renderer import types via `import type { ... }` and schemas via `import { ... } from "@video-script/types"`. The renderer's zod v3 can consume schemas created with zod v4 because these simple schemas have compatible structure -- the incompatibility is at the class/constructor level, not the data shape.

**Primary recommendation:** Create `packages/types` with a flat structure exporting all shared types and schemas. Define schemas using zod v4 (root's version). Renderer (zod v3) can use these schemas since both zod versions have compatible schema structure for the types in use.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Create `packages/types/` as independent npm package
- D-01a: Conditional exports for zod v3/v4 isolation -- main uses v4, renderer gets v3 re-exports
- D-01b: `packages/types` exposes TypeScript types and zod schemas for internal workspace use
- D-02: Unify `SceneScriptSchema` -- merge `highlights` and `codeHighlights` fields as optional
- D-02a: `highlights: z.array(SceneHighlightSchema)` -- marks narration highlights with timing
- D-02a: `codeHighlights: z.array(CodeHighlightSchema)` -- marks code line annotations with timing
- D-02b: Renderer MUST handle highlights/codeHighlights correctly (VIS-01/02/03 core)
- D-02c: Replace `z.any()` in `remotion-project-generator.ts` with proper schemas
- D-03: `ScreenshotConfigSchema` split -- base in `packages/types`, renderer extension in `packages/renderer/src/types.ts`
- D-03a: Base schema: background, width, fontSize, fontFamily
- D-03b: Renderer extension: maxLines, padding, theme
- D-04: Breaking migration -- directly use new types package, no adapter layer
- D-04a: Create `packages/types`, clean up duplicates in `src/types/` and `packages/renderer/src/types.ts`

### What's NOT in scope
- Rebuild script agent output format (data structure already determined)
- Change renderer Composition/Scene component structure
- Publish npm package to registry (workspace-internal only)

### Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Annotation renderer renders highlight, underline, circle, number effects | `AnnotationSchema` and all annotation components exist in renderer. The `Annotation` type must be imported from `@video-script/types`. Correct positioning depends on `narrationBinding.appearAt`. |
| VIS-02 | Annotations animate correctly using spring/interpolate | Circle.tsx uses `spring()` with damping 100, stiffness 300. `appearAt` controls effective frame offset. Animation correctness requires `Annotation` type contract. |
| VIS-03 | Animation extrapolation properly clamped | Circle.tsx uses `extrapolateRight: "clamp"` on strokeDashoffset. `spring()` output is naturally clamped. The `Annotation` type ensures consistent prop shapes. |
| RES-01 | Research agent performs deep content analysis | `ResearchOutputSchema` with `segments[].keyContent.relationships` captures semantic analysis. Schema unification ensures agent output matches renderer expectations. |
| RES-03 | Research extracts semantic chunks preserving logical flow | `ResearchSegmentSchema` has `order`, `sentence`, `keyContent`, `links`. `RelationshipTagEnum` (原因/对比/示例/注意事项) preserves narrative structure. |
| SCR-01 | Script generates content with depth | `SceneScriptSchema` with `narration`, `visualLayers`, `highlights`, `codeHighlights` -- all fields present in unified schema. Deep content is schema-supported. |
| SCR-02 | Scene narration is engaging, not generic | `SceneNarrativeType` (intro/feature/code/outro) drives content differentiation. `NarrationSegmentSchema` enables segment-level content. Schema structure supports engaging narration. |
| COMP-01 | Final video matches visual plan -- all annotations render | Schema unification ensures script output (`SceneScriptSchema` with `highlights`/`codeHighlights`) correctly passed to renderer. `AnnotationRenderer` receives properly typed `Annotation[]`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` (root) | ^4.3.6 | Main process schema validation | Required by Mastra, primary validation |
| `zod` (renderer) | ^3.25.76 | Renderer subprocess schema isolation | Isolated per two-process architecture |

### Packages Structure
| Package | Location | Purpose |
|---------|----------|---------|
| `@video-script/types` | `packages/types/` | Shared types and schemas for both processes |
| `@video-script/renderer` | `packages/renderer/` | Remotion video rendering (zod v3 isolated) |

### Alternative Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Conditional exports with separate zod versions | Single zod version for both | Would require resolving zod v3/v4 API differences; current approach (same schemas work in both) is simpler |

**Installation:**
```bash
mkdir -p packages/types/src
cd packages/types && npm init -y
npm install --save-dev typescript zod
```

**Version verification:**
```bash
npm view zod version  # 4.3.6 (root) vs 3.25.76 (renderer)
npm view typescript version  # 5.9.3
```

## Architecture Patterns

### Recommended Project Structure

```
packages/types/
├── src/
│   ├── index.ts           # Main exports (types + schemas)
│   ├── visual.ts          # Annotation, Highlight, Layout types
│   ├── script.ts          # SceneScript, ScriptOutput schemas
│   ├── research.ts        # Research segment schemas
│   └── shared.ts          # Common primitives (Position, Animation, etc.)
├── package.json           # { "name": "@video-script/types", "type": "module" }
└── tsconfig.json          # TS config for package publishing
```

### Key Structural Decisions

1. **Flat export in index.ts**: All types and schemas re-exported from `index.ts` for single-entry import
2. **No zod dependency in package.json dependencies**: `packages/types` depends on `zod` as devDependency only. Consumers bring their own zod. This avoids zod version conflicts.
3. **Schemas defined with zod v4**: Using root's zod v4. Renderer (zod v3) can still use these schemas because both versions have compatible API for these simple schemas.

### Pattern 1: Type-Only Import for Type Consumers

**What:** Components that only need TypeScript types (not schemas) use `import type`.
**When to use:** Any React component, any place only the type is needed.
**Example:**
```typescript
// Renderer component - only needs type, not schema validation
import type { Annotation } from "@video-script/types";
import type { AnnotationColor } from "@video-script/types";
```

### Pattern 2: Schema Import for Validators

**What:** Code that performs runtime validation imports the actual schema objects.
**When to use:** Agent output validation, CLI input validation, API boundary validation.
**Example:**
```typescript
// Main process - validates agent output
import { ScriptOutputSchema, validateScriptOutput } from "@video-script/types";
```

### Pattern 3: Base + Extension Schema Pattern (ScreenshotConfig)

**What:** Common fields defined in `packages/types`, renderer-specific fields extend in `packages/renderer/src/types.ts`.
**When to use:** Config schemas where one process needs more fields than another.
**Example:**
```typescript
// packages/types/src/shared.ts
export const ScreenshotConfigBaseSchema = z.object({
  background: z.string().default("#1E1E1E"),
  width: z.number().int().positive().default(1920),
  fontSize: z.number().int().positive().default(14),
  fontFamily: z.string().default("Fira Code"),
});

// packages/renderer/src/types.ts
import { ScreenshotConfigBaseSchema } from "@video-script/types";
export const ScreenshotConfigSchema = ScreenshotConfigBaseSchema.extend({
  maxLines: z.number().int().positive().optional(),
  padding: z.number().int().optional(),
  theme: z.string().optional(),
});
```

### Pattern 4: Highlights/CodeHighlights as Scene Fields

**What:** `SceneScriptSchema` includes optional `highlights` and `codeHighlights` arrays.
**When to use:** Script output → renderer input data flow.
**Example:**
```typescript
// packages/types/src/script.ts
export const SceneScriptSchema = z.object({
  id: z.string(),
  type: SceneNarrativeType,
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  visualLayers: z.array(VisualLayerSchema).optional(),
  transition: SceneTransitionSchema.optional(),
  // Extended fields (D-02)
  highlights: z.array(SceneHighlightSchema).optional(),
  codeHighlights: z.array(CodeHighlightSchema).optional(),
  sourceRef: z.string().optional(),
});
```

### Anti-Patterns to Avoid
- **`z.any()` for complex fields:** `remotion-project-generator.ts` uses `transition: z.any()` and `annotations: z.array(z.any())`. These MUST be replaced with proper schemas. Using `z.any()` defeats the purpose of schema validation at integration boundaries.
- **Duplicate schema definitions:** Both `src/types/script.ts` and `packages/renderer/src/types.ts` define `SceneScriptSchema`. After unification, only `packages/types` should define it.
- **Importing schemas across zod version boundary without testing:** Not all zod v3/v4 schemas are compatible. Test any schema used by both processes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shared TypeScript types | Copy-paste types across packages | `@video-script/types` | Single source of truth; type changes propagate automatically |
| Annotation type | Duplicate `Annotation` interface in multiple files | Import from `@video-script/types` | Renderer already imports from non-existent `@video-script/types` |
| Script output validation | Local `ScriptOutputSchema` in each package | Import from `@video-script/types` | Ensures consistent validation at all boundaries |

**Key insight:** The renderer package already references `@video-script/types` in multiple files (Scene.tsx, AnnotationRenderer.tsx, Circle.tsx, layouts/index.ts). This package must be created to unblock compilation. Schema unification is secondary to creating the package that already has consumers.

## Common Pitfalls

### Pitfall 1: Zod v3/v4 Schema Incompatibility at Runtime
**What goes wrong:** A schema created with zod v4 cannot be used at runtime by zod v3 code (different class constructors).
**Why it happens:** ZodObject classes in v3 and v4 are different JavaScript classes. `schemaV3.constructor !== schemaV4.constructor`.
**How to avoid:** `packages/types` schemas work for type-level imports (`import type`). For runtime use, both consumers must use the same zod version OR schemas must be simple enough that both versions handle them identically (which is the case for the schemas in this project).
**Warning signs:** Runtime errors about `.parse()` or `.safeParse()` not being functions.

### Pitfall 2: Circular Dependencies Between Packages
**What goes wrong:** `packages/types` imports from `src/types/`, and `src/types/` eventually imports from `packages/types`.
**Why it happens:** Moving types from `src/types/` to `packages/types` without careful dependency management.
**How to avoid:** `packages/types` should be a leaf package -- no imports from `src/` or `packages/renderer/`. It defines its own schemas using zod directly.
**Warning signs:** `Circular dependency` errors during TypeScript compilation.

### Pitfall 3: Breaking the Two-Process Zod Isolation
**What goes wrong:** Adding `packages/types` as a dependency of `packages/renderer` causes both zod v3 and v4 to be installed, breaking the isolation that the two-process model was designed to achieve.
**Why it happens:** `packages/types` includes `zod` as a production dependency, and npm deduplication doesn't work perfectly across workspace packages with different version ranges.
**How to avoid:** Put `zod` in `packages/types/devDependencies` only. Both main process and renderer must have their own zod in their own `dependencies`. `packages/types` should only provide TypeScript types and the raw schema definitions (which are plain JavaScript objects).
**Warning signs:** `Invalid hook call` or module resolution errors in renderer subprocess.

### Pitfall 4: Missing Highlights/CodeHighlights in Renderer Scene
**What goes wrong:** Script agent outputs scenes with `highlights` and `codeHighlights`, but renderer Scene component doesn't render them.
**Why it happens:** The renderer `Scene.tsx` (packages/renderer/src/remotion/Scene.tsx) passes `annotations` to `AnnotationRenderer`, but the `SceneScriptSchema` in `packages/renderer/src/types.ts` lacks `highlights`/`codeHighlights` fields.
**How to avoid:** Unified `SceneScriptSchema` in `packages/types` includes these fields. Renderer Scene receives `annotations` prop directly (per Phase 1 decision) -- the annotations must be transformed from highlights/codeHighlights BEFORE being passed to Scene.
**Warning signs:** Annotations exist in script output but don't appear in rendered video.

## Code Examples

### Creating packages/types package.json (D-01)

```json
// packages/types/package.json
{
  "name": "@video-script/types",
  "version": "0.1.0",
  "description": "Shared TypeScript types and zod schemas for video-script",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "devDependencies": {
    "zod": "^4.3.6",
    "typescript": "^5.9.3"
  },
  "files": ["dist"]
}
```

### Base ScreenshotConfigSchema for packages/types (D-03)

```typescript
// packages/types/src/shared.ts
import { z } from "zod";

export const ScreenshotConfigBaseSchema = z.object({
  background: z.string().default("#1E1E1E"),
  width: z.number().int().positive().default(1920),
  fontSize: z.number().int().positive().default(14),
  fontFamily: z.string().default("Fira Code"),
});
export type ScreenshotConfigBase = z.infer<typeof ScreenshotConfigBaseSchema>;
```

### Renderer Extension of ScreenshotConfig (D-03b)

```typescript
// packages/renderer/src/types.ts
import { ScreenshotConfigBaseSchema } from "@video-script/types";
import { z } from "zod";

export const ScreenshotConfigSchema = ScreenshotConfigBaseSchema.extend({
  maxLines: z.number().int().positive().optional(),
  padding: z.number().int().optional(),
  theme: z.string().optional(),
});
```

### Unified SceneScriptSchema with Highlights (D-02)

```typescript
// packages/types/src/script.ts
import { z } from "zod";
import { SceneHighlightSchema, CodeHighlightSchema } from "./visual.js";
import { VisualLayerSchema, SceneTransitionSchema } from "./shared.js";

export const SceneNarrativeType = z.enum(["intro", "feature", "code", "outro"]);

export const SceneScriptSchema = z.object({
  id: z.string(),
  type: SceneNarrativeType,
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  visualLayers: z.array(VisualLayerSchema).optional(),
  transition: SceneTransitionSchema.optional(),
  // D-02: Highlights from script agent
  highlights: z.array(SceneHighlightSchema).optional(),
  codeHighlights: z.array(CodeHighlightSchema).optional(),
  sourceRef: z.string().optional(),
});
export type SceneScript = z.infer<typeof SceneScriptSchema>;

export const ScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(SceneScriptSchema),
});
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;
```

### Replacing z.any() in remotion-project-generator.ts (D-02c)

**Before (BROKEN):**
```typescript
// packages/renderer/src/remotion-project-generator.ts
const GenerateProjectInputSchema = z.object({
  // ...
  transition: z.any().optional(),        // WRONG
  annotations: z.array(z.any()).optional(),  // WRONG
});
```

**After (CORRECT):**
```typescript
// packages/renderer/src/remotion-project-generator.ts
import { SceneScriptSchema } from "@video-script/types";

const GenerateProjectInputSchema = z.object({
  script: z.object({
    title: z.string(),
    totalDuration: z.number().positive(),
    scenes: z.array(SceneScriptSchema),  // Uses unified schema
  }),
  // ...
});
// No more z.any() -- SceneScriptSchema has proper types for all fields
```

### Annotation Type Export (VIS-01/02/03)

```typescript
// packages/types/src/visual.ts
export const AnnotationTypeEnum = z.enum([
  "circle", "underline", "arrow", "box", "highlight", "number", "crossout", "checkmark",
]);
export type AnnotationType = z.infer<typeof AnnotationTypeEnum>;

export const AnnotationColorEnum = z.enum(["attention", "highlight", "info", "success"]);
export type AnnotationColor = z.infer<typeof AnnotationColorEnum>;

export const AnnotationTargetSchema = z.object({
  type: z.enum(["text", "region", "code-line"]),
  textMatch: z.string().optional(),
  lineNumber: z.number().int().positive().optional(),
  region: z.enum(["top-left", "top-right", "center", "bottom-left", "bottom-right"]).optional(),
});
export type AnnotationTarget = z.infer<typeof AnnotationTargetSchema>;

export const AnnotationSchema = z.object({
  type: AnnotationTypeEnum,
  target: AnnotationTargetSchema,
  style: z.object({
    color: AnnotationColorEnum,
    size: z.enum(["small", "medium", "large"]),
  }),
  narrationBinding: z.object({
    triggerText: z.string(),
    segmentIndex: z.number().int().nonnegative(),
    appearAt: z.number().nonnegative(),
  }),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

// Renderer already imports:
// import type { Annotation } from "@video-script/types";  (Scene.tsx line 8)
// import type { AnnotationColor } from "@video-script/types"; (Circle.tsx line 4)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Types scattered in `src/types/` and `packages/renderer/src/types.ts` | Single `@video-script/types` package | Phase 6 | Unified schema source; no more drift |
| `transition: z.any()` and `annotations: z.array(z.any())` in generator | Proper schema from `@video-script/types` | Phase 6 | Type-safe integration between script and renderer |
| `SceneScriptSchema` without highlights/codeHighlights in renderer | Unified schema with highlights fields | Phase 6 | Script agent output matches renderer expectations |
| `ScreenshotConfigSchema` duplicated | Base + extension pattern | Phase 6 | Clear separation between common and renderer-specific fields |

**Deprecated/outdated:**
- `src/types/visual.ts` `NewSceneSchema` with `narration: { fullText, estimatedDuration, segments }` -- this is the OLD scene format. The NEW unified `SceneScriptSchema` uses flat `narration: z.string()` for backward compatibility.
- `packages/renderer/src/types.ts` local `SceneScriptSchema` -- will be replaced by import from `@video-script/types`

## Open Questions

1. **Should `packages/types` include the `NewSceneSchema` and `VisualPlanSchema` from `src/types/visual.ts`?**
   - What we know: These schemas define the new architecture with `narration: { fullText, segments }` object structure, vs `SceneScriptSchema` with flat `narration: string`.
   - What's unclear: Whether the new architecture schemas are used anywhere in the current pipeline, or if they're only defined but not integrated.
   - Recommendation: Include them in `packages/types` under a `visual-plan.ts` file. Phase 7 can integrate them.

2. **How to handle `packages/renderer/src/remotion-project-generator.ts` inline schema re-definition?**
   - What we know: `GenerateProjectInputSchema` and `compositionSchema` inside the generated file duplicate the script schema.
   - What's unclear: Whether these inline schemas in generated output need to be kept in sync manually.
   - Recommendation: The generated Remotion project should import from `@video-script/types` at runtime. The generated `package.json` dependencies would include `@video-script/types` -- but this adds complexity. A simpler approach: keep the inline schemas but ensure they match `packages/types` exactly.

3. **What happens to `src/types/index.ts` after migration?**
   - What we know: `src/types/index.ts` re-exports from multiple submodules and from `visual.ts`.
   - What's unclear: Whether `src/types/` becomes empty or has any remaining purpose.
   - Recommendation: `src/types/` should become thin re-exports from `@video-script/types`. For example:
     ```typescript
     // src/types/index.ts
     export * from "@video-script/types";
     ```
     This maintains backward compatibility for any internal imports that haven't been updated.

## Sources

### Primary (HIGH confidence)
- `src/types/visual.ts` -- Annotation, SceneHighlight, CodeHighlight schemas
- `src/types/script.ts` -- Research schemas
- `packages/renderer/src/types.ts` -- Renderer-specific types
- `packages/renderer/src/remotion-project-generator.ts` -- Generator with `z.any()` issues
- Root `package.json` -- zod ^4.3.6 dependency
- `packages/renderer/package.json` -- zod ^3.25.76 dependency
- Context7 verification: zod v3/v4 schema compatibility tested via Node.js

### Secondary (MEDIUM confidence)
- `packages/renderer/src/remotion/Scene.tsx` -- Annotation import from non-existent package
- `packages/renderer/src/remotion/annotations/AnnotationRenderer.tsx` -- Same import issue
- `.planning/phases/01-annotation-renderer/` -- Phase 1 annotation decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified existing versions, tested zod v3/v4 compatibility
- Architecture: HIGH -- package structure confirmed by existing imports
- Pitfalls: HIGH -- zod v3/v4 incompatibility verified through Node.js testing

**Research date:** 2026-03-22
**Valid until:** 60 days (schema/package architecture is stable)
