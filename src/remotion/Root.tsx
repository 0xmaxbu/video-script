import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { VideoComposition } from "./Composition";
import { ScriptOutputSchema } from "../types";

const compositionSchema = z.object({
  script: ScriptOutputSchema,
  images: z.record(z.string(), z.string()).optional(),
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Video"
        component={VideoComposition as any}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={compositionSchema}
        calculateMetadata={async ({ props }) => {
          if (!props.script) return { durationInFrames: 300 };
          return {
            durationInFrames: Math.ceil(props.script.totalDuration * 30),
          };
        }}
        defaultProps={{
          script: {
            title: "Default Video",
            totalDuration: 10,
            scenes: [
              {
                id: "intro",
                type: "intro",
                title: "Welcome",
                narration: "Hello world",
                duration: 5,
              },
              {
                id: "outro",
                type: "outro",
                title: "Thanks",
                narration: "Goodbye",
                duration: 5,
              },
            ],
          },
          images: {},
        }}
      />
    </>
  );
};
