import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { VideoComposition } from "./Composition";

const compositionSchema = z.object({
  script: z.object({
    title: z.string(),
    scenes: z.array(
      z.object({
        order: z.number().int().positive(),
        segmentOrder: z.number().int().positive(),
        type: z.enum(["url", "text"]),
        content: z.string(),
        screenshot: z.any().optional(),
        effects: z.array(z.any()).optional(),
      })
    ),
    transitions: z.array(z.any()).optional(),
  }),
  images: z.record(z.string(), z.string()).optional(),
});

export const RemotionRoot: React.FC = () => {
  const script = {"title":"Python 异步编程指南","scenes":[{"order":1,"segmentOrder":1,"type":"text","content":"欢迎学习 Python 异步编程！今天我们将深入了解 asyncio，帮助你掌握高效的并发编程技巧。","effects":[{"type":"textFadeIn","direction":"up","stagger":0.1}]},{"order":2,"segmentOrder":1,"type":"url","content":"https://realpython.com/async-io-python/","screenshot":{"background":"#1E1E1E","width":1920,"fontSize":14,"fontFamily":"Fira Code"},"effects":[{"type":"sceneFade","duration":0.5}]},{"order":3,"segmentOrder":2,"type":"url","content":"https://docs.python.org/3/library/asyncio.html","screenshot":{"background":"#1E1E1E","width":1920,"fontSize":14,"fontFamily":"Fira Code"},"effects":[{"type":"sceneFade","duration":0.5}]},{"order":4,"segmentOrder":3,"type":"url","content":"https://realpython.com/async-io-python/","screenshot":{"background":"#1E1E1E","width":1920,"fontSize":14,"fontFamily":"Fira Code"},"effects":[{"type":"sceneFade","duration":0.5}]},{"order":5,"segmentOrder":4,"type":"url","content":"https://docs.python.org/3/library/asyncio.html","screenshot":{"background":"#1E1E1E","width":1920,"fontSize":14,"fontFamily":"Fira Code"},"effects":[{"type":"sceneFade","duration":0.5}]},{"order":6,"segmentOrder":5,"type":"url","content":"https://realpython.com/async-io-python/","screenshot":{"background":"#1E1E1E","width":1920,"fontSize":14,"fontFamily":"Fira Code"},"effects":[{"type":"sceneFade","duration":0.5}]},{"order":7,"segmentOrder":6,"type":"url","content":"https://docs.python.org/3/library/asyncio.html","screenshot":{"background":"#1E1E1E","width":1920,"fontSize":14,"fontFamily":"Fira Code"},"effects":[{"type":"sceneFade","duration":0.5}]},{"order":8,"segmentOrder":7,"type":"url","content":"https://realpython.com/async-io-python/","screenshot":{"background":"#1E1E1E","width":1920,"fontSize":14,"fontFamily":"Fira Code"},"effects":[{"type":"sceneFade","duration":0.5}]},{"order":9,"segmentOrder":8,"type":"url","content":"https://docs.python.org/3/library/asyncio.html","screenshot":{"background":"#1E1E1E","width":1920,"fontSize":14,"fontFamily":"Fira Code"},"effects":[{"type":"sceneFade","duration":0.5}]},{"order":10,"segmentOrder":8,"type":"text","content":"总结：asyncio 是 Python 处理 I/O 密集型任务的利器。掌握协程、事件循环和并发任务管理，你就能写出高效异步代码！","effects":[{"type":"textFadeIn","direction":"up","stagger":0.1}]}],"transitions":[{"from":1,"to":2,"type":"sceneFade","duration":0.5},{"from":2,"to":3,"type":"sceneFade","duration":0.5},{"from":3,"to":4,"type":"sceneFade","duration":0.5},{"from":4,"to":5,"type":"sceneFade","duration":0.5},{"from":5,"to":6,"type":"sceneFade","duration":0.5},{"from":6,"to":7,"type":"sceneFade","duration":0.5},{"from":7,"to":8,"type":"sceneFade","duration":0.5},{"from":8,"to":9,"type":"sceneFade","duration":0.5},{"from":9,"to":10,"type":"sceneFade","duration":0.5}]};
  const images = {"3":"output/2026/12-3_16-3_22/python-yi-bu-bian-cheng-zhi-nan/screenshots/scene-003.png","5":"output/2026/12-3_16-3_22/python-yi-bu-bian-cheng-zhi-nan/screenshots/scene-005.png","7":"output/2026/12-3_16-3_22/python-yi-bu-bian-cheng-zhi-nan/screenshots/scene-007.png","9":"output/2026/12-3_16-3_22/python-yi-bu-bian-cheng-zhi-nan/screenshots/scene-009.png"};
  const totalDuration = script.scenes.length * 30; // Calculate from scenes

  return (
    <>
      <Composition
        id="Video"
        component={VideoComposition as any}
        durationInFrames={Math.ceil(totalDuration * 30)}
        fps={30}
        width={1920}
        height={1080}
        schema={compositionSchema}
        defaultProps={{
          script,
          images,
        }}
      />
    </>
  );
};
