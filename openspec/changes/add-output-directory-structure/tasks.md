## 1. CLI 重构

- [ ] 1.1 移除 `create` 命令
- [ ] 1.2 移除 `resume` 命令
- [ ] 1.3 新增 `research` 子命令
- [ ] 1.4 新增 `script` 子命令
- [ ] 1.5 新增 `screenshot` 子命令
- [ ] 1.6 新增 `compose` 子命令

## 2. 类型定义

- [ ] 2.1 定义 `ResearchLink` 类型（url, key）
- [ ] 2.2 定义 `ResearchSegment` 类型（order, sentence, keyContent, links）
- [ ] 2.3 定义 `ResearchOutput` 类型（title, segments）
- [ ] 2.4 定义 `ScreenshotConfig` 类型
- [ ] 2.5 定义 `Effect` 类型（type, duration, delay, + 动态参数）
- [ ] 2.6 定义 `Scene` 类型
- [ ] 2.7 定义 `Transition` 类型
- [ ] 2.8 定义 `ScriptOutput` 类型

## 3. 输出目录工具

- [ ] 3.1 创建 `src/utils/output-directory.ts`
- [ ] 3.2 实现 `generateOutputDir(title: string, basePath?: string): string` 函数
- [ ] 3.3 实现周范围计算：格式 `W-M_D-M_D`
- [ ] 3.4 实现选题 slug 转换（中文转拼音，特殊字符移除）
- [ ] 3.5 添加单元测试

## 4. Agent 重构

- [ ] 4.1 修改 Research Agent：生成 ResearchOutput 格式
- [ ] 4.2 修改 Script Agent：读取 research.json，按口播节奏编排场景
- [ ] 4.3 修改 Screenshot Agent：读取 script.json
- [ ] 4.4 修改 Compose Agent：读取 script.json 和截图

## 5. 错误处理

- [ ] 5.1 网络请求自动重试：失败时重试 3 次，指数回退
- [ ] 5.2 截图超时处理：超时后重试，最长等待 30 秒
- [ ] 5.3 截图失败处理：单图失败不影响其他截图，继续执行

## 6. 移除旧代码

- [ ] 6.1 删除 `video-generation-workflow.ts`
- [ ] 6.2 删除 `review.ts`（不再需要）
- [ ] 6.3 清理相关导入和引用

## 7. SRT 字幕生成

- [ ] 7.1 实现 SRT 字幕生成器（读取 script.json 的 narration）
- [ ] 7.2 实现时间轴同步（scene duration → SRT time codes）
- [ ] 7.3 添加单元测试

## 8. 测试与文档

- [ ] 8.1 为新类型定义编写单元测试
- [ ] 8.2 为 output-directory 工具编写单元测试
- [ ] 8.3 运行完整测试：`npm test`
- [ ] 8.4 更新 TESTING.md 文档
- [ ] 8.5 更新 README.md
- [ ] 8.6 手动测试完整流程：research → script → screenshot → compose
