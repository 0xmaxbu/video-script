# Video Script 🎬

> AI-powered CLI tool for generating technical tutorial videos from titles, links, and documentation.

## Overview

Video Script automates the entire video generation pipeline for tech tutorials:

1. **Research** - Collects and analyzes information from URLs and documents
2. **Script** - Generates narration and scene breakdown with precise timing
3. **Screenshots** - Captures web pages and highlights code
4. **Composition** - Creates Remotion video project with timeline
5. **Rendering** - Produces MP4 video with SRT subtitles

## Requirements

- **Node.js** >= 18.0.0
- **npm** or **pnpm** (for dependency management)
- **API Keys** (configurable - OpenAI or Anthropic)

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/0xmaxbu/video-script.git
cd video-script

# Install dependencies
npm install

# Build the project
npm run build

# (Optional) Install globally
npm install -g .
```

### From NPM (Coming Soon)

```bash
npm install -g video-script
```

## Quick Start

### Basic Usage

```bash
# Interactive mode
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
  --doc ./notes.md \
  --output ./videos
```

### Example Output

After running the command, you'll get:

```
output/
├── video-generation-2025-03-15T10-30-00Z/
│   ├── research-data.json        # Collected information
│   ├── script.json               # Generated script with scenes
│   ├── screenshots/              # Captured images
│   │   ├── scene-1.png
│   │   ├── scene-2.png
│   │   └── ...
│   ├── highlights/               # Code syntax highlighted
│   │   ├── example-1.png
│   │   └── ...
│   ├── remotion/                 # Video project
│   │   └── composition.tsx
│   ├── final-video.mp4           # Final video output
│   └── final-video.srt           # SRT subtitles
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# LLM Configuration (required)
OPENAI_API_KEY=sk-...              # Use OpenAI (recommended)
# OR
ANTHROPIC_API_KEY=sk-ant-...       # Use Anthropic Claude

# Optional: Customize model
LLM_MODEL=gpt-4-turbo              # Default: gpt-4-turbo
# OR
LLM_MODEL=claude-3-sonnet-20240229 # For Anthropic

# Optional: Video settings
VIDEO_FPS=30                        # Frames per second (default: 30)
VIDEO_CODEC=h264                    # Video codec (default: h264)
```

### Configuration File (video-script.config.json)

Create in project root for advanced settings:

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

## Usage Examples

### Example 1: Generate Video from Article

```bash
video-script create "How to Use React Hooks" \
  --links "https://react.dev/reference/react/hooks" \
  --output ./my-videos
```

### Example 2: Generate from Documentation

```bash
video-script create "Async/Await in JavaScript" \
  --doc ./async-await-guide.md \
  --output ./my-videos
```

### Example 3: Interactive Mode with All Options

```bash
video-script create

# Follow the prompts:
# ? Title: Understanding Docker Containers
# ? Links (comma-separated): https://docker.io/...
# ? Documentation file: ./docker-notes.md
# ? Output directory: ./videos
```

## CLI Commands

### `video-script create [title]`

Generate a new video from scratch.

**Options:**

```
--links <urls>        Comma-separated URLs to fetch content from
--doc <file>         Path to markdown documentation file
--output <dir>       Output directory (default: ./output)
--skip-research      Skip research phase (use cache)
--dry-run           Preview without rendering video
--help              Show help message
```

### `video-script config`

View or update configuration.

**Options:**

```
--set <key> <value>  Set configuration value
--show              Display current configuration
--reset             Reset to defaults
```

## Development

### Project Structure

```
src/
├── cli/                          # CLI entry point
│   └── index.ts                 # Command definitions
├── mastra/                       # Agent framework
│   ├── agents/                  # 4 AI agents
│   │   ├── research-agent.ts   # Web research & analysis
│   │   ├── script-agent.ts     # Script generation
│   │   ├── screenshot-agent.ts # Screen capture
│   │   └── compose-agent.ts    # Video composition
│   ├── tools/                   # Reusable tools
│   │   ├── web-fetch.ts        # HTTP fetching
│   │   ├── playwright-screenshot.ts  # Screen capture
│   │   ├── code-highlight.ts   # Syntax highlighting
│   │   └── remotion-render.ts  # Video rendering
│   └── workflows/               # Workflow orchestration
│       └── video-generation-workflow.ts
├── types/                        # TypeScript interfaces
├── utils/                        # Utilities
│   ├── errors.ts                # Error handling
│   ├── srt-generator.ts         # Subtitle generation
│   └── index.ts                 # Export index
└── remotion/                     # Video components
    └── composition.tsx          # Remotion React components
```

### Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Type checking
npm run typecheck

# Code formatting
npm run format

# Linting
npm run lint

# Production build
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- web-fetch.test.ts

# Watch mode for development
npm test:watch

# Generate coverage report
npm test -- --coverage
```

## Architecture

### Data Flow

```
Input (title + links + document)
  ↓
Research Agent (collect info)
  ↓
Script Agent (generate narration)
  ↓
Screenshot Agent (capture images)
  ↓
Compose Agent (create composition)
  ↓
Remotion Render (generate MP4)
  ↓
SRT Generator (create subtitles)
  ↓
Output (MP4 + SRT)
```

### Technology Stack

| Layer             | Technology              | Version  |
| ----------------- | ----------------------- | -------- |
| Runtime           | Node.js + TypeScript    | TS 5.4+  |
| CLI               | Commander.js + Inquirer | Latest   |
| Agent Framework   | Mastra                  | ^1.13.2  |
| LLM               | OpenAI/Anthropic        | -        |
| Screenshot        | Playwright              | ^1.58.2  |
| Code Highlight    | Shiki                   | ^4.0.2   |
| Video Composition | Remotion                | ^4.0.435 |
| Testing           | Vitest                  | ^4.1.0   |

## Error Handling

The tool includes comprehensive error handling for common issues:

```typescript
// Examples of handled errors:
- INVALID_INPUT: Validation errors
- WEB_FETCH_FAILED: Network issues
- SCREENSHOT_FAILED: Screenshot timeout
- CODE_HIGHLIGHT_FAILED: Syntax highlighting errors
- REMOTION_RENDER_FAILED: Video rendering errors
- LLM_API_ERROR: API failures
- TIMEOUT: Request timeouts
```

All errors are logged with context and provide user-friendly messages.

## Troubleshooting

### API Key Issues

```bash
# Verify API key is set
echo $OPENAI_API_KEY

# If not set:
export OPENAI_API_KEY=sk-...
```

### Playwright Browser Issues

```bash
# Install browser dependencies
npx playwright install

# Or install specific browser
npx playwright install chrome
```

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

### Timeout Issues

Increase timeout in config:

```json
{
  "screenshot": {
    "timeout": 60000
  }
}
```

## Roadmap

### MVP (Current)

- [x] CLI with interactive input
- [x] Research Agent (web fetching + analysis)
- [x] Script Agent (narration generation)
- [x] Screenshot Agent (webpage + code capture)
- [x] Compose Agent (Remotion project)
- [x] MP4 video output
- [x] SRT subtitle output
- [x] Comprehensive error handling
- [x] Full test coverage (80%+)

### Phase 2 (Future)

- [ ] TTS voice narration
- [ ] Support for 9:16 aspect ratio
- [ ] Batch video generation
- [ ] Browser pool optimization
- [ ] Cloud rendering support
- [ ] Docker containerization

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Format code (`npm run format`)
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/0xmaxbu/video-script/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0xmaxbu/video-script/discussions)
- **Documentation**: [Full Docs](./docs)

## Changelog

### v0.1.0 (Initial Release)

- Initial release with core functionality
- 4 AI agents (Research, Script, Screenshot, Compose)
- Remotion-based video composition
- SRT subtitle generation
- Comprehensive test coverage
- Error handling and retry logic

---

**Built with ❤️ using Mastra, Remotion, and TypeScript**
