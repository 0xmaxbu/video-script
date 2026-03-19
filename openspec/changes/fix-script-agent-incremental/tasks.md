# Tasks: 修复 Script Agent - 增量场景生成

## 实现顺序

### Task 1: 修复 JSON 解析器 Bug

**文件**：`src/cli/index.ts`（第 317 行）

**问题**：`bestCandidate` 被引用但未声明

**修复**：删除该引用或声明变量

**验收标准**：`npm run build` 无错误

---

### Task 2: 创建 JSON 解析器工具

**文件**：`src/utils/json-parser.ts`

**步骤**：

1. 创建 `parseScriptFromLLMOutput()` 函数
2. 实现代码块分割
3. 实现括号计数 JSON 提取
4. 实现评分系统
5. 添加全面的错误处理

**验收标准**：`npm test -- json-parser.test.ts` 通过

---

### Task 3: 添加 JSON 解析器单元测试

**文件**：`src/utils/__tests__/json-parser.test.ts`

**测试用例**：

- 单个完整 JSON
- 多个完整 JSON（选择最高分）
- 一个完整、一个截断
- 全部截断（括号平衡）
- 无 JSON 标记
- 无效 JSON 结构

**验收标准**：所有测试通过

---

### Task 4: 更新 CLI 使用新解析器

**文件**：`src/cli/index.ts`

**变更**：

1. 导入 `parseScriptFromLLMOutput` 工具
2. 用新解析器替换直接 JSON 解析
3. 处理 `JSONParseResult` 返回类型

**验收标准**：CLI 运行无错误

---

### Task 5: 更新 Script Agent 支持流式场景

**文件**：`src/mastra/agents/script-agent.ts`

**变更**：

1. 更新指令以每次调用生成一个场景
2. 添加场景级验证 prompts
3. 在 prompt 中包含动画类型约束

---

### Task 6: E2E 集成测试

**步骤**：

1. 运行 `video-script research "Unsloth..." --links "..."`
2. 运行 `video-script script <dir>`
3. 验证 script.json 有效

**验收标准**：脚本生成成功
