## ADDED Requirements

### Requirement: 网页抓取
WebFetch Tool SHALL 能够抓取网页内容。

#### Scenario: 基本抓取
- **WHEN** Tool 接收有效的 URL
- **THEN** Tool 返回页面的 Markdown 格式内容

#### Scenario: 处理超时
- **WHEN** 抓取超过 30 秒时
- **THEN** Tool 返回超时错误

#### Scenario: 处理无效 URL
- **WHEN** Tool 接收无效格式的 URL
- **THEN** Tool 返回参数验证错误

### Requirement: 内容处理
WebFetch Tool SHALL 处理抓取的内容。

#### Scenario: 提取正文
- **WHEN** Tool 抓取页面时
- **THEN** Tool 自动提取正文内容，过滤广告和导航

#### Scenario: 保留代码块
- **WHEN** 页面包含代码块时
- **THEN** Tool 保留代码块内容并标记语言

### Requirement: 错误处理
WebFetch Tool SHALL 妥善处理错误情况。

#### Scenario: 页面不存在
- **WHEN** 目标页面返回 404
- **THEN** Tool 返回 "PAGE_NOT_FOUND" 错误

#### Scenario: 服务器错误
- **WHEN** 目标服务器返回 5xx 错误
- **THEN** Tool 返回 "SERVER_ERROR" 错误并包含状态码
