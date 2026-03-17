# 实现任务清单

## 1. Schema 修复

- [ ] 1.1 扩展 ResearchOutputSchema 以匹配 research-agent 输出
  - 添加 title, overview 字段
  - 修改 keyPoints 为对象数组
  - 修改 sources 为对象数组
  - 添加 scenes 字段
- [ ] 1.2 扩展 SceneSchema 以支持 startTime/endTime
  - 添加 startTime, endTime 可选字段
  - 保留 duration 字段
  - 添加 visualType 字段
  - 添加 visualContent 字段
- [ ] 1.3 运行 typecheck 验证 schema 变更
- [ ] 1.4 运行测试确保现有测试通过

## 2. Workflow 修复

- [ ] 2.1 修复 humanReviewStep 以支持 `_skipReview` 标志
  - 在 execute 中检查 inputData.\_skipReview
  - 如果为 true，跳过 suspend() 并直接返回
- [ ] 2.2 添加 scriptStep 输出转换逻辑
  - 将 scene.id 从 number 转换为 string
  - 计算 duration（如果只有 startTime/endTime）
  - 将 visualType 映射到 type 字段
  - 构造 screenshot 或 code 对象
- [ ] 2.3 运行 typecheck 验证 workflow 变更
- [ ] 2.4 运行测试确保 workflow 测试通过

## 3. CLI 修复

- [ ] 3.1 修复 workflow ID
  - 将 `"videoGeneration"` 改为 `"video-generation-workflow"`
- [ ] 3.2 添加 `_skipReview` 标志传递
  - 在 `--no-review` 选项时设置 input.\_skipReview = true
- [ ] 3.3 添加 suspended 状态检测
  - 检查 workflowResult.status === 'suspended'
  - 显示脚本内容
  - 显示 runId 和 resume 命令提示
- [ ] 3.4 实现脚本内容显示功能
  - 格式化显示标题和总时长
  - 显示每个场景的摘要
- [ ] 3.5 添加 `resume` 命令
  - 接受 runId 参数
  - 接受 --file 参数
  - 调用 workflow.resume()
- [ ] 3.6 运行 typecheck 验证 CLI 变更

## 4. 测试与验证

- [ ] 4.1 添加 schema 单元测试
  - 测试 ResearchOutputSchema 验证
  - 测试 SceneSchema 验证
- [ ] 4.2 添加 workflow 单元测试
  - 测试 humanReviewStep skip 逻辑
  - 测试 suspended 状态
  - 测试 resume 逻辑
- [ ] 4.3 添加 CLI 集成测试
  - 测试 --no-review 选项
  - 测试 suspended 状态显示
  - 测试 resume 命令
- [ ] 4.4 运行完整测试套件
- [ ] 4.5 运行 typecheck 确保无类型错误
- [ ] 4.6 手动测试完整流程

## 5. 提交与推送

- [ ] 5.1 提交 schema 修复
- [ ] 5.2 提交 workflow 修复
- [ ] 5.3 提交 CLI 修复
- [ ] 5.4 提交测试
- [ ] 5.5 推送到远程仓库
