# Spec: Multi-JSON Script Parser - 多 JSON 解析器

## 功能定义

```typescript
interface JSONParseResult {
  success: boolean;
  data?: ScriptOutput;
  error?: string;
  candidatesTried: number;
  bestScore: number;
}

function parseScriptFromLLMOutput(textContent: string): JSONParseResult;
```

## 算法步骤

### 步骤 1: 代码块分割

````typescript
const blocks = textContent.split(/```json\s*/).slice(1);
````

### 步骤 2: 逐块提取

对每个代码块：

1. 取第一个 ``` 之前的内容
2. 去除首尾空白

### 步骤 3: JSON 候选提取

对每个清理后的代码块：

1. **优先尝试直接解析** `JSON.parse()`
2. **失败时使用括号计数法**：
   - 遍历字符串，统计 `{` 和 `}`
   - 当计数归零时截取子串
   - 处理截断的 JSON

### 步骤 4: 评分机制

```typescript
function scoreCandidate(obj: object): number {
  let score = 0;
  if (obj.title) score += 10;
  if (obj.totalDuration) score += 5;
  if (Array.isArray(obj.scenes)) {
    score += obj.scenes.length * 100;
  }
  return score;
}
```

### 步骤 5: 验证

通过 `ScriptOutputSchema.parse()` 验证结构。

## 测试用例

| 输入                   | 期望结果       |
| ---------------------- | -------------- |
| 单个完整 JSON          | 解析成功       |
| 多个完整 JSON          | 选择评分最高者 |
| 一个完整、一个截断     | 解析完整者     |
| 全部截断（括号平衡）   | 提取后解析     |
| 全部截断（括号不平衡） | 返回错误       |
| 无 JSON 标记           | 返回错误       |

## 文件位置

`src/utils/json-parser.ts`
