## ADDED Requirements

### Requirement: 网页截图
截图 Agent SHALL 能够截取网页页面。

#### Scenario: 全页截图
- **WHEN** Agent 接收类型为 fullpage 的截图任务
- **THEN** Agent 截取整个页面的截图

#### Scenario: 视口截图
- **WHEN** Agent 接收类型为 viewport 的截图任务
- **THEN** Agent 截取当前视口范围的截图

#### Scenario: 元素截图
- **WHEN** Agent 接收包含 selector 的截图任务
- **THEN** Agent 截取匹配选择器的元素的截图

### Requirement: 代码截图
截图 Agent SHALL 能够生成代码高亮截图。

#### Scenario: 代码高亮截图
- **WHEN** Agent 接收包含 code 字段的截图任务
- **THEN** Agent 使用 CodeHighlight Tool 生成语法高亮后的代码截图

#### Scenario: 指定高亮行
- **WHEN** Agent 接收包含 highlightLines 的代码截图任务
- **THEN** Agent 在生成的截图中高亮指定的行号

### Requirement: 截图输出
截图 Agent SHALL 输出符合规范的截图结果。

#### Scenario: 输出图片路径
- **WHEN** Agent 完成截图任务后
- **THEN** 输出包含 imagePath 字段，指向保存的 PNG 文件

#### Scenario: 处理截图失败
- **WHEN** Agent 遇到截图失败时
- **THEN** Agent 记录错误并尝试重试（最多 3 次）

### Requirement: GitHub 页面处理
截图 Agent SHALL 能够处理 GitHub 页面。

#### Scenario: GitHub README 截图
- **WHEN** Agent 收到 GitHub 仓库的 README URL
- **THEN** Agent 截取 README 的完整内容

#### Scenario: GitHub 代码文件截图
- **WHEN** Agent 收到 GitHub 代码文件 URL
- **THEN** Agent 使用 CodeHighlight Tool 生成带行号的高亮截图
