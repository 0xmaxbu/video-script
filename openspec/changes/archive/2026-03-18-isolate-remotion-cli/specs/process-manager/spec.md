## ADDED Requirements

### Requirement: 子进程调用管理

主 CLI SHALL 通过子进程调用独立渲染 CLI：

#### Scenario: 渲染任务调用

- **WHEN** 主 CLI 执行 `compose` 命令时
- **THEN** 使用 `child_process.spawn` 调用 `video-script-render` 子进程

#### Scenario: 进度同步

- **WHEN** 子进程输出进度信息时
- **THEN** 主 CLI 实时显示进度，更新 spinner 文本

### Requirement: 错误处理和结果解析

主 CLI SHALL 正确解析子进程的输出：

#### Scenario: 成功结果解析

- **WHEN** 子进程以退出码 0 结束时
- **THEN** 主 CLI 解析 JSON 输出，提取 videoPath 和 duration

#### Scenario: 错误结果解析

- **WHEN** 子进程以非零退出码结束时
- **THEN** 主 CLI 解析错误信息，显示友好错误提示

### Requirement: 进程生命周期管理

渲染进程 SHALL 有完善的生命周期管理：

#### Scenario: 优雅关闭

- **WHEN** 用户发送中断信号（Ctrl+C）时
- **THEN** 主 CLI 向子进程发送终止信号，等待进程退出

#### Scenario: 超时处理

- **WHEN** 渲染超过预设超时时间时
- **THEN** 主 CLI 终止子进程，显示超时错误

#### Scenario: 进程异常崩溃

- **WHEN** 子进程异常退出（非正常退出码，如崩溃、OOM）
- **THEN** 主 CLI 捕获退出信号，显示错误信息并返回失败状态
