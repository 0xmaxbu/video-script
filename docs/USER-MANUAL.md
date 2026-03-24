# Video Script - User Manual

> **Document ID**: USER-MANUAL
> **Status**: Stable
> **Last Updated**: 2026-03-24
> **Purpose**: This document defines the stable usage procedures for the video-script CLI tool. Commands, options, and workflows documented here should not change with future updates unless explicitly versioned.

---

## 1. Overview

Video Script is an AI-powered CLI tool that generates technical tutorial videos from titles, links, and documentation. It automates the entire video generation pipeline:

```
Research → Script → Visual → Screenshot → Compose → Render (MP4 + SRT)
```

---

## 2. Installation

### 2.1 Requirements

- **Node.js**: >= 18.0.0
- **Package Manager**: npm or pnpm
- **API Keys**: OpenAI or Anthropic (required)

### 2.2 From Source

```bash
# Clone the repository
git clone https://github.com/0xmaxbu/video-script.git
cd video-script

# Install dependencies
npm install

# Build the project
npm run build

# Install globally (optional)
npm install -g .
```

### 2.3 Environment Setup

Create a `.env` file in the project root:

```bash
# Required: LLM API Key (choose one)
OPENAI_API_KEY=sk-...           # OpenAI (recommended)
# OR
ANTHROPIC_API_KEY=sk-ant-...    # Anthropic Claude

# Optional: Customize model
LLM_MODEL=gpt-4-turbo           # Default: gpt-4-turbo
```

---

## 3. CLI Commands Reference

### 3.1 Global Command

```bash
video-script [command] [options]
```

**Global Options:**
| Option | Description |
|--------|-------------|
| `-h, --help` | Show help information |
| `-v, --version` | Show version number |

---

### 3.2 `create` Command

**Primary command** for generating a complete video project.

```bash
video-script create [title] [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `title` | Video title (optional in interactive mode) |

**Options:**
| Option | Type | Description |
|--------|------|-------------|
| `--links <urls>` | string | Comma-separated URLs to fetch content from |
| `--doc <file>` | string | Path to markdown documentation file |
| `--output <dir>` | string | Output directory (auto-generated if not specified) |
| `--no-review` | boolean | Skip review pause, continue to screenshot/compose |
| `--aspect-ratio <ratio>` | string | Aspect ratio (default: 16:9) |

**Examples:**

```bash
# Interactive mode (prompts for all inputs)
video-script create

# With title only
video-script create "Understanding TypeScript Generics"

# With links
video-script create "Understanding TypeScript Generics" \
  --links "https://www.typescriptlang.org/docs/handbook/2/generics.html"

# With documentation file
video-script create "Understanding TypeScript Generics" \
  --doc ./typescript-notes.md

# With both links and documentation
video-script create "Understanding TypeScript Generics" \
  --links "https://example.com/article" \
  --doc ./notes.md

# Full pipeline without review pause
video-script create "My Video" \
  --links "https://example.com" \
  --no-review

# With custom output directory
video-script create "My Video" \
  --links "https://example.com" \
  --output ./my-videos
```

**Workflow:**

1. Runs `research` phase
2. Runs `script` phase
3. Pauses for review (unless `--no-review` is specified)
4. If `--no-review`: continues to screenshot and compose
5. Generates final video and subtitles

---

### 3.3 `research` Command

Generates `research.json` and `research.md` from title, links, and document.

```bash
video-script research <title> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `title` | Video title |

**Options:**
| Option | Type | Description |
|--------|------|-------------|
| `--links <urls>` | string | Comma-separated URLs |
| `--doc <file>` | string | Path to markdown file |
| `--output <dir>` | string | Output directory |

**Example:**

```bash
video-script research "React Hooks Guide" \
  --links "https://react.dev/reference/react/hooks" \
  --doc ./react-notes.md \
  --output ./videos/react-hooks
```

**Output Files:**

- `research.json` - Structured research data
- `research.md` - Raw research in markdown format

**Next Step:** `video-script script <dir>`

---

### 3.4 `script` Command

Generates `script.json` from `research.md`.

```bash
video-script script <dir>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `dir` | Output directory containing `research.md` |

**Prerequisites:**

- `research.md` must exist in the directory

**Example:**

```bash
video-script script ./videos/react-hooks
```

**Output Files:**

- `script.json` - Scene structure with narrations and timings

**Next Step:** `video-script visual <dir>` (optional) or `video-script screenshot <dir>`

---

### 3.5 `visual` Command

Generates `visual.json` with visual layer definitions from `script.json` and `research.md`.

```bash
video-script visual <dir>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `dir` | Output directory containing `script.json` and `research.md` |

**Prerequisites:**

- `script.json` must exist
- `research.md` must exist

**Example:**

```bash
video-script visual ./videos/react-hooks
```

**Output Files:**

- `visual.json` - Visual layer configurations for each scene

**Next Step:** `video-script screenshot <dir>`

---

### 3.6 `screenshot` Command

Captures screenshots for each scene in `script.json`.

```bash
video-script screenshot <dir>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `dir` | Output directory containing `script.json` |

**Prerequisites:**

- `script.json` must exist

**Example:**

```bash
video-script screenshot ./videos/react-hooks
```

**Output Files:**

- `screenshots/scene-001.png`
- `screenshots/scene-002.png`
- ... (one per scene)

**Next Step:** `video-script compose <dir>`

---

### 3.7 `compose` Command

Renders final video and subtitles from script and screenshots.

```bash
video-script compose <dir>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `dir` | Output directory containing `script.json` and `screenshots/` |

**Prerequisites:**

- `script.json` must exist
- `screenshots/` directory with scene images must exist

**Example:**

```bash
video-script compose ./videos/react-hooks
```

**Output Files:**

- `output.mp4` - Final video
- `output.srt` - Subtitles file

---

### 3.8 `config` Command

Displays current configuration with sensitive values masked.

```bash
video-script config
```

**Example Output:**

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4-turbo"
  },
  "video": {
    "fps": 30,
    "codec": "h264"
  }
}
```

---

### 3.9 `resume` Command

Resumes a suspended workflow from the last checkpoint.

```bash
video-script resume [runId]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `runId` | Specific workflow run ID to resume (optional) |

**Example:**

```bash
# Resume the most recent suspended workflow
video-script resume

# Resume a specific workflow
video-script resume abc123-def456
```

**Notes:**

- Workflow pauses after `create` command (before screenshot phase)
- Automatically determines which phase to resume from
- Checks for existing files to avoid re-processing

---

## 4. Pipeline Phases

### 4.1 Phase Overview

| Phase         | Command                              | Input                         | Output                         |
| ------------- | ------------------------------------ | ----------------------------- | ------------------------------ |
| 1. Research   | `research` or `create`               | title, links, docs            | `research.json`, `research.md` |
| 2. Script     | `script` or `create`                 | `research.md`                 | `script.json`                  |
| 3. Visual     | `visual` (optional)                  | `script.json`, `research.md`  | `visual.json`                  |
| 4. Screenshot | `screenshot` or `create --no-review` | `script.json`                 | `screenshots/*.png`            |
| 5. Compose    | `compose` or `create --no-review`    | `script.json`, `screenshots/` | `output.mp4`, `output.srt`     |

### 4.2 Full Pipeline (All Phases)

```bash
# Phase 1: Research
video-script research "My Video" \
  --links "https://example.com" \
  --doc ./notes.md \
  --output ./output/my-video

# Phase 2: Script
video-script script ./output/my-video

# Phase 3: Visual (optional but recommended)
video-script visual ./output/my-video

# Phase 4: Screenshot
video-script screenshot ./output/my-video

# Phase 5: Compose
video-script compose ./output/my-video
```

### 4.3 Quick Pipeline (Single Command)

```bash
video-script create "My Video" \
  --links "https://example.com" \
  --doc ./notes.md \
  --no-review
```

---

## 5. Output Directory Structure

After running the full pipeline:

```
output/my-video/
├── research.json          # Structured research data
├── research.md            # Raw research markdown
├── script.json            # Scene breakdown with narrations
├── visual.json            # Visual layer configurations (if visual phase ran)
├── screenshots/           # Captured screenshots
│   ├── scene-001.png
│   ├── scene-002.png
│   └── ...
├── output.mp4            # Final video
└── output.srt            # Subtitles
```

---

## 6. Configuration File

For advanced settings, create `video-script.config.json` in the project root:

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4-turbo",
    "apiKey": "${OPENAI_API_KEY}",
    "temperature": 0.7
  },
  "video": {
    "fps": 30,
    "codec": "h264",
    "width": 1920,
    "height": 1080,
    "aspectRatio": "16:9"
  },
  "screenshot": {
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "timeout": 30000
  },
  "output": {
    "baseDir": "./output",
    "includeIntermediates": true
  }
}
```

---

## 7. Workflow States

### 7.1 Workflow Lifecycle

```
initialized → running → suspended → running → completed
                    ↘ failed
```

### 7.2 State Persistence

Workflow state is automatically saved to `.workflow-state.json` in the output directory. This enables:

- Resume after interruption
- Tracking of completed phases
- Recovery from failures

### 7.3 Viewing Status

```bash
video-script resume
# Shows current status if workflow is already completed or failed
```

---

## 8. Error Handling

### 8.1 Retry Logic

The tool automatically retries failed operations up to 3 times:

- Research phase
- Script generation phase

### 8.2 Error Types

| Error Code               | Description            | Retryable |
| ------------------------ | ---------------------- | --------- |
| `INVALID_INPUT`          | Validation errors      | No        |
| `WEB_FETCH_FAILED`       | Network issues         | Yes       |
| `LLM_API_ERROR`          | API failures           | Yes       |
| `SCREENSHOT_FAILED`      | Screenshot timeout     | Yes       |
| `REMOTION_RENDER_FAILED` | Video rendering errors | No        |

### 8.3 Troubleshooting

**API Key Issues:**

```bash
# Verify API key is set
echo $OPENAI_API_KEY

# If not set:
export OPENAI_API_KEY=sk-...
```

**Playwright Browser Issues:**

```bash
# Install browser dependencies
npx playwright install
```

**Build Failures:**

```bash
# Clear cache and reinstall
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

**Timeout Issues:**
Increase timeout in config:

```json
{
  "screenshot": {
    "timeout": 60000
  }
}
```

---

## 9. Common Usage Patterns

### 9.1 Interactive Mode

```bash
video-script create
# Follow prompts for title, links, document
```

### 9.2 Non-Interactive Full Pipeline

```bash
video-script create "Video Title" \
  --links "https://url1.com,https://url2.com" \
  --doc ./notes.md \
  --output ./videos/my-video \
  --no-review
```

### 9.3 Step-by-Step with Review

```bash
# Run research and script, pause for review
video-script create "Video Title" \
  --links "https://example.com"

# After review, continue
video-script resume
```

### 9.4 Resume After Interruption

```bash
# If workflow was interrupted
video-script resume
```

### 9.5 Using Existing Research

```bash
# If research already exists
video-script script ./existing-output
video-script visual ./existing-output
video-script screenshot ./existing-output
video-script compose ./existing-output
```

---

## 10. File Naming Conventions

### 10.1 Input Files

| File            | Required                            | Format   |
| --------------- | ----------------------------------- | -------- |
| `research.md`   | Yes (for script phase)              | Markdown |
| `research.json` | Yes (for script phase)              | JSON     |
| `script.json`   | Yes (for visual/screenshot/compose) | JSON     |
| `visual.json`   | No (optional)                       | JSON     |

### 10.2 Output Files

| File                                   | Format          |
| -------------------------------------- | --------------- |
| `scene-001.png`, `scene-002.png`, etc. | PNG (1920x1080) |
| `output.mp4`                           | H.264 MP4       |
| `output.srt`                           | SRT subtitles   |

---

## 11. Environment Variables

| Variable            | Required | Description                         |
| ------------------- | -------- | ----------------------------------- |
| `OPENAI_API_KEY`    | Yes\*    | OpenAI API key                      |
| `ANTHROPIC_API_KEY` | Yes\*    | Anthropic API key                   |
| `LLM_MODEL`         | No       | Model to use (default: gpt-4-turbo) |
| `VIDEO_FPS`         | No       | Frames per second (default: 30)     |
| `VIDEO_CODEC`       | No       | Video codec (default: h264)         |

\*One of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is required.

---

## 12. Version Information

View version:

```bash
video-script --version
```

Current version: See `package.json`

---

## 13. Getting Help

```bash
# Show all commands
video-script --help

# Show help for specific command
video-script create --help
video-script research --help
video-script script --help
video-script visual --help
video-script screenshot --help
video-script compose --help
video-script resume --help
```

---

## Appendix A: Command Quick Reference

| Task                         | Command                                                 |
| ---------------------------- | ------------------------------------------------------- |
| Generate video (interactive) | `video-script create`                                   |
| Generate video (automatic)   | `video-script create "Title" --links "url" --no-review` |
| Generate research only       | `video-script research "Title" --links "url"`           |
| Generate script only         | `video-script script <dir>`                             |
| Generate visual plan         | `video-script visual <dir>`                             |
| Capture screenshots          | `video-script screenshot <dir>`                         |
| Render video                 | `video-script compose <dir>`                            |
| Resume workflow              | `video-script resume`                                   |
| View config                  | `video-script config`                                   |

---

## Appendix B: Exit Codes

| Code | Meaning                               |
| ---- | ------------------------------------- |
| 0    | Success                               |
| 1    | Error (see error message for details) |

---

**End of User Manual**
