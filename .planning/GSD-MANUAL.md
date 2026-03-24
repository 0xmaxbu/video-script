# video-script GSD Workflow Manual

> 本手册定义了 video-script 项目的标准开发流程。所有开发工作必须遵循本手册，不得随意改变流程。

**最后更新**: 2026-03-24
**版本**: 1.0

---

## 目录

1. [核心原则](#核心原则)
2. [工作流程概览](#工作流程概览)
3. [GSD 命令参考](#gsd-命令参考)
4. [Phase 执行流程](#phase-执行流程)
5. [文件结构](#文件结构)
6. [测试策略](#测试策略)
7. [提交规范](#提交规范)
8. [质量门禁](#质量门禁)

---

## 核心原则

### GSD 哲学

**GSD (Get Shit Done)** 是一种为 solo agentic 开发优化的层级项目规划方法。

### video-script 项目约束

| 约束       | 说明                                                      |
| ---------- | --------------------------------------------------------- |
| 技术栈     | TypeScript, Mastra, Remotion, Playwright                  |
| 双进程架构 | Main CLI (zod v4) + Renderer subprocess (zod v3)          |
| 输出格式   | MP4 + SRT                                                 |
| CLI 接口   | 子命令: research → script → visual → screenshot → compose |
| LLM 提供商 | MiniMax CN Coding Plan (可配置)                           |

---

## 工作流程概览

```
┌─────────────────────────────────────────────────────────────┐
│  标准 Phase 流程                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. /gsd-plan-phase N     ← 规划阶段                          │
│         ↓                                                   │
│  2. /gsd-execute-phase N  ← 执行所有计划                       │
│         ↓                                                   │
│  3. /gsd-verify-work N    ← 用户验收测试 (UAT)                │
│         ↓                                                   │
│  4. /gsd-add-tests N      ← 生成单元和E2E测试                  │
│         ↓                                                   │
│  5. /gsd-progress         ← 检查进度并继续下一阶段               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 阶段状态流转

```
Planning → Executing → UAT Testing → Tests Added → Shipped
    ↑           ↓            ↓            ↓          ↓
  计划中      执行中      用户验收      测试生成     已发布
```

---

## GSD 命令参考

### Phase 生命周期命令

#### `/gsd-plan-phase <number>`

创建详细执行计划。

```bash
/gsd-plan-phase 1          # 为 Phase 1 创建计划
/gsd-plan-phase 2 --prd path/to/requirements.md  # 使用 PRD 创建计划
```

**产物**: `.planning/phases/XX-name/XX-YY-PLAN.md`

---

#### `/gsd-execute-phase <number>`

执行阶段中的所有计划。

```bash
/gsd-execute-phase 5        # 执行 Phase 5 的所有计划
/gsd-execute-phase 5 --interactive  # 交互式执行（每步确认）
/gsd-execute-phase 5 --gaps-only    # 仅执行 gap 修复计划
```

**流程**:

1. 发现计划并分组 waves
2. 按 wave 顺序执行（wave 内可并行）
3. 验证阶段目标
4. 更新 ROADMAP.md 和 STATE.md

---

#### `/gsd-verify-work [phase]`

通过对话进行用户验收测试。

```bash
/gsd-verify-work 3         # 验证 Phase 3
/gsd-verify-work           # 恢复现有 UAT 会话
```

**流程**:

1. 从 SUMMARY.md 提取可测试交付物
2. 逐项展示预期行为
3. 用户确认或报告问题
4. 问题自动诊断并生成修复计划

---

#### `/gsd-add-tests <phase> [extra instructions]`

为已完成的阶段生成单元和 E2E 测试。

```bash
/gsd-add-tests 14          # 为 Phase 14 生成测试
/gsd-add-tests 14 focus on edge cases  # 聚焦边界情况
```

**流程**:

1. 分析 SUMMARY.md 中的文件变更
2. 分类: TDD (单元测试) / E2E (浏览器测试) / Skip
3. 用户确认分类
4. 生成测试计划并执行
5. RED-GREEN 验证
6. 提交测试文件

---

### 项目管理命令

#### `/gsd-progress`

检查项目状态并智能路由到下一操作。

```bash
/gsd-progress
```

显示: 进度条、完成的 SUMMARY、最近工作摘要、当前状态、下一步建议

---

#### `/gsd-resume-work`

从上一个会话恢复工作。

```bash
/gsd-resume-work
```

---

#### `/gsd-pause-work`

暂停工作并创建上下文交接。

```bash
/gsd-pause-work
```

创建 `.continue-here` 文件，更新 STATE.md

---

### Phase 管理命令

#### `/gsd-discuss-phase <number>`

在规划前阐明阶段愿景。

```bash
/gsd-discuss-phase 2        # 讨论 Phase 2 的设计方向
/gsd-discuss-phase 2 --batch  # 批量提问模式
```

创建 `CONTEXT.md` 包含愿景、需求、边界

---

#### `/gsd-add-phase <description>`

在当前里程碑末尾添加新阶段。

```bash
/gsd-add-phase "添加管理员仪表盘"
```

---

#### `/gsd-insert-phase <after> <description>`

在现有阶段之间插入新阶段。

```bash
/gsd-insert-phase 7 "修复关键认证漏洞"  # 创建 Phase 7.1
```

---

### Quick 模式命令

#### `/gsd-quick [--full] [--discuss] [--research]`

快速执行小型临时任务。

```bash
/gsd-quick                   # 基本快速模式
/gsd-quick --full           # 完整质量流程
/gsd-quick --research       # 添加研究步骤
/gsd-quick --discuss --full # 组合标志
```

---

#### `/gsd-fast [description]`

执行trivial任务（无子代理、无规划文件）。

```bash
/gsd-fast "修复 README 中的拼写错误"
/gsd-fast "添加 .env 到 gitignore"
```

≤3 文件编辑，原子提交

---

### Ship 和 Review 命令

#### `/gsd-ship [phase]`

从已完成的阶段创建 PR。

```bash
/gsd-ship 4                 # 为 Phase 4 创建 PR
/gsd-ship 4 --draft        # 创建 draft PR
```

**先决条件**: 阶段已验证，`gh` CLI 已安装并认证

---

#### `/gsd-review --phase N [--gemini] [--claude] [--codex] [--all]`

跨 AI 审查 - 调用外部 AI CLI 独立审查阶段计划。

```bash
/gsd-review --phase 3 --all  # 使用所有可用 AI 审查
```

---

### 调试和诊断

#### `/gsd-debug [issue description]`

使用科学方法进行系统性调试。

```bash
/gsd-debug "登录按钮不工作"
/gsd-debug                   # 恢复活动会话
```

---

## Phase 执行流程

### 详细流程图

```
┌──────────────────────────────────────────────────────────┐
│ 1. PLAN PHASE                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ /gsd-discuss-phase N     ← 讨论阶段愿景 (可选)             │
│         ↓                                               │
│ /gsd-research-phase N   ← 领域研究 (复杂阶段可选)          │
│         ↓                                               │
│ /gsd-plan-phase N       ← 创建执行计划                    │
│                                                          │
│ 产物:                                                    │
│ - XX-YY-PLAN.md (计划文件)                               │
│ - XX-CONTEXT.md (上下文)                                 │
│ - XX-DISCUSSION-LOG.md (讨论日志)                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 2. EXECUTE PHASE                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ /gsd-execute-phase N                                     │
│                                                          │
│ ├── Wave 1: 并行执行独立计划                              │
│ ├── Wave 2: 依赖 Wave 1 的计划                            │
│ ├── ...                                                  │
│ ├── Checkpoint: 用户交互点                                │
│ └── 回归测试: 运行之前阶段的测试                          │
│                                                          │
│ 产物:                                                    │
│ - XX-YY-SUMMARY.md (每个计划的摘要)                      │
│ - XX-VERIFICATION.md (验证结果)                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 3. VERIFY WORK (UAT)                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ /gsd-verify-work N                                       │
│                                                          │
│ ├── 提取 SUMMARY 中的可测试项                             │
│ ├── 逐项展示预期行为                                      │
│ ├── 用户确认/报告问题                                     │
│ └── 问题自动诊断                                         │
│                                                          │
│ 产物: XX-UAT.md                                         │
│                                                          │
│ 如果有问题:                                               │
│ - /gsd-plan-phase N --gaps ← 创建修复计划                 │
│ - /gsd-execute-phase N --gaps-only ← 执行修复             │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 4. ADD TESTS                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ /gsd-add-tests N                                        │
│                                                          │
│ ├── 分析文件变更                                          │
│ ├── 分类: TDD / E2E / Skip                              │
│ ├── 生成测试计划                                          │
│ ├── 执行 RED-GREEN 测试                                  │
│ └── 提交测试文件                                         │
│                                                          │
│ 产物:                                                    │
│ - src/**/__tests__/*.test.ts (单元测试)                  │
│ - tests/e2e/*.test.ts (E2E 测试)                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 5. SHIP                                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ /gsd-ship N                                             │
│                                                          │
│ ├── 推送分支到远程                                        │
│ ├── 创建 PR (带自动生成内容)                             │
│ ├── 代码审查 (可选)                                       │
│ └── 更新 STATE.md                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 文件结构

```
video-script/
├── .planning/
│   ├── PROJECT.md           # 项目愿景和约束
│   ├── ROADMAP.md          # 阶段路线图
│   ├── STATE.md             # 项目状态和上下文
│   ├── REQUIREMENTS.md      # 需求追踪
│   ├── config.json          # 工作流配置
│   │
│   ├── phases/             # 阶段工作目录
│   │   └── 14-animation-engine/
│   │       ├── 14-01-PLAN.md
│   │       ├── 14-01-SUMMARY.md
│   │       ├── 14-02-PLAN.md
│   │       ├── 14-02-SUMMARY.md
│   │       ├── 14-CONTEXT.md
│   │       ├── 14-DISCUSSION-LOG.md
│   │       ├── 14-UAT.md
│   │       └── 14-VERIFICATION.md
│   │
│   ├── codebase/           # 代码库映射 (brownfield 项目)
│   │   ├── STACK.md
│   │   ├── ARCHITECTURE.md
│   │   ├── STRUCTURE.md
│   │   └── CONVENTIONS.md
│   │
│   └── research/            # 领域研究
│       ├── STACK.md
│       └── ARCHITECTURE.md
│
├── src/                     # 源代码
│   ├── cli/                 # CLI 入口
│   ├── mastra/              # Mastra Agent + Workflow + Tools
│   │   ├── agents/
│   │   ├── workflows/
│   │   └── tools/
│   ├── types/               # 类型定义
│   └── utils/               # 工具函数
│
├── packages/                # 工作空间包
│   ├── renderer/            # Remotion 渲染器
│   │   └── src/
│   │       ├── remotion/    # Remotion 组件
│   │       ├── utils/       # 渲染器工具
│   │       └── components/  # 组件
│   └── types/               # 共享类型包
│
└── tests/                   # 测试
    ├── e2e/                 # E2E 测试
    └── unit/                # 单元测试
```

---

## 测试策略

### 测试分类

| 分类     | 适用场景                                   | 测试位置              |
| -------- | ------------------------------------------ | --------------------- |
| **TDD**  | 纯函数、数据转换、解析器、验证器、工具函数 | `src/**/*.test.ts`    |
| **E2E**  | UI 交互、导航、表单、选择、模态框          | `tests/e2e/*.test.ts` |
| **Skip** | UI 布局/样式、配置、胶水代码、迁移         | 不测试                |

### 测试分类规则

**TDD (单元测试)**:

- 业务逻辑: 计算、定价、验证
- 数据转换: 映射、过滤、聚合、格式化
- 解析器: CSV、JSON、XML、自定义格式
- 验证器: 输入验证、schema 验证、业务规则
- 工具函数: 字符串操作、日期处理、数字格式化

**E2E (浏览器测试)**:

- 键盘快捷键
- 导航: 页面转换、路由、面包屑
- 表单交互: 提交、验证错误、字段焦点
- 选择: 行选择、多选、shift-click 范围
- 拖放: 重新排序、容器间移动
- 模态对话框: 打开、关闭、确认、取消
- 数据网格: 排序、过滤、内联编辑

**Skip (不测试)**:

- UI 布局/样式: CSS 类、视觉效果、响应式断点
- 配置: 配置文件、环境变量、功能开关
- 胶水代码: 依赖注入设置、中间件注册、路由表
- 迁移: 数据库迁移、schema 变更
- 简单 CRUD: 无业务逻辑的基本创建/读取/更新/删除
- 类型定义: 只有类型/接口定义

### 测试执行

```bash
# 运行所有测试
npm test

# 运行特定包的测试
npm test -- packages/renderer/src

# 运行 E2E 测试
npm test -- tests/e2e/

# 监视模式
npm run test:watch
```

### 测试覆盖率要求

- **最低覆盖率**: 80%
- Tool 函数必须有单元测试
- Agent 必须有集成测试
- 关键用户路径必须有 E2E 测试

---

## 提交规范

### 提交消息格式

```
<type>/<module>: <description>

[type]: feat | fix | refactor | docs | test | chore | perf | ci
```

### 示例

```
feat/cli: add create command with interactive input
fix/screenshot: handle playwright timeout gracefully
test/research: add unit tests for web-fetch tool
refactor/compose: extract remotion project generator
docs: update README with new CLI options
```

### 原子提交规则

1. **每个步骤一个提交** - 一个提交 = 一个明确、可独立验证的任务
2. **保持最小 diff** - 1-3 个文件，<100 行（除非是纯配置/测试）
3. **提交前运行测试** - 确保没有引入新 Bug
4. **使用 `git add -p`** - 交互选择实际修改的文件

### GSD 相关提交

```bash
# Phase 完成
git commit -m "docs(phase-14): complete phase execution"

# 测试完成
git commit -m "test(phase-14): add unit and E2E tests from add-tests command"

# UAT 完成
git commit -m "test(phase-14): complete UAT - 11 passed, 0 issues"
```

---

## 质量门禁

### 每个 Phase 的质量检查

| 阶段        | 检查项                              |
| ----------- | ----------------------------------- |
| **Plan**    | 计划文件完整，任务可执行            |
| **Execute** | 所有任务完成，代码编译通过          |
| **Verify**  | UAT 全部通过或问题已记录            |
| **Tests**   | 测试生成并通过，覆盖率达标          |
| **Ship**    | 代码审查通过，无 CRITICAL/HIGH 问题 |

### 代码审查清单

**安全 (CRITICAL)**:

- [ ] 无硬编码凭证、API 密钥、token
- [ ] 无 SQL 注入漏洞
- [ ] 无 XSS 漏洞
- [ ] 输入验证完整
- [ ] 无路径遍历风险

**代码质量 (HIGH)**:

- [ ] 函数 < 50 行
- [ ] 文件 < 800 行
- [ ] 嵌套深度 < 4 层
- [ ] 错误处理完整
- [ ] 无 console.log 语句
- [ ] 无 TODO/FIXME 注释

**最佳实践 (MEDIUM)**:

- [ ] 无可变模式 (使用不可变替代)
- [ ] 新代码有测试覆盖
- [ ] 公共 API 有 JSDoc

### 阻塞规则

以下情况 **阻止提交**:

- CRITICAL 安全问题
- HIGH 代码质量问题
- 测试失败
- 类型检查失败

---

## video-script 项目特定规范

### CLI 工作流程

```
video-script create <title>      # 创建项目 (research + script)
video-script research <title>    # 仅研究
video-script script <dir>        # 仅生成脚本
video-script visual <dir>        # 仅生成视觉计划
video-script screenshot <dir>     # 仅截取截图
video-script compose <dir>      # 仅合成视频
```

### Remotion 组件测试

Remotion 组件 (动画、转场) 需要浏览器环境验证。单元测试仅覆盖:

- 导出存在性
- 纯函数逻辑 (staggerDelay, SPRING_PRESETS 等)

### 输出路径规则

**默认输出目录**: `~/simple-videos/<Year>/<Week>-<StartMonth>_<StartDay>-<EndMonth>_<EndDay>/<slugified-title>`

---

## 快速参考

### 常用命令序列

**开始新项目**:

```bash
/gsd-new-project
/clear
/gsd-plan-phase 1
/clear
/gsd-execute-phase 1
```

**继续工作**:

```bash
/gsd-progress  # 查看状态并继续
```

**添加紧急中途工作**:

```bash
/gsd-insert-phase 5 "关键安全修复"
/gsd-plan-phase 5.1
/gsd-execute-phase 5.1
```

**完成里程碑**:

```bash
/gsd-complete-milestone 1.0.0
/clear
/gsd-new-milestone  # 下一里程碑
```

### 调试工作流

```bash
/gsd-debug "表单提交静默失败"  # 开始调试会话
# ... 调查进行中 ...
/clear
/gsd-debug  # 从中断处恢复
```

### 获取帮助

```bash
/gsd-help   # 显示完整命令参考
/gsd-update # 更新 GSD 到最新版本
```

---

## 附录: GSD 工作流模式

### 阶段验收测试 (UAT) 流程

```
SUMMARY.md → 提取可测试项 → 创建 UAT.md
                              ↓
                        逐项展示预期
                              ↓
                        用户确认/问题
                              ↓
                    问题 → 诊断 → 修复计划
```

### 测试生成流程

```
SUMMARY.md → 分析文件变更 → 分类 (TDD/E2E/Skip)
                              ↓
                        用户确认分类
                              ↓
                        生成测试计划
                              ↓
                    RED (测试失败) → GREEN (测试通过)
                              ↓
                        提交测试文件
```

### 质量门禁流程

```
Code → Lint/Type Check → Tests → Review → Ship
         ↓                ↓        ↓        ↓
       失败?           失败?    有问题?   阻塞?
         ↓                ↓        ↓        ↓
      修复              修复    修复     修复
```

---

_本手册为 video-script 项目的规范文档。所有开发流程必须遵循本文档，不得随意修改。如有流程变更需求，请先更新本手册。_
