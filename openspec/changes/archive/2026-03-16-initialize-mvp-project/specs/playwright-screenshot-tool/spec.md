## ADDED Requirements

### Requirement: Playwright 截图
PlaywrightScreenshot Tool SHALL 能够使用 Playwright 截取网页截图。

#### Scenario: 全页截图
- **WHEN** Tool 接收 url 和 viewport 参数，无 selector
- **THEN** Tool 截取整个页面的截图

#### Scenario: 元素截图
- **WHEN** Tool 接收包含 selector 的参数
- **THEN** Tool 截取匹配选择器的元素的截图

#### Scenario: 视口截图
- **WHEN** 参数 type 为 viewport
- **THEN** Tool 截取当前视口范围的截图

### Requirement: 截图配置
PlaywrightScreenshot Tool SHALL 支持可配置的截图参数。

#### Scenario: 自定义视口
- **WHEN** Tool 接收自定义 viewport 参数
- **THEN** Tool 使用指定的宽度和高度创建视口

#### Scenario: 等待元素加载
- **WHEN** 参数包含 waitForSelector
- **THEN** Tool 等待元素出现后再截图

### Requirement: 输出
PlaywrightScreenshot Tool SHALL 输出符合规范的结果。

#### Scenario: 返回图片路径
- **WHEN** 截图完成时
- **THEN** Tool 返回 imagePath 字段，指向保存的 PNG 文件

#### Scenario: 处理错误
- **WHEN** 截图失败时
- **THEN** Tool 返回错误信息，包含失败原因
