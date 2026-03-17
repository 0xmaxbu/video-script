# 修复 Workflow Step 定义 - 任务清单

## 1. 修改 Workflow 定义

- [ ] 1.1 将 `steps: [...]` 数组改为 `.then()` 链式调用
- [ ] 1.2 在链式调用末尾添加 `.commit()` 方法

## 2. 验证修复

- [ ] 2.1 运行 `npm run build` 确保 TypeScript 编译通过
- [ ] 2.2 运行 `npm test` 确保所有测试通过
- [ ] 2.3 验证 workflow.steps 包含 6 个步骤

## 3. 提交代码

- [ ] 3.1 提交更改到 Git
- [ ] 3.2 推送到远程仓库
