import inquirer from 'inquirer';
import { z } from 'zod';
import { ResearchInputSchema, ResearchInput } from '../types/index.js';

/**
 * Prompts user for interactive input when creating a new video project
 * @param initialTitle - Optional title if provided via CLI argument
 * @returns Validated ResearchInput object
 */
export async function promptForInput(
  initialTitle?: string
): Promise<ResearchInput> {
  // If title is already provided, skip title prompt
  const title = initialTitle || await promptForTitle();

  // Determine the source of reference material
  const sourceType = await promptForSourceType();

  let links: string[] | undefined;
  let document: string | undefined;

  if (sourceType === 'links') {
    links = await promptForLinks();
  } else if (sourceType === 'document') {
    document = await promptForDocument();
  }
  // 'none' case: both links and document remain undefined

  // Validate the collected input
  const input = {
    title,
    links,
    document,
  };

  return ResearchInputSchema.parse(input);
}

/**
 * Prompts user to enter the video title
 */
async function promptForTitle(): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Enter the video title:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Title cannot be empty';
        }
        return true;
      },
      filter: (input: string) => input.trim(),
    },
  ]);

  return answer.title;
}

/**
 * Prompts user to select the source of reference material
 */
async function promptForSourceType(): Promise<'links' | 'document' | 'none'> {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'sourceType',
      message: 'How would you like to provide reference material?',
      choices: [
        { name: 'Add reference links', value: 'links' },
        { name: 'Paste document content', value: 'document' },
        { name: 'No reference material', value: 'none' },
      ],
      default: 'none',
    },
  ]);

  return answer.sourceType;
}

/**
 * Prompts user to enter reference links
 */
async function promptForLinks(): Promise<string[]> {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'links',
      message: 'Enter reference links (comma-separated, e.g., https://example.com, https://docs.example.com):',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'At least one link is required';
        }
        const urls = input.split(',').map(url => url.trim());
        try {
          urls.forEach(url => {
            z.string().url().parse(url);
          });
          return true;
        } catch {
          return 'One or more URLs are invalid. Please check your input.';
        }
      },
      filter: (input: string) => {
        return input
          .split(',')
          .map(url => url.trim())
          .filter(url => url.length > 0);
      },
    },
  ]);

  return answer.links;
}

/**
 * Prompts user to paste document content
 * User enters multiple lines and finishes with 'END'
 */
async function promptForDocument(): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: 'editor',
      name: 'document',
      message: 'Paste your document content (your default editor will open):',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Document content cannot be empty';
        }
        return true;
      },
      postfix: '.md',
    },
  ]);

  return answer.document.trim();
}
