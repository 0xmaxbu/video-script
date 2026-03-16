## ADDED Requirements

### Requirement: CLI create 命令
CLI SHALL 支持 create 命令，用于创建新的视频项目。

#### Scenario: 基本使用
- **WHEN** 用户运行 `video-script create "视频标题"`
- **THEN** 系统启动交互式输入流程，提示用户输入参考资料

#### Scenario: 带链接参数
- **WHEN** 用户运行 `video-script create "视频标题" --links "url1,url2"`
- **THEN** 系统使用提供的链接作为参考资料，跳过链接输入步骤

#### Scenario: 带文档参数
- **WHEN** 用户运行 `video-script create "视频标题" --doc ./notes.md`
- **THEN** 系统读取本地文档文件作为参考资料

### Requirement: CLI config 命令
CLI SHALL 支持 config 命令，用于查看和修改配置。

#### Scenario: 查看配置
- **WHEN** 用户运行 `video-script config`
- **THEN** 系统显示当前配置（不包含敏感信息）

#### Scenario: 交互式输入标题
- **WHEN** 启动 create 命令且未提供标题参数
- **THEN** 系统提示用户输入视频标题（必填）

#### Scenario: 交互式输入链接
- **WHEN** 启动 create 命令时选择输入链接方式
- **THEN** 系统提示用户输入一个或多个链接，用逗号分隔

#### Scenario: 交互式输入文档
- **WHEN** 启动 create 命令时选择粘贴文档方式
- **THEN** 系统提示用户粘贴文档内容，输入 END 结束输入

#### Scenario: 脚本审核节点
- **WHEN** 脚本生成完成后
- **THEN** 系统逐场景显示脚本内容，允许用户：查看下一场景、编辑当前场景、重新生成、一键通过全部

### Requirement: 命令行参数支持
CLI SHALL 支持以下可选参数：

#### Scenario: 画幅参数
- **WHEN** 用户提供 `--aspect-ratio 9:16` 参数
- **THEN** 系统生成 9:16 竖版视频（默认 16:9）

#### Scenario: 自动审核参数
- **WHEN** 用户提供 `--no-review` 参数
- **THEN** 系统跳过所有审核节点，全自动执行

#### Scenario: 输出目录参数
- **WHEN** 用户提供 `--output ./my-videos` 参数
- **THEN** 系统将输出文件保存到指定目录
