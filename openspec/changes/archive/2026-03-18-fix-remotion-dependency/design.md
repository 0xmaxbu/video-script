## Context

当前项目使用 Remotion 4.0.435 版本进行视频渲染。执行 `video-script compose` 命令时，Remotion bundler 尝试解析 `@remotion/studio/renderEntry` 模块失败，导致视频渲染流程中断。

错误信息：

```
Error: Module not found: Can't resolve '@remotion/studio/renderEntry'
```

这是 Remotion 4.x 版本的一个已知问题，可能与子包之间的导出配置或依赖版本不兼容有关。

## Goals / Non-Goals

**Goals:**

- 修复 Remotion 依赖问题，使视频渲染流程恢复正常
- 确保 compose 命令能够成功生成 MP4 视频文件和 SRT 字幕文件

**Non-Goals:**

- 不修改视频渲染的核心逻辑
- 不更换到其他视频渲染方案（如 FFmpeg）

## Decisions

### D1: 选择修复方案

**选项：**

1. 降级到 Remotion 3.x 稳定版本
2. 升级到 Remotion 最新补丁版本
3. 修改项目配置（webpack、tsconfig 等）

**决策：** 方案 2 - 升级到最新补丁版本

**理由：** Remotion 4.x 是最新主版本，升级补丁版本风险最小，且可能已修复该问题。

### D2: 验证修复

**方案：** 运行 `npm run build` 和 `tsx src/cli/index.ts compose <dir>` 验证

## Risks / Trade-offs

- [Risk] 升级可能引入新问题 → [Mitigation] 保留降级到 3.x 的方案
- [Risk] 补丁版本仍有问题 → [Mitigation] 测试不同补丁版本
