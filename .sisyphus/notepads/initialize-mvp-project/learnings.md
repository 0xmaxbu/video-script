## Remotion Project Infrastructure (2025-03-15)

### Implementation Details

1.  **Created `src/remotion/` Structure**
    - `Root.tsx`: Main entry point exporting `RemotionRoot`.
    - `Composition.tsx`: Renders the sequence of scenes based on script.
    - `Scene.tsx`: Individual scene renderer (intro, feature, code, outro).
    - `Subtitle.tsx`: Simple subtitle overlay component.
    - `index.ts`: Registers the root component.

2.  **Type Safety & Schemas**
    - Used `z.record(z.string(), z.string())` for `images` prop to satisfy Zod 4 signature.
    - Explicitly defined `compositionSchema` for `Composition` component.
    - Cast `VideoComposition` to `any` in `Root.tsx` to bypass Remotion's strict `LooseComponentType` check against `Record<string, unknown>` when using strict props.
    - Updated `SceneProps` to use `imagePath: string | undefined` to be compatible with `exactOptionalPropertyTypes`.

3.  **Dynamic Duration**
    - Implemented `calculateMetadata` in `Root.tsx` to compute `durationInFrames` dynamically based on `script.totalDuration` and `fps`.
    - This allows the video length to adapt to the generated script.

4.  **Dependencies**
    - Installed `@types/react` and `@types/react-dom` for TypeScript support.
    - Configured `tsconfig.json` with `"jsx": "react-jsx"`.

### Key Learnings

- **Remotion in Node.js**: Requires a defined `Root` component even if rendering via CLI/Node API, as `renderMedia` uses the composition defined there.
- **Zod 4 Compatibility**: `z.record` requires explicit key and value schemas in some contexts or versions.
- **Strict TypeScript**: `exactOptionalPropertyTypes` requires careful handling of optional props vs `undefined` values.
- **Component Typing**: Remotion's `Composition` component has complex typing for `component` prop, sometimes requiring casts if using strict custom props.
