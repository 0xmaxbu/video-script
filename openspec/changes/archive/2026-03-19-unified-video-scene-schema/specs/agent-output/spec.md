# Agent Output Specification

## ADDED Requirements

### Requirement: Script Agent 输出格式

script-agent 必须输出符合新 Schema 的 JSON 格式。

#### Scenario: 标准输出结构

- **WHEN** script-agent 完成脚本生成
- **THEN** 输出 JSON 包含：
  ```json
  {
    "schemaVersion": "2.0",
    "title": "视频标题",
    "totalDuration": 180,
    "scenes": [...]
  }
  ```

#### Scenario: 场景输出格式

- **WHEN** script-agent 生成单个场景
- **THEN** 场景 JSON 包含：
  ```json
  {
    "id": "scene-1",
    "type": "feature",
    "title": "场景标题",
    "narration": "旁白文本...",
    "duration": 30,
    "visualLayers": [...]
  }
  ```

### Requirement: Script Agent 指令更新

script-agent 的 instructions 必须明确说明新 Schema 的要求。

#### Scenario: 指令包含类型定义

- **WHEN** 更新 script-agent 指令
- **THEN** 指令包含：
  - 4 种场景类型的定义和用途
  - visualLayers 结构说明
  - 时长规划指导
  - 完整的 JSON 输出示例

#### Scenario: 指令包含示例

- **WHEN** 更新 script-agent 指令
- **THEN** 指令包含至少 3 个完整示例：
  - 简单视频（intro + 1 feature + outro）
  - 代码演示（intro + code + feature + outro）
  - 复杂视频（intro + 多个 feature/code + outro）

### Requirement: Script Agent 时长规划

script-agent 必须根据内容复杂度合理分配时长。

#### Scenario: 自动时长计算

- **WHEN** script-agent 生成 narration
- **THEN** duration 基于 narration 长度估算：
  - 中文：约 3 字/秒
  - 英文：约 2.5 词/秒

#### Scenario: 代码场景时长

- **WHEN** 场景类型为 `code`
- **THEN** duration 额外增加 50%（代码阅读比听慢）

### Requirement: Script Agent 视觉层生成

script-agent 必须为 feature 和 code 场景生成合适的 visualLayers。

#### Scenario: Feature 场景视觉层

- **WHEN** 生成 feature 场景
- **THEN** visualLayers 包含至少 1 个层（通常为 screenshot）

#### Scenario: Code 场景视觉层

- **WHEN** 生成 code 场景
- **THEN** visualLayers 包含 code 类型层，或使用顶层 code 字段

### Requirement: Screenshot Agent 适配

screenshot-agent 必须支持 visualLayers 结构。

#### Scenario: 遍历 visualLayers

- **WHEN** screenshot-agent 处理场景
- **THEN** 遍历 scene.visualLayers，为每个 screenshot 类型层生成截图

#### Scenario: 输出路径映射

- **WHEN** 截图生成完成
- **THEN** 截图路径存储在 `screenshotResources[visualLayer.id]`

### Requirement: Compose 命令适配

compose 命令必须支持新的 screenshotResources 映射方式。

#### Scenario: 构建资源映射

- **WHEN** compose 命令执行
- **THEN** 遍历所有场景的 visualLayers，构建 `screenshotResources` 映射

#### Scenario: 传递给 Renderer

- **WHEN** 调用 renderVideo
- **THEN** screenshotResources 映射的 key 为 `visualLayer.id`

---

## Implementation Notes

### 当前问题 (基于代码分析)

#### 1. script-agent 仍然输出旧 Schema

**位置**: `src/mastra/agents/script-agent.ts`

**问题**: Agent 输出的 scenes 包含 `type: "url" | "text"` 而非 `type: "intro" | "feature" | "code" | "outro"`

**修复**: 完全重写 script-agent 的 system prompt，明确要求输出新格式

#### 2. script-agent 缺少必填字段

**问题**: 当前输出缺少 `id`, `title`, `narration`, `duration` 字段

**修复**: 在 system prompt 中明确要求每个场景必须包含这些字段

#### 3. visualLayers 未生成

**问题**: script-agent 没有生成 visualLayers 数组

**修复**: 在 system prompt 中添加 visualLayers 的示例和要求

### Agent 指令模板

```
你是一个专业的技术视频脚本编写助手。根据用户提供的标题和研究资料，
生成符合以下格式的视频脚本 JSON。

## 场景类型定义
- intro: 视频开场，引入主题（10-15秒）
- feature: 主要内容展示功能或概念（20-60秒）
- code: 代码演示（30-90秒）
- outro: 视频结尾，总结和 CTA（10-15秒）

## 视觉层结构
每个场景可以有多个视觉层（visualLayers）：
- screenshot: 网页截图
- code: 代码块
- text: 文字叠加
- image: 图片

## 输出格式示例
{
  "schemaVersion": "2.0",
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "intro-1",
      "type": "intro",
      "title": "欢迎观看",
      "narration": "大家好，今天我们来学习...",
      "duration": 10,
      "visualLayers": [
        {
          "id": "intro-1-layer-1",
          "type": "text",
          "content": "视频标题",
          "position": { "x": "center", "y": "center" }
        }
      ]
    }
  ]
}

## 时长规划
- 中文旁白: 约3字/秒
- 代码场景: 时长增加50%
```
