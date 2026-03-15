import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

function htmlToMarkdown(html: string): string {
  const removeScriptsAndStyles = (content: string) =>
    content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  const convertTagsToMarkdown = (content: string) =>
    content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '');

  const decodeHtmlEntities = (content: string) =>
    content
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

  const normalizeWhitespace = (content: string) =>
    content.replace(/\n\n+/g, '\n\n').replace(/[ \t]+/g, ' ').trim();

  return normalizeWhitespace(
    decodeHtmlEntities(convertTagsToMarkdown(removeScriptsAndStyles(html)))
  );
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }

  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return h1Match[1].replace(/<[^>]*>/g, '').trim();
  }

  return 'Untitled';
}

export const webFetchTool = createTool({
  id: 'web-fetch',
  description: 'Fetch and extract content from a web page, converting HTML to Markdown format',
  inputSchema: z.object({
    url: z.string().url('Invalid URL format'),
  }),
  outputSchema: z.object({
    content: z.string().describe('Page content in Markdown format'),
    title: z.string().describe('Page title'),
    url: z.string().describe('Final URL after redirects'),
  }),
  execute: async ({ url }) => {
    const controller = new AbortController();
    const TIMEOUT_MS = 30000;
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.status === 404) {
        throw new Error('PAGE_NOT_FOUND');
      }

      if (response.status >= 500) {
        throw new Error('SERVER_ERROR');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const title = extractTitle(html);
      const content = htmlToMarkdown(html);

      return {
        content,
        title,
        url: response.url,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'PAGE_NOT_FOUND') {
          throw new Error('PAGE_NOT_FOUND: The requested page was not found (404)');
        }
        if (error.message === 'SERVER_ERROR') {
          throw new Error('SERVER_ERROR: The server returned a 5xx error');
        }
        if (error.name === 'AbortError') {
          throw new Error('TIMEOUT: Request exceeded 30 second timeout');
        }
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
      throw new Error('Failed to fetch URL: Unknown error');
    } finally {
      clearTimeout(timeoutId);
    }
  },
});
