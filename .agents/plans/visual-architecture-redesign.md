# 视频生成架构重构计划

## 一、背景与目标

### 当前问题
1. **截图类型单一** - 所有截图都被当作背景，缺少信息性截图（新闻、文档、代码等文字内容）
2. **视觉编排混乱** - 元素排列无规律，缺乏设计感，连基本看清楚都不容易

### 目标
- 引入信息性截图类型，让截图承载实际内容
- 新增 Visual Agent 专门负责视觉编排
- 建立布局模板系统，让 AI 选择而非设计
- 添加手绘风格标注系统，标记重点信息

### 核心设计原则

**视觉服从口播** - 所有视觉编排必须服务于口播内容

```
┌─────────────────────────────────────────────────────────────┐
│                    口播内容 = 主导                           │
│                         │                                   │
│                         ▼                                   │
│    ┌─────────────────────────────────────────────────┐     │
│    │              视觉编排 = 辅助                      │     │
│    │                                                 │     │
│    │  • 标注时机 = 口播说到这里时出现                  │     │
│    │  • 布局选择 = 配合口播内容类型                    │     │
│    │  • 动画节奏 = 跟随口播语速                        │     │
│    │  • 截图内容 = 展示口播提到的信息                  │     │
│    └─────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

这意味着：
1. **时序绑定**: 每个视觉元素的出现时间必须与口播内容对应
2. **内容对应**: 截图/标注展示的内容必须是口播正在讲的
3. **节奏同步**: 动画速度配合口播语速，不能抢戏
4. **主次分明**: 视觉是辅助理解，不是独立展示

---

## 二、新架构设计

### 数据流

```
用户输入 (title + links + doc)
       │
       ▼
┌──────────────┐
│   Research   │  ──► research.md
│    Agent     │       - 信息重要性评估 [essential/important/supporting/skip]
└──────┬───────┘       - 来源链接序号标注
       │               - 可人工编辑
       ▼
  [人工编辑确认] ◄── 等待用户确认后继续
       │
       ▼
┌──────────────┐
│    Script    │  ──► script.json
│    Agent     │       - 只处理 essential + important
└──────┬───────┘       - 纯叙事脚本，无视觉信息
       │
       ▼
┌──────────────┐
│   Visual     │  ──► visual-plan.json
│    Agent     │       - 选择布局模板
└──────┬───────┘       - 定义截图类型 + AI 动态判断选择器
       │               - 定义手绘标注
       ▼
┌──────────────┐
│  Screenshot  │  ──► screenshots/ + annotated/
│    Agent     │       - 根据类型智能截图
└──────┬───────┘       - 信息性截图：定位选择器
       │               - 装饰性截图：全页面
       ▼
┌──────────────┐
│   Compose    │  ──► Remotion 项目
│    Agent     │       - 应用布局模板
└──────────────┘       - 渲染标注动画
```

---

## 三、核心设计决策

### 1. 信息重要性分级

| 级别 | 用途 | 是否进入视频 |
|------|------|-------------|
| `essential` | 核心特性、关键变化 | ✅ 必须 |
| `important` | 重要改进、实用功能 | ✅ 必须 |
| `supporting` | 背景信息、细节说明 | ❌ 跳过 |
| `skip` | 次要内容、重复信息 | ❌ 跳过 |

### 2. Research MD 格式规范

```markdown
# {标题}

## 概述 [priority: essential]

{内容描述}
[1] {来源URL}

## 核心特性

### 1. {特性名称} [priority: essential]

{内容描述}
[2] {来源URL}

---
## 信息来源索引

[1] {标题} - {URL}
[2] {标题} - {URL}
```

### 3. 截图类型分类

```typescript
ScreenshotType =
  // 装饰性截图 (背景)
  | "hero"        // 首页/产品页大图
  | "ambient"     // 氛围图

  // 信息性截图 (前景)
  | "headline"    // 新闻标题/公告
  | "article"     // 文章段落
  | "documentation" // 文档页面
  | "codeSnippet"   // 代码块
  | "changelog"     // 更新日志
  | "feature"       // 功能特性列表
```

### 4. 布局模板 (8 个)

| 模板 | 用途 | 布局描述 |
|------|------|----------|
| `hero-fullscreen` | 开场/重点 | 全屏大图 + 底部标题 |
| `split-horizontal` | 对比/并列 | 左右分屏 (50/50) |
| `split-vertical` | 上下内容 | 上下分屏 (60/40) |
| `text-over-image` | 图文叠加 | 文字覆盖在图片上 |
| `code-focus` | 代码演示 | 代码居中，大字号 |
| `comparison` | 前后对比 | 左右对比布局 |
| `bullet-list` | 要点列表 | 垂直列表布局 |
| `quote` | 引用强调 | 大引号 + 引用文字 |

### 5. 标注系统

#### 标注类型
| 类型 | 用途 | 示例 |
|------|------|------|
| `circle` | 圈出重点 | 截图中的按钮、代码行 |
| `underline` | 强调文字 | 标题、关键句子 |
| `arrow` | 指向说明 | 注释→代码 |
| `highlight` | 背景高亮 | 整段文字、代码块 |
| `box` | 框选区域 | 表格、表单 |
| `number` | 序号标注 | 步骤说明 |
| `crossout` | 删除标记 | 旧代码 |
| `checkmark` | 完成标记 | 功能列表 |

#### 固定颜色方案
```typescript
const ANNOTATION_COLORS = {
  attention: "#FF3B30",  // 红色 - 警告、重要
  highlight: "#FFCC00",  // 黄色 - 高亮、强调
  info: "#007AFF",       // 蓝色 - 信息、说明
  success: "#34C759",    // 绿色 - 成功、完成
};
```

#### 标注动画
- **风格**: 一笔画（手绘效果）
- **实现**: SVG 路径 + stroke-dashoffset 动画
- **时机**: 根据 timing.appearAt 控制出现时间

---

## 四、实施阶段

### Phase 1: 类型定义 (基础设施)

**目标**: 建立新的类型系统

**新增文件**:
- `src/types/visual.ts` - Visual Agent 输出 Schema
- `src/types/annotation.ts` - 标注系统 Schema
- `src/types/screenshot.ts` - 截图类型定义

**修改文件**:
- `src/types/research.ts` - 添加 priority 枚举
- `src/types/script.ts` - 简化为纯叙事
- `src/types/index.ts` - 导出新类型

**关键定义**:
```typescript
// src/types/visual.ts
export const LayoutTemplateEnum = z.enum([
  "hero-fullscreen",
  "split-horizontal",
  "split-vertical",
  "text-over-image",
  "code-focus",
  "comparison",
  "bullet-list",
  "quote",
]);

// src/types/annotation.ts
export const AnnotationTypeEnum = z.enum([
  "circle", "underline", "arrow", "highlight",
  "box", "number", "crossout", "checkmark",
]);

export const AnnotationColorEnum = z.enum([
  "attention", "highlight", "info", "success",
]);
```

---

### Phase 2: 改造 Research Agent

**目标**: 输出结构化 Markdown，支持人工编辑

**修改文件**:
- `src/mastra/agents/research-agent.ts`

**输出格式**:
- Markdown 文件
- 包含 priority 标记
- 来源链接序号标注
- 末尾有完整的来源索引

**关键改动**:
1. 修改 system prompt，要求输出 Markdown
2. 要求评估每条信息的重要性
3. 要求用序号关联来源链接

---

### Phase 3: 改造 Script Agent

**目标**: 叙事编排 + 标记重点信息，为 Visual Agent 提供编排依据

**修改文件**:
- `src/mastra/agents/script-agent.ts`

**输入**:
- research.md (Markdown)

**输出**:
```typescript
{
  title: string,
  totalDuration: number,
  scenes: [{
    id: string,
    type: "intro" | "feature" | "code" | "outro",
    title: string,
    duration: number,

    // 口播内容 - 核心输出
    narration: {
      fullText: string,           // 完整口播文案
      estimatedDuration: number,  // 预估时长（秒）
      segments: [{                // 口播分段（便于 Visual 精确绑定）
        text: string,             // 这段文字
        startTime: number,        // 在场景中的开始时间
        endTime: number,          // 在场景中的结束时间
      }],
    },

    // 重点标记 - 供 Visual Agent 使用
    // 关键：包含口播中的位置信息
    highlights: [{
      text: string,           // 口播中的重点文字片段
      segmentIndex: number,   // 在哪个 segment 中
      charStart: number,      // 在 segment 中的字符起始位置
      charEnd: number,        // 在 segment 中的字符结束位置
      timeInScene: number,    // 在场景中的时间点（秒）
      importance: "critical" | "high" | "medium",
      annotationSuggestion: "circle" | "underline" | "highlight" | "number",
      reason: string,         // 为什么这是重点（供 AI 理解）
    }],

    // 代码相关重点
    codeHighlights: [{
      codeLine: number,       // 行号
      codeText: string,       // 代码内容
      explanation: string,    // 口播中的解释
      timeInScene: number,    // 口播讲到这行代码的时间点
      annotationType: "circle" | "underline" | "arrow" | "number",
    }],

    sourceRef: string,        // 引用 research.md 中的序号
  }]
}
```

**关键改动**:
1. 移除 visualLayers 相关逻辑
2. 只处理 priority 为 essential/important 的内容
3. **新增 highlights 字段**：标记叙述中的重点
4. **新增 codeHighlights 字段**：标记代码中的重点行
5. 保留 sourceRef 以追溯来源

**重点识别原则**:
- `critical`: 核心概念、关键变化、必须理解的内容
- `high`: 重要特性、实用功能、需要注意的点
- `medium`: 辅助说明、补充信息

---

### Phase 4: 创建 Visual Agent

**目标**: 根据口播内容进行视觉编排（视觉服从口播）

**新增文件**:
- `src/mastra/agents/visual-agent.ts`

**输入**:
- research.md (来源信息)
- script.json (口播内容 + 重点标记)

**核心原则 - 视觉服从口播**:
```
Visual Agent 必须回答：
1. 口播说到什么时候 → 显示什么视觉元素
2. 口播讲到哪个重点 → 什么时候出现标注
3. 口播内容类型是什么 → 选择什么布局
```

**核心逻辑**:
1. **分析口播内容**: 读取每个 scene 的 `narration`（口播文案）
2. **提取视觉触发点**: 根据 `highlights` 确定何时需要视觉辅助
3. **时序绑定**: 将每个视觉元素绑定到口播的时间轴
4. **布局选择**: 根据口播内容类型选择合适布局
5. **标注定义**: 根据口播重点定义标注的出现时机和类型

**时序绑定示例**:
```typescript
// 口播: "TypeScript 5.4 带来了一个重要更新——闭包中的类型收窄"
// 时间轴: 0s ────────────────────────────────────────────────► 3s
//
// 视觉编排:
// {
//   narrationSegment: "闭包中的类型收窄",
//   narrationTime: { start: 1.5, end: 3.0 },
//   annotation: {
//     text: "闭包类型收窄",
//     appearAt: 1.5,  // 口播说到这里时出现
//     type: "highlight"
//   }
// }
```

**输出**:
```typescript
{
  scenes: [{
    sceneId: string,
    layoutTemplate: LayoutTemplateEnum,

    // 口播时间轴（来自 Script）
    narrationTimeline: {
      text: string,          // 完整口播文案
      duration: number,      // 总时长
      segments: [{           // 口播分段（用于精确定位）
        text: string,        // 这段口播文字
        start: number,       // 开始时间
        end: number,         // 结束时间
      }],
    },

    mediaResources: [{
      id: string,
      type: ScreenshotTypeEnum,
      url: string,
      selector: string,  // AI 动态判断
      role: "primary" | "secondary" | "background",
      // 绑定到口播
      narrationBinding: {
        segmentIndex: number,  // 对应哪段口播
        appearAt: number,      // 口播说到第几秒时出现
      },
    }],

    textElements: [{
      content: string,
      role: "title" | "subtitle" | "bullet" | "quote",
      position: "top" | "center" | "bottom",
      // 绑定到口播
      narrationBinding: {
        segmentIndex: number,
        appearAt: number,
      },
    }],

    // 标注 - 必须绑定到口播时间
    annotations: [{
      type: AnnotationTypeEnum,
      target: {
        type: "text" | "region" | "code-line",
        textMatch: string,
        lineNumber: number,
      },
      style: {
        color: AnnotationColorEnum,
        size: "small" | "medium" | "large",
      },
      // 关键：绑定到口播
      narrationBinding: {
        triggerText: string,   // 口播说到这些字时触发
        segmentIndex: number,  // 对应哪段口播
        appearAt: number,      // 口播说到第几秒时出现
      },
    }],

    animationPreset: "fast" | "medium" | "slow" | "dramatic",
    transition: { type: string, duration: number },
  }]
}
```

**关键能力**:
1. **分析口播内容**: 理解每段口播在讲什么
2. **确定视觉触发点**: 口播说到哪里需要视觉辅助
3. **动态生成选择器**: 定位截图中的信息区域
4. **时序绑定**: 每个视觉元素绑定到口播时间轴

---

### Phase 5: 改造 Screenshot Agent

**目标**: 根据截图类型智能定位

**修改文件**:
- `src/mastra/agents/screenshot-agent.ts`
- `src/mastra/tools/playwright-screenshot.ts`

**截图策略**:

| 类型 | 截图方式 | 选择器示例 |
|------|----------|-----------|
| hero/ambient | 全页面 | - |
| headline | 定位标题 | `h1, .headline, .title` |
| article | 定位文章 | `article, .content, .post-body` |
| documentation | 定位文档 | `.docs-content, .markdown-body` |
| codeSnippet | 定位代码 | `pre, code, .highlight` |
| changelog | 定位日志 | `.changelog, .release-notes` |
| feature | 定位特性 | `.features, .feature-list` |

**关键改动**:
1. 读取 visual-plan.json 中的 selector
2. 如果有 selector，只截取该区域
3. 如果没有，使用全页面截图

---

### Phase 6: 创建布局与标注组件

**目标**: 实现 Remotion 布局和标注组件

**新增文件**:

布局组件 (8 个):
```
packages/renderer/src/remotion/layouts/
├── index.ts
├── HeroFullscreen.tsx
├── SplitHorizontal.tsx
├── SplitVertical.tsx
├── TextOverImage.tsx
├── CodeFocus.tsx
├── Comparison.tsx
├── BulletList.tsx
└── Quote.tsx
```

标注组件 (8 个):
```
packages/renderer/src/remotion/annotations/
├── index.ts
├── Circle.tsx       # 手绘圆圈
├── Underline.tsx    # 手绘下划线
├── Arrow.tsx        # 手绘箭头
├── Highlight.tsx    # 高亮背景
├── Box.tsx          # 手绘方框
├── Number.tsx       # 序号标注
├── Crossout.tsx     # 删除线
└── Checkmark.tsx    # 勾选标记
```

**标注动画实现**:
```typescript
// 一笔画动画核心
const HandDrawnAnimation = ({ path, color, duration }) => {
  const frame = useCurrentFrame();
  const progress = spring({ frame, fps: 30, durationInFrames: duration });

  return (
    <path
      d={path}
      stroke={color}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={pathLength}
      strokeDashoffset={pathLength * (1 - progress)}
    />
  );
};
```

---

### Phase 7: 改造 Compose Agent

**目标**: 应用布局模板和标注

**修改文件**:
- `src/mastra/agents/compose-agent.ts`
- `packages/renderer/src/remotion-project-generator.ts`

**关键改动**:
1. 读取 visual-plan.json
2. 为每个场景选择对应布局组件
3. 映射 media 和 text 元素
4. 生成标注动画代码

---

### Phase 8: CLI 集成

**目标**: 更新 CLI 流程

**修改文件**:
- `src/cli/index.ts`

**新增功能**:
1. Research 完成后输出 MD 文件路径
2. 提示用户可以编辑
3. 等待用户确认后继续
4. 新增 `--edit-research` 标志

**交互流程**:
```
$ video-script create "TypeScript 5.4" --links "..."

✓ Research completed
  Output: ~/simple-videos/.../research.md

  You can edit this file to refine the content.
  Press Enter to continue, or 'e' to edit...

[用户编辑后]
✓ Continuing with script generation...
```

---

## 五、文件改动清单

| Phase | 文件 | 操作 |
|-------|------|------|
| 1 | `src/types/visual.ts` | **新增** |
| 1 | `src/types/annotation.ts` | **新增** |
| 1 | `src/types/screenshot.ts` | **新增** |
| 1 | `src/types/research.ts` | 修改 |
| 1 | `src/types/script.ts` | 修改 |
| 1 | `src/types/index.ts` | 修改 |
| 2 | `src/mastra/agents/research-agent.ts` | 修改 |
| 3 | `src/mastra/agents/script-agent.ts` | 修改 |
| 4 | `src/mastra/agents/visual-agent.ts` | **新增** |
| 5 | `src/mastra/agents/screenshot-agent.ts` | 修改 |
| 5 | `src/mastra/tools/playwright-screenshot.ts` | 修改 |
| 6 | `packages/renderer/src/remotion/layouts/*.tsx` | **新增** (8个) |
| 6 | `packages/renderer/src/remotion/annotations/*.tsx` | **新增** (8个) |
| 7 | `src/mastra/agents/compose-agent.ts` | 修改 |
| 7 | `packages/renderer/src/remotion-project-generator.ts` | 修改 |
| 8 | `src/cli/index.ts` | 修改 |

---

## 六、风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| AI 判断 selector 不准确 | 中 | 提供常见网站选择器库；支持人工在 visual-plan.json 中修正 |
| 布局模板覆盖不足 | 低 | 从 8 个开始，根据使用反馈扩展 |
| Agent 间数据格式不兼容 | 中 | 使用 Zod 严格验证每个阶段输出 |
| 标注定位不准 | 中 | 支持多种定位方式（textMatch、lineNumber、region） |
| Remotion 组件复杂度 | 中 | 布局和标注组件独立封装，单一职责 |

---

## 七、实施顺序

```
Phase 1 ─────► Phase 2 ─────► Phase 3 ─────► Phase 4
(类型定义)     (Research)      (Script)       (Visual)
                                               │
                                               ▼
Phase 8 ◄───── Phase 7 ◄───── Phase 6 ◄───── Phase 5
(CLI)          (Compose)       (组件)         (Screenshot)
```

建议实施顺序：
1. Phase 1 → 2 → 3 → 4 (顺序依赖)
2. Phase 5 和 Phase 6 可以并行
3. Phase 7 依赖 5、6
4. Phase 8 最后

---

## 八、验证标准

### 每个 Phase 完成后验证：
- Phase 1: TypeScript 编译通过
- Phase 2: Research 输出正确的 MD 格式
- Phase 3: Script 只包含 essential/important 内容
- Phase 4: Visual Plan 包含布局选择和标注定义
- Phase 5: 截图按类型正确生成
- Phase 6: 布局和标注组件可独立运行
- Phase 7: 生成的 Remotion 项目可渲染
- Phase 8: 完整流程可跑通

### 最终验证：
- 生成一个完整视频
- 检查信息性截图是否清晰可读
- 检查布局是否有设计感
- 检查标注是否正确标记重点
