## 1. 帮助文本实现

- [x] 1.1 创建 `src/cli/help-text.ts` 文件，包含项目帮助信息
- [x] 1.2 定义 HelpText 接口类型

## 2. CLI 集成

- [x] 2.1 在 `src/cli/index.ts` 中导入帮助文本
- [x] 2.2 配置 Commander.js 的 `.help()` 方法使用自定义帮助文本
- [x] 2.3 添加 `video-script help` 命令处理

## 3. 测试验证

- [x] 3.1 运行 `video-script help` 验证输出
- [x] 3.2 运行 `video-script create --help` 验证命令级帮助
- [x] 3.3 运行 TypeScript 类型检查
