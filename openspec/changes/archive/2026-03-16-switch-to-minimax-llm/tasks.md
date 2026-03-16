## 1. 配置 MiniMax API

- [ ] 1.1 在 .env 文件中添加 `MINIMAX_API_KEY`（将 MINIMAX_CN_API_KEY 的值复制过来）
- [ ] 1.2 验证环境变量配置正确

## 2. 修改 Agent 模型配置

- [ ] 2.1 修改 research-agent.ts 的 model 为 `minimax-cn-coding-plan/MiniMax-M2.5`
- [ ] 2.2 E2E 测试 research-agent 调用 MiniMax 返回正常
- [ ] 2.3 修改 script-agent.ts 的 model 为 `minimax-cn-coding-plan/MiniMax-M2.5`
- [ ] 2.4 E2E 测试 script-agent 调用 MiniMax 返回正常
- [ ] 2.5 修改 screenshot-agent.ts 的 model 为 `minimax-cn-coding-plan/MiniMax-M2.5`
- [ ] 2.6 E2E 测试 screenshot-agent 调用 MiniMax 返回正常
- [ ] 2.7 修改 compose-agent.ts 的 model 为 `minimax-cn-coding-plan/MiniMax-M2.5`
- [ ] 2.8 E2E 测试 compose-agent 调用 MiniMax 返回正常

## 3. 验证

- [ ] 3.1 运行 `npm test` 验证所有测试通过
- [ ] 3.2 运行 `npm run typecheck` 验证类型检查通过

## 4. 提交

- [ ] 4.1 提交代码更改
