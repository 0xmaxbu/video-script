#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('video-script')
  .description('AI-powered video generation CLI tool for tech tutorials')
  .version(packageJson.version);

program
  .command('create <title>')
  .description('Create a new video project')
  .option('--links <urls>', 'Reference links (comma-separated)')
  .option('--doc <file>', 'Reference document file path')
  .option('--aspect-ratio <ratio>', 'Video aspect ratio (default: 16:9)', '16:9')
  .option('--no-review', 'Skip all review nodes and run automatically')
  .option('--output <dir>', 'Output directory')
  .action((title, options) => {
    console.log(chalk.blue(`\n📹 Creating video: ${chalk.bold(title)}`));
    console.log(chalk.yellow('TODO: implement create command logic\n'));

    if (options.links) {
      console.log(chalk.gray(`  Links: ${options.links}`));
    }
    if (options.doc) {
      console.log(chalk.gray(`  Document: ${options.doc}`));
    }
    if (options.aspectRatio !== '16:9') {
      console.log(chalk.gray(`  Aspect ratio: ${options.aspectRatio}`));
    }
    if (options.review === false) {
      console.log(chalk.gray('  Skip review: true'));
    }
    if (options.output) {
      console.log(chalk.gray(`  Output directory: ${options.output}`));
    }
  });

program
  .command('config')
  .description('View configuration')
  .action(() => {
    console.log(chalk.blue('\n⚙️  Configuration\n'));
    console.log(chalk.yellow('TODO: implement config command logic\n'));
  });

program.parse();
