export interface ValidationResult {
  valid: boolean;
  failures: Array<{ name: string; reason: string }>;
}

export function validateFetchedContent(
  content: string,
  url: string
): ValidationResult {
  const failures: Array<{ name: string; reason: string }> = [];

  // 1. Word count threshold: < 500 chars = suspicious
  if (content.length < 500) {
    failures.push({
      name: 'wordCount',
      reason: `Content too short (${content.length} chars), likely extraction failure`
    });
  }

  // 2. Placeholder detection
  if (/(placeholder|example\.com|localhost)/i.test(content)) {
    failures.push({
      name: 'placeholder',
      reason: `Content contains placeholder text for URL: ${url}`
    });
  }

  // 3. HTML structure validation
  const hasParagraphs = /<p>[\s\S]*?<\/p>/.test(content);
  const hasCode = /<code>[\s\S]*?<\/code>/.test(content);
  if (!hasParagraphs && !hasCode) {
    failures.push({
      name: 'htmlStructure',
      reason: 'No <p> or <code> tags found, likely not article content'
    });
  }

  return {
    valid: failures.length === 0,
    failures
  };
}
