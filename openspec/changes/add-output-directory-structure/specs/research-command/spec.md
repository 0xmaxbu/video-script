## ADDED Requirements

### Requirement: 输出目录生成

系统 SHALL 根据当前日期和视频选题自动生成结构化输出目录，格式为 `{基准路径}/{年}/{周-月_日-月_日}_{选题slug}/`。

#### Scenario: 生成标准目录

- **WHEN** 用户执行 `video-script research "TypeScript 泛型教程"` 且当前日期为 2026 年 3 月 9 日至 3 月 15 日（第 11 周）
- **THEN** 系统 SHALL 创建目录 `output/2026/11-3_9-3_15/typescript-generics-tutorial/`

#### Scenario: 使用 --output 参数

- **WHEN** 用户执行 `video-script research "测试" --output /custom/path`
- **THEN** 系统 SHALL 使用 `/custom/path` 作为输出目录，所有文件都保存到该路径

#### Scenario: 选题名包含特殊字符

- **WHEN** 用户执行 `video-script research "React Hooks: 完整指南"`
- **THEN** 系统 SHALL 转换为 slug 格式的目录名，如 `react-hooks-wan-zheng-zhi-nan`

### Requirement: 周范围计算

系统 SHALL 正确计算周范围，格式为 `W-M_D-M_D`。

#### Scenario: 同月范围

- **WHEN** 当前日期为 2026 年 3 月 9 日至 3 月 15 日（第 11 周）
- **THEN** 系统 SHALL 生成 `11-3_9-3_15`

### Requirement: 生成 research.json

系统 SHALL 生成 research.json，包含口播内容（sentence）、关键技术点（keyContent，JSON 格式）、参考链接（links）。

#### Type: ResearchLink

```typescript
interface ResearchLink {
  url: string; // 必须，完整的 URL 地址
  key: string; // 必须，页面主题关键词（用于关联 segment）
}
```

#### Type: ResearchSegment

```typescript
interface ResearchSegment {
  order: number; // 必须，正整数，段序号
  sentence: string; // 必须，口播文案内容
  keyContent: string; // 必须，关键技术点（JSON 格式字符串）
  links: ResearchLink[]; // 必须，相关链接数组
}
```

#### Type: ResearchOutput

```typescript
interface ResearchOutput {
  title: string; // 必须，视频标题
  segments: ResearchSegment[]; // 必须，口播段落数组
}
```

#### Scenario: research.json 格式

- **WHEN** research 阶段完成
- **THEN** 系统 SHALL 生成如下格式的 research.json：

```json
{
  "title": "标题",
  "segments": [
    {
      "order": 1,
      "sentence": "口播内容",
      "keyContent": "{\"concept\": \"泛型\", \"code\": \"T\"}",
      "links": [{ "url": "https://...", "key": "泛型" }]
    }
  ]
}
```

#### Scenario: sentence 是口播内容

- **WHEN** Script Agent 读取 research.json
- **THEN** `sentence` 字段 SHALL 作为口播文案，动画编排必须服务于这个节奏
