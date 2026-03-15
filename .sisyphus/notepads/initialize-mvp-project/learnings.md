# CLI Implementation Learnings

## Task: Implement CLI Main Entry Point (2.1)

### What Was Implemented
- Created `src/cli/index.ts` with shebang (`#!/usr/bin/env node`)
- Implemented Commander.js command definitions for `create` and `config` commands
- ESM imports (`import` syntax) for compatibility with `"type": "module"` in package.json
- Dynamic version reading from package.json using `fileURLToPath` and `join` for ESM compatibility

### Key Implementation Details

#### Shebang & ESM Compatibility
- Node.js shebang must be first line: `#!/usr/bin/env node`
- ESM requires special handling for `__dirname`:
  ```typescript
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```
- Use `join(__dirname, '..', '..', 'package.json')` to navigate from `dist/cli/index.js` to project root

#### Create Command Options
- `<title>` (required positional argument)
- `--links <urls>` - comma-separated reference URLs
- `--doc <file>` - local document file path
- `--aspect-ratio <ratio>` - defaults to `16:9`
- `--no-review` - skip all review nodes
- `--output <dir>` - custom output directory

#### Command Handlers
- Handlers are placeholders with `TODO: implement` messages
- Options are logged for debugging current state
- Uses `chalk` for colored output (blue for headers, yellow for TODOs, gray for options)

### Testing & Verification
✅ TypeScript compilation passes (`npm run typecheck`)
✅ Build succeeds (`npm run build`)
✅ Shebang preserved in compiled output
✅ Help output works (`npm run dev -- --help`)
✅ All options correctly parsed by Commander.js

### Patterns Used
1. **Dynamic imports from package.json** - allows version to stay in sync
2. **chalk for colored output** - improves CLI UX
3. **Option logging** - helps debug parameter passing before implementing handlers
4. **Placeholder pattern** - `TODO` messages clarify what's not yet implemented

### Notes for Future Tasks
- The actual command logic (create + config handlers) is deferred to subsequent tasks
- Both command handlers currently echo received options for visibility
- The CLI structure is ready for integration with Mastra agents in next phase

## Interactive Input Flow Implementation (2025-03-15)

### Implementation Details

1. **Created `src/cli/prompts.ts`**
   - Main export: `promptForInput(initialTitle?: string): Promise<ResearchInput>`
   - Four helper functions for specific prompt types:
     - `promptForTitle()`: Required title input with validation
     - `promptForSourceType()`: Menu to choose between links, document, or no reference
     - `promptForLinks()`: Comma-separated URL input with zod validation
     - `promptForDocument()`: Multi-line editor input for document content
   - All inputs use Zod schema validation for type safety
   - Returns `ResearchInput` type matching existing schema

2. **Updated `src/cli/index.ts`**
   - Changed command signature from `create <title>` to `create [title]` (optional title)
   - Made action handler async to support prompt interaction
   - Conditional flow:
     - If title provided: passes to `promptForInput(title)`
     - If title missing: calls `promptForInput()` for full interactive flow
   - Added error handling with formatted error messages
   - Display formatted output of collected inputs

3. **Key Design Decisions**
   - Used inquirer's `editor` type for document input instead of multi-line `input`
     - Opens user's default editor for better UX with large text
   - URL validation happens during prompt, not after
   - Zod schema parsing provides final validation before return
   - Title is required in both interactive and CLI modes

4. **Type Safety**
   - All functions have explicit type annotations
   - Zod schema validation ensures ResearchInput compliance
   - No usage of `any` type
   - TypeScript strict mode compilation passes

5. **Testing Approach**
   - Build and typecheck pass successfully
   - Code compiles to dist/cli/ with source maps
   - Ready for manual E2E testing via `npm run dev -- create`

### Notes
- ESM imports used throughout (`.js` extensions in imports)
- Chalk styling matches existing CLI aesthetic
- Follows project coding standards (no console.log, proper error handling)

## WebFetch Tool Implementation (2025-03-15)

### Implementation Details

1. **Created `src/mastra/tools/web-fetch.ts`**
   - Used Mastra `createTool()` API from `@mastra/core/tools`
   - Tool ID: `web-fetch`
   - Input schema: Single required `url` field with Zod validation
   - Output schema: Three fields (`content`, `title`, `url`) with descriptions

2. **Core Functionality**
   - **HTML to Markdown conversion**: Implemented as composition of pure functions:
     - `removeScriptsAndStyles()`: Strips script/style tags
     - `convertTagsToMarkdown()`: Converts HTML tags to MD (headers, emphasis, links, line breaks)
     - `decodeHtmlEntities()`: Decodes HTML entities (&nbsp;, &amp;, etc.)
     - `normalizeWhitespace()`: Cleans up excess newlines and spaces
   - **Title extraction**: Priority order (1) `<title>` tag, (2) `<h1>` content, (3) fallback "Untitled"
   - **Error handling**: Specific handling for 404, 5xx, timeouts, and generic fetch errors

3. **MVP Features**
   - 30-second timeout using AbortController
   - User-Agent header to avoid bot blocking
   - Proper HTTP error code handling
   - Markdown output suitable for LLM processing
   - Final URL tracking (handles redirects via `response.url`)

4. **Code Patterns**
   - Self-documenting function names instead of comments (refactored from initial implementation)
   - Pure function composition for HTML processing
   - Named constant `TIMEOUT_MS` for clarity
   - Type-safe Zod schemas for input/output

5. **Testing & Verification**
   - ✅ TypeScript compilation passes (`npm run typecheck`)
   - ✅ Build succeeds (`npm run build`)
   - ✅ No linting issues after comment refactoring
   - Tool ready for integration with Research Agent

### Implementation Notes
- Used native `fetch` API (no third-party scraping libraries per MVP constraints)
- HTML to Markdown conversion is simple but suitable for MVP phase
- Tool designed to be composable - output can be fed directly to LLM agents
- Error messages are descriptive for debugging but generic for user display

### Next Steps
- Integrate into Research Agent once agent framework is set up
- May need enhancement for JavaScript-heavy sites (if needed beyond MVP)
- Can be extended with CSS selector support for more targeted content extraction
