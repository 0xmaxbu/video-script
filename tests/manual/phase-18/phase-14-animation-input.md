# Phase 18 Fixed Input: Phase 14 Animation Engine

## Fixed Topic

- Title: `Phase 14 Animation Engine`

## Fixed Reference Links

1. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/.planning/phases/14-animation-engine/14-CONTEXT.md`
2. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/Composition.tsx`
3. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/components/ScreenshotLayer.tsx`
4. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/components/KineticSubtitle.tsx`
5. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/.planning/phases/14-animation-engine/14-GAP-06-SUMMARY.md`

## Fixed Output Directories

- One-shot: `test-output/phase-18/one-shot`
- Resume: `test-output/phase-18/resume`

## Fixed Command Templates

### Preflight

```bash
bash tests/manual/phase-18/preflight-check.sh
```

### One-shot create --no-review

```bash
node dist/cli/index.js create "Phase 14 Animation Engine" --links "https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/.planning/phases/14-animation-engine/14-CONTEXT.md,https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/Composition.tsx,https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/components/ScreenshotLayer.tsx,https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/components/KineticSubtitle.tsx,https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/.planning/phases/14-animation-engine/14-GAP-06-SUMMARY.md" --output "test-output/phase-18/one-shot" --no-review --aspect-ratio "16:9"
```

### Paused create

```bash
node dist/cli/index.js create "Phase 14 Animation Engine" --links "https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/.planning/phases/14-animation-engine/14-CONTEXT.md,https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/Composition.tsx,https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/components/ScreenshotLayer.tsx,https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/components/KineticSubtitle.tsx,https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/.planning/phases/14-animation-engine/14-GAP-06-SUMMARY.md" --output "test-output/phase-18/resume" --aspect-ratio "16:9"
```

### Resume

```bash
node dist/cli/index.js resume
```

## Execution Notes

- Do not change the title, links, or output directories during Phase 18 execution.
- Run the one-shot path first, then the paused create + resume path.
- After each real run, package artifacts with `bash tests/manual/phase-18/package-artifacts.sh <output_dir> phase-14-animation-engine.mp4`.
