## 1. 诊断问题

- [ ] 1.1 检查当前 Remotion 版本和依赖关系
- [ ] 1.2 搜索 Remotion 官方 GitHub issue 关于 @remotion/studio/renderEntry 的问题
- [ ] 1.3 确定问题出现的版本号

## 2. 尝试升级

- [ ] 2.1 升级到 Remotion 最新补丁版本
- [ ] 2.2 运行 npm install 重新安装依赖
- [ ] 2.3 清理旧的 .remotion-project 目录

## 3. 验证升级

- [ ] 3.1 运行 npm run build 验证构建成功
- [ ] 3.2 运行单元测试验证无回归
- [ ] 3.3 运行 E2E 测试验证 compose 命令成功生成视频

## 4. 如果升级失败则降级

- [ ] 4.1 如果 @remotion/studio/renderEntry 问题仍然存在，降级到 Remotion (当前版本 - 1)
- [ ] 4.2 运行 npm install 重新安装依赖
- [ ] 4.3 清理旧的 .remotion-project 目录

## 5. 验证降级

- [ ] 5.1 运行 npm run build 验证构建成功
- [ ] 5.2 运行单元测试验证无回归
- [ ] 5.3 运行 E2E 测试验证 compose 命令成功生成视频
