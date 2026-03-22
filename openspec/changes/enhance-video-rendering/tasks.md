## 1. 图片渲染验证准备

- [ ] 1.1 创建 Remotion 测试项目用于截图验证
- [ ] 1.2 安装 @remotion/transitions 包（锁定版本）
- [ ] 1.3 创建 Playwright 截图验证脚本

## 2. 修复 Scene.tsx visualLayers 渲染

- [ ] 2.1 确认 Scene.tsx 中 visualLayers.map() 调用正确传递 imagePath
- [ ] 2.2 确认所有 VisualLayerRenderer 调用都传入 imagePath 参数
- [ ] 2.3 使用 Playwright CLI 截图验证 screenshot 层是否渲染

## 3. 增强 ScreenshotLayer 动画系统

- [ ] 3.1 实现 exit 动画（fadeOut、slideOut、zoomOut）
- [ ] 3.2 实现 exitAt 时机控制
- [ ] 3.3 增加动画时长从 15 帧到 30 帧（1 秒）
- [ ] 3.4 使用 Playwright CLI 截图验证 enter 动画（frame=0）和 exit 动画（frame=场景结束前）

## 4. 实现 spring() 弹性动画

- [ ] 4.1 在 ScreenshotLayer 中导入 spring 函数
- [ ] 4.2 为 slideUp/slideDown 添加 spring 动画替代
- [ ] 4.3 为 zoomIn 添加 spring 动画替代
- [ ] 4.4 验证 spring 动画效果

## 5. 实现 TransitionSeries 转场

- [ ] 5.1 在 Composition.tsx 中导入 TransitionSeries
- [ ] 5.2 将 Sequence 替换为 TransitionSeries.Sequence
- [ ] 5.3 为每个场景添加 TransitionSeries.Transition
- [ ] 5.4 实现 fade 转场效果
- [ ] 5.5 实现 slide 转场效果
- [ ] 5.6 使用 Playwright CLI 截图验证转场效果（截取场景切换时刻）

## 6. 更新 Script Agent

- [ ] 6.1 更新 script-agent.ts 生成 transition 字段
- [ ] 6.2 更新 prompt 生成更详细的 animation 配置
- [ ] 6.3 验证生成的 script.json 包含正确的 transition 配置

## 7. 端到端验证

- [ ] 7.1 运行完整视频生成流程
- [ ] 7.2 使用 Playwright CLI 截取多个关键帧验证视觉效果
- [ ] 7.3 确认所有 visualLayers 正确渲染
- [ ] 7.4 确认 enter/exit 动画正常工作
- [ ] 7.5 确认转场效果正常工作
