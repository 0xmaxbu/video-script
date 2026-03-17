## ADDED Requirements

### Requirement: 读取 research.json

系统 SHALL 从输出目录读取 research.json 用于视频脚本生成。

#### Scenario: 读取成功

- **WHEN** 执行 `video-script script <目录>`
- **THEN** 系统 SHALL 读取 `research.json` 并返回解析后的数据

#### Scenario: 文件不存在

- **WHEN** 指定目录下不存在 `research.json`
- **THEN** 系统 SHALL 返回错误信息

### Requirement: 动画服务于口播节奏

**核心约束：动画编排必须服务于 research.json 中 sentence（口播内容）的节奏。**

#### Scenario: 按口播节奏编排

- **WHEN** research.json 中的 `sentence` 描述了口播内容
- **THEN** Script Agent SHALL 按照这个 sentence 的节奏来决定何时展示哪个 URL、何时播放什么动画

#### Scenario: segmentOrder 关联

- **WHEN** 生成 scene
- **THEN** 系统 SHALL 使用 `segmentOrder` 字段关联到 research 的 segment

### Requirement: 生成 script.json

系统 SHALL 生成 script.json，包含完整的场景、动画、转场配置。

#### Scenario: script.json 完整格式

- **WHEN** script 阶段完成
- **THEN** 系统 SHALL 生成如下格式的 script.json：

```json
{
  "title": "标题",
  "scenes": [
    {
      "order": 1,
      "segmentOrder": 1,
      "type": "url",
      "content": "https://typescriptlang.org/docs/...",
      "screenshot": {
        "background": "#1E1E1E",
        "maxLines": 15,
        "width": 1920,
        "fontSize": 14,
        "fontFamily": "Fira Code",
        "padding": 40,
        "theme": "github-dark"
      },
      "effects": [
        {
          "type": "codeHighlight",
          "lines": [1, 2],
          "color": "#FFE066",
          "duration": 2
        }
      ]
    },
    {
      "order": 2,
      "segmentOrder": 1,
      "type": "text",
      "content": "纯文字内容...",
      "screenshot": {
        "background": "#282A36",
        "maxLines": 10,
        "width": 1920,
        "fontSize": 16
      },
      "effects": [{ "type": "textFadeIn", "direction": "up", "stagger": 0.1 }]
    }
  ],
  "transitions": [{ "from": 1, "to": 2, "type": "sceneFade", "duration": 0.3 }]
}
```

#### Scenario: scene 的 filename 不在 JSON 里

- **WHEN** 生成 scene
- **THEN** 系统 SHALL 不在 script.json 中指定 filename
- **AND** 截图阶段 SHALL 由系统自动生成唯一文件名

### Requirement: 截图配置生成

系统 SHALL 为每个场景生成截图配置，由 Script Agent 根据页面内容设定。

#### Scenario: URL 场景配置

- **WHEN** 场景类型为 `url`
- **THEN** 系统 SHALL 生成包含以下字段的配置：
  - background: 背景色，默认 "#1E1E1E" (VS Code Dark)
  - maxLines: 最大行数
  - width: 截图宽度，默认 1920
  - fontSize: 字号，默认 14
  - fontFamily: 字体，默认 "Fira Code"
  - padding: 内边距
  - theme: 代码高亮主题

#### Scenario: 文字场景配置

- **WHEN** 场景类型为 `text`
- **THEN** 系统 SHALL 为纯文字内容生成截图配置

### Requirement: Effect 类型定义

系统 SHALL 支持以下 Effect 类型（Modern Developer Tutorial 风格）：

#### Effect 参数约束

| Effect Type   | 参数        | 类型     | 约束                   |
| ------------- | ----------- | -------- | ---------------------- |
| codeHighlight | lines       | number[] | 正整数数组             |
| codeHighlight | color       | string   | 十六进制颜色 (#RRGGBB) |
| codeHighlight | duration    | number   | 0.1-10 秒              |
| codeZoom      | scale       | number   | 0.1-5.0                |
| codeZoom      | anchor      | number[] | [x, y]，范围 0-1       |
| codeZoom      | duration    | number   | 0.1-10 秒              |
| codePan       | from        | number[] | [x, y] 像素坐标        |
| codePan       | to          | number[] | [x, y] 像素坐标        |
| codePan       | duration    | number   | 0.1-10 秒              |
| codeType      | speed       | number   | 1-200 字符/秒          |
| codeType      | cursorBlink | boolean  | -                      |
| textFadeIn    | direction   | string   | up\|down\|left\|right  |
| textFadeIn    | stagger     | number   | 0-1 秒                 |
| textSlideIn   | direction   | string   | up\|down\|left\|right  |
| textSlideIn   | distance    | number   | 0-500 像素             |
| textZoomIn    | scale       | number   | 0.1-3.0                |
| sceneFade     | duration    | number   | 0.1-5 秒               |
| sceneSlide    | direction   | string   | up\|down\|left\|right  |
| sceneSlide    | duration    | number   | 0.1-5 秒               |
| sceneZoom     | fromScale   | number   | 0.1-2.0                |
| sceneZoom     | toScale     | number   | 0.1-2.0                |
| sceneZoom     | anchor      | number[] | [x, y]，范围 0-1       |
| sceneZoom     | duration    | number   | 0.1-5 秒               |

### Requirement: Transitions 定义

系统 SHALL 支持 transitions 数组，定义场景间的转场效果。

#### Scenario: 转场配置

- **WHEN** 定义 transition
- **THEN** 系统 SHALL 使用以下格式：
  - from: 源 scene order (number)
  - to: 目标 scene order (number)
  - type: 转场类型 (sceneFade, sceneSlide, sceneZoom)
  - duration: 持续时间
