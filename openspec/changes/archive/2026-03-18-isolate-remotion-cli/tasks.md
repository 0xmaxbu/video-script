## 1. 创建独立渲染包结构

- [ ] TASK-001: 1.1 创建 `packages/renderer` 目录结构
- [ ] TASK-002: 1.2 创建 `packages/renderer/package.json`，包含独立依赖（zod v3, Remotion 等）
- [ ] TASK-003: 1.3 创建 TypeScript 配置 `packages/renderer/tsconfig.json`

## 2. 迁移渲染功能代码

- [ ] TASK-004: 2.1 迁移 `src/utils/index.ts` 中的 `renderVideo` 函数到 `packages/renderer/src/`
- [ ] TASK-005: 2.2 迁移 `src/utils/srt-generator.ts` 到 `packages/renderer/src/`
- [ ] TASK-006: 2.3 迁移 `src/remotion/` 组件到 `packages/renderer/src/`
- [ ] TASK-007: 2.4 创建 `packages/renderer/src/index.ts` 导出 API

## 3. 创建独立 CLI 入口

- [ ] TASK-008: 3.1 创建 `packages/renderer/src/cli.ts` 命令行入口
- [ ] TASK-009: 3.2 实现 `render` 子命令，接受 JSON 输入
- [ ] TASK-010: 3.3 实现进度输出和结果返回
- [ ] TASK-011: 3.4 配置 `packages/renderer/package.json` 的 bin 字段

## 4. 创建进程管理模块

- [ ] TASK-012: 4.1 在主项目创建 `src/utils/process-manager.ts`
- [ ] TASK-013: 4.2 实现 `spawnRenderer` 函数调用子进程
- [ ] TASK-014: 4.3 实现进度解析和显示
- [ ] TASK-015: 4.4 实现错误处理和结果解析

## 5. 修改主 CLI 集成

- [ ] TASK-016: 5.1 修改 `src/cli/index.ts` 中的 compose 命令
- [ ] TASK-017: 5.2 移除对 `@remotion/studio` 的依赖
- [ ] TASK-018: 5.3 添加对 `process-manager` 的调用

## 6. 测试和验证

- [ ] TASK-019: 6.1 安装独立渲染包
- [ ] TASK-020: 6.2 测试独立 CLI 命令
- [ ] TASK-021: 6.3 测试主 CLI compose 命令
- [ ] TASK-022: 6.4 运行 E2E 测试验证完整流程

## 7. 清理和文档

- [ ] TASK-023: 7.1 移除主项目中不再需要的 Remotion 依赖
- [ ] TASK-024: 7.2 更新 README 文档说明新架构
- [ ] TASK-025: 7.3 更新 package.json 移除冲突的依赖
