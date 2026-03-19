## ADDED Requirements

### Requirement: Remotion 依赖正常工作

Remotion 依赖应该能够正确解析，`@remotion/studio/renderEntry` 模块应该可以被 bundler 找到。

#### Scenario: 视频渲染成功

- **WHEN** 执行 `video-script compose <dir>` 命令
- **THEN** 视频渲染成功，生成 MP4 文件

#### Scenario: 字幕生成成功

- **WHEN** 视频渲染完成后
- **THEN** 生成 SRT 字幕文件

### Requirement: 依赖版本兼容

package.json 中的 Remotion 版本应该与其他依赖兼容。

#### Scenario: npm install 成功

- **WHEN** 执行 `npm install`
- **THEN** 所有依赖安装成功，无警告

#### Scenario: 构建成功

- **WHEN** 执行 `npm run build`
- **THEN** TypeScript 编译成功
