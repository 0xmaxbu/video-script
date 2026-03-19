/**
 * Scene Accumulator - 场景累加器
 *
 * 增量保存场景，支持幂等检查和部分失败保留。
 * [Spec-Ref: design.md#幂等保存策略]
 */

import { ScriptOutput, SceneScript } from "../types/script.js";

/**
 * 场景累加器接口
 */
export interface SceneAccumulator {
  /**
   * 添加场景（幂等检查）
   * - 如果场景 ID 已存在，跳过不覆盖
   * @param scene 场景数据
   * @returns 是否添加成功（false 表示已存在）
   */
  addScene(scene: SceneScript): boolean;

  /**
   * 添加视觉层到指定场景
   * @param sceneId 场景 ID
   * @param visualLayers 视觉层数组
   */
  addVisualLayers(
    sceneId: string,
    visualLayers: SceneScript["visualLayers"],
  ): void;

  /**
   * 增量保存到 partial-script.json
   * @param outputPath 输出路径
   */
  savePartial(outputPath: string): Promise<void>;

  /**
   * 获取当前脚本
   */
  getScript(): ScriptOutput | null;

  /**
   * 重置累加器
   */
  reset(): void;
}

/**
 * 创建场景累加器实例
 */
export function createSceneAccumulator(): SceneAccumulator {
  // TODO: 实现
  throw new Error("Not implemented");
}
