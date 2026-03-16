## ADDED Requirements

### Requirement: Remotion 项目生成
合成 Agent SHALL 能够根据脚本生成 Remotion 项目。

#### Scenario: 创建项目结构
- **WHEN** Agent 接收脚本和截图后
- **THEN** Agent 在临时目录创建 Remotion 项目结构

#### Scenario: 生成组件文件
- **WHEN** Agent 生成 Remotion 项目时
- **THEN** Agent 为每个场景类型生成对应的 React 组件

#### Scenario: 处理代码动画
- **WHEN** 场景包含代码动画时
- **THEN** Agent 使用 CodeAnimation 组件渲染带动画效果的代码

### Requirement: 视频渲染
合成 Agent SHALL 能够渲染最终视频。

#### Scenario: 触发渲染
- **WHEN** Agent 完成项目生成后
- **THEN** Agent 调用 Remotion CLI 执行渲染

#### Scenario: 渲染进度
- **WHEN** 渲染进行中时
- **THEN** Agent 显示渲染进度百分比

#### Scenario: 渲染输出
- **WHEN** 渲染完成时
- **THEN** Agent 输出 MP4 格式的视频文件

### Requirement: 字幕生成
合成 Agent SHALL 能够生成字幕文件。

#### Scenario: SRT 字幕
- **WHEN** Agent 完成视频渲染后
- **THEN** Agent 根据脚本的旁白和时间轴生成 SRT 格式字幕文件

#### Scenario: 字幕时间戳
- **WHEN** Agent 生成字幕时
- **THEN** 每个字幕条目包含开始时间、结束时间和对应的旁白内容

### Requirement: 临时文件清理
合成 Agent SHALL 管理临时文件。

#### Scenario: 清理临时项目
- **WHEN** 视频渲染完成后
- **THEN** Agent 清理 Remotion 临时项目目录

#### Scenario: 保留输出文件
- **WHEN** 清理临时文件时
- **THEN** Agent 保留最终输出的视频和字幕文件

### Requirement: 视频审核交互
合成 Agent SHALL 支持视频审核节点。

#### Scenario: 视频预览
- **WHEN** 审核节点激活时
- **THEN** 系统调用系统默认播放器预览生成的视频

#### Scenario: 接受输出
- **WHEN** 用户选择接受视频时
- **THEN** 系统将视频移动到最终输出目录

#### Scenario: 重新渲染
- **WHEN** 用户选择调整设置重渲染时
- **THEN** Agent 使用新设置重新生成和渲染视频
