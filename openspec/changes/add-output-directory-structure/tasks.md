## 1. 依赖安装

- [ ] 1.1 安装 `slugify` 或类似库处理中文转拼音：`npm install slugify` 或自实现
- [ ] 1.2 安装 `date-fns` 依赖：`npm install date-fns`

## 2. 目录生成工具

- [ ] 2.1 创建 `src/utils/output-directory.ts`
- [ ] 2.2 实现 `generateOutputDir(title: string, basePath?: string): string` 函数
- [ ] 2.3 实现月日范围计算逻辑：格式 `M1-D1_M2-D2`（如 `3-9_3-15`）
- [ ] 2.4 实现选题 slug 转换：中文转拼音，特殊字符移除
- [ ] 2.5 实现 CLI --output 参数覆盖默认路径的逻辑
- [ ] 2.6 添加单元测试覆盖目录生成逻辑

## 3. 文件读写工具

- [ ] 3.1 创建 `src/mastra/tools/file-operations.ts`
- [ ] 3.2 实现 `writeJsonFile` 工具：接收 path 和 data，写入 JSON 文件到输出目录
- [ ] 3.3 实现 `readJsonFile` 工具：接收 path，从输出目录读取并返回 JSON
- [ ] 3.4 实现 `fileExists` 工具（可选）：检查输出目录中文件是否存在
- [ ] 3.5 在 `src/mastra/tools/index.ts` 导出新工具
- [ ] 3.6 为工具编写单元测试

## 4. 工作流集成

- [ ] 4.1 修改 CLI `create` 命令，支持 --output 参数
- [ ] 4.2 在工作流启动时调用 generateOutputDir 生成输出目录
- [ ] 4.3 将输出目录路径通过 step input 传递给各 Agent
- [ ] 4.4 修改 Research Agent 工具配置：使用 writeJsonFile 保存 research.json
- [ ] 4.5 修改 Script Agent：使用 readJsonFile 读取 research.json，使用 writeJsonFile 写入 script.json
- [ ] 4.6 修改 Screenshot Agent：使用 readJsonFile 读取 script.json，使用 writeJsonFile 写入 screenshots.json
- [ ] 4.7 修改 Compose Agent：读取相关 JSON 文件，输出 composition.json

## 5. 测试与文档

- [ ] 5.1 运行完整测试：`npm test`
- [ ] 5.2 更新 TESTING.md 文档，说明新的目录结构
- [ ] 5.3 手动测试完整流程验证功能正常
