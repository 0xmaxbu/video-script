## 1. Script Agent 修复

- [ ] 1.1 更新 `src/mastra/agents/script-agent.ts` 的 instructions，添加符合 ScriptOutputSchema 的 JSON 示例
- [ ] 1.2 确保 Agent 输出包含必需字段：order, segmentOrder, type, content
- [ ] 1.3 确保 transitions 数组（如果存在）包含正确的 type 值

## 2. CLI 环境变量加载

- [ ] 2.1 检查 `src/cli/index.ts` 入口文件
- [ ] 2.2 添加 dotenv 导入和 config 调用
- [ ] 2.3 验证 CLI 在没有手动 export 情况下能读取 API Key

## 3. 构建和验证

- [ ] 3.1 运行 `npm run build` 确保 dist 同步
- [ ] 3.2 运行 E2E 测试验证 Step 2 (Script) 通过
- [ ] 3.3 运行完整 E2E 流程：research → script → screenshot → compose
