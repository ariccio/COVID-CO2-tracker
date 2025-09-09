#!/usr/bin/env npx ts-node
/**
 * Emoji Usage Checker for Code and Documentation
 * 
 * Monitors emoji usage in code and documentation files to enforce visual attention guidelines.
 * Allows approved Unicode symbols while flagging potentially distracting emojis.
 * 
 * Based on the Swift implementation from DeeDee-Prototype, adapted for TypeScript.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as readline from 'readline';

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const execAsync = promisify(exec);

// Try to import picocolors if available, otherwise provide fallback
let colors: any;
try {
  colors = require('picocolors');
} catch {
  // Fallback if picocolors not available
  colors = {
    red: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
    reset: (s: string) => s,
  };
}

// Command-line arguments interface
interface Arguments {
  files: string[];
  threshold: number;
  staged: boolean;
  types: string;
  help: boolean;
  verbose: boolean;
  warningOnly: boolean;
}

// Analysis result for a single file
interface EmojiAnalysisResult {
  filepath: string;
  count: number;
  emojis: string[];
  locations: Array<{
    line: number;
    column: number;
    emoji: string;
    context: string;
  }>;
}

// Unicode ranges for comprehensive emoji detection
const EMOJI_RANGES: Array<[number, number]> = [
  [0x1F600, 0x1F64F], // Emoticons
  [0x1F300, 0x1F5FF], // Symbols & Pictographs
  [0x1F680, 0x1F6FF], // Transport & Map
  [0x1F1E0, 0x1F1FF], // Flags
  [0x2702, 0x27B0],   // Dingbats
  [0x24C2, 0x1F251],  // Enclosed characters
  [0x1F900, 0x1F9FF], // Supplemental symbols
  [0x1F018, 0x1F0FF], // Playing cards
  [0x2600, 0x26FF],   // Miscellaneous symbols
];

// Allowed Unicode symbols from copilot-instructions.md
const ALLOWED_SYMBOLS = new Set([
  '✓', '✗', '→', '←', '↑', '↓', '⚠', 'ℹ', 
  '★', '☆', '◆', '◇', '●', '○', '※', '•', 
  '▪', '▫', '■', '□', '▶', '▷', '◀', '◁', 
  '⟳', '⟲', '✔', '✖', '➔', '➜', '➞', '➟'
]);

// Instruction files that document emoji usage
const INSTRUCTION_FILES = [
  'copilot-instructions.md',
  'ai-instructions.md',
  'CLAUDE.md',
  'copilot-ios-development-instructions.md'
];

function parseArguments(): Arguments {
  const args: Arguments = {
    files: [],
    threshold: 3,
    staged: false,
    types: 'all',
    help: false,
    verbose: false,
    warningOnly: false,
  };

  const argv = process.argv.slice(2);
  let skipNext = false;

  for (let i = 0; i < argv.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    const arg = argv[i];
    switch (arg) {
      case '--threshold':
        if (i + 1 < argv.length) {
          args.threshold = parseInt(argv[i + 1], 10) || 3;
          skipNext = true;
        }
        break;
      case '--staged':
        args.staged = true;
        break;
      case '--types':
        if (i + 1 < argv.length) {
          args.types = argv[i + 1];
          skipNext = true;
        }
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--warning-only':
        args.warningOnly = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (!arg.startsWith('--')) {
          args.files.push(arg);
        }
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`
Usage: check-emoji-usage.ts [OPTIONS] [FILES...]

Monitor emoji usage in code and documentation files to enforce visual attention guidelines

Options:
    --threshold N     Warning threshold for emoji count (default: 3)
    --staged         Check staged files only (git)
    --types TYPE     File types to check: rb, ts, js, sh, md, yml, json, all (default: all)
    --verbose, -v    Show detailed output
    --warning-only   Exit with 0 even if threshold exceeded (for non-blocking hooks)
    --help, -h       Show this help message

Examples:
    npx ts-node scripts/check-emoji-usage.ts file.rb
    npx ts-node scripts/check-emoji-usage.ts --staged --threshold 5
    npx ts-node scripts/check-emoji-usage.ts --types rb app/**/*.rb
  `);
}

function getAllowedExtensions(types: string): string[] {
  switch (types.toLowerCase()) {
    case 'rb':
      return ['.rb'];
    case 'ts':
      return ['.ts'];
    case 'js':
      return ['.js'];
    case 'sh':
      return ['.sh'];
    case 'md':
      return ['.md'];
    case 'yml':
    case 'yaml':
      return ['.yml', '.yaml'];
    case 'json':
      return ['.json'];
    case 'all':
      return ['.rb', '.ts', '.js', '.sh', '.md', '.yml', '.yaml', '.json'];
    default:
      return ['.rb', '.ts', '.js', '.sh', '.md', '.yml', '.yaml', '.json'];
  }
}

async function getStagedFiles(types: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync('git diff --cached --name-only --diff-filter=ACM');
    const allowedExtensions = getAllowedExtensions(types);
    
    return stdout
      .split('\n')
      .filter(filename => {
        if (!filename) return false;
        return allowedExtensions.some(ext => filename.endsWith(ext));
      });
  } catch (error) {
    console.error(colors.red('Error getting staged files:'), error);
    return [];
  }
}

function isEmojiDocumentationLine(line: string): boolean {
  // Pattern for emoji replacement documentation (e.g., "`📝` → `※`")
  const replacementPattern = /`[^`]+`\s*[→←↔]\s*`[^`]+`/;
  if (replacementPattern.test(line)) {
    return true;
  }

  // Lines listing alternative symbols
  if (line.includes('✓ ✗ → ← ↑ ↓ ⚠') || 
      line.includes('※ • ▪ ▫ ■ □ ▶')) {
    return true;
  }

  // Lines talking about emojis
  const emojiDiscussionPatterns = [
    'emoji',
    'emoticon',
    'unicode symbol',
    'textual representation',
    'visual noise',
    'alternative symbol'
  ];

  const lowercasedLine = line.toLowerCase();
  return emojiDiscussionPatterns.some(pattern => lowercasedLine.includes(pattern));
}

function filterInstructionFileContent(content: string): string {
  const lines = content.split('\n');
  const filteredLines: string[] = [];
  let inEmojiSection = false;
  let inCodeBlock = false;

  for (const line of lines) {
    // Toggle code block state
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      filteredLines.push(' '.repeat(line.length));
      continue;
    }

    // Replace lines in code blocks
    if (inCodeBlock) {
      filteredLines.push(' '.repeat(line.length));
      continue;
    }

    // Detect emoji documentation sections
    if (line.toLowerCase().includes('emoji replacement') ||
        line.toLowerCase().includes('emoji usage') ||
        line.toLowerCase().includes('textual representation')) {
      inEmojiSection = true;
      filteredLines.push(' '.repeat(line.length));
      continue;
    }

    // End of emoji section (usually at next heading)
    if (inEmojiSection && 
        (line.startsWith('#') || line.startsWith('##')) &&
        !line.toLowerCase().includes('emoji')) {
      inEmojiSection = false;
    }

    // Replace lines in emoji documentation sections
    if (inEmojiSection) {
      filteredLines.push(' '.repeat(line.length));
      continue;
    }

    // Replace lines that document emoji replacements
    if (isEmojiDocumentationLine(line)) {
      filteredLines.push(' '.repeat(line.length));
      continue;
    }

    filteredLines.push(line);
  }

  return filteredLines.join('\n');
}

function filterMarkdownContent(content: string, filepath: string): string {
  // Check if it's an instruction file
  const filename = path.basename(filepath);
  if (INSTRUCTION_FILES.includes(filename)) {
    return filterInstructionFileContent(content);
  }

  const lines = content.split('\n');
  const filteredLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Toggle code block state
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      // Add empty line to maintain line numbers
      filteredLines.push('');
      continue;
    }

    // Replace content in code blocks with spaces to maintain positions
    if (inCodeBlock) {
      // Replace with spaces to maintain character positions
      filteredLines.push(' '.repeat(line.length));
      continue;
    }

    // Skip lines that are clearly documenting emoji replacements
    if (isEmojiDocumentationLine(line)) {
      // Replace with spaces to maintain character positions
      filteredLines.push(' '.repeat(line.length));
      continue;
    }

    filteredLines.push(line);
  }

  return filteredLines.join('\n');
}

function detectEmojis(text: string): Array<{emoji: string, index: number}> {
  const emojis: Array<{emoji: string, index: number}> = [];
  let index = 0;

  for (const char of text) {
    // Skip if it's an allowed symbol
    if (ALLOWED_SYMBOLS.has(char)) {
      index++;
      continue;
    }

    const codePoint = char.codePointAt(0);
    if (codePoint) {
      // Check if it's in emoji ranges
      const isEmoji = EMOJI_RANGES.some(([start, end]) => 
        codePoint >= start && codePoint <= end
      );
      
      if (isEmoji) {
        emojis.push({ emoji: char, index });
      }
    }
    index++;
  }

  return emojis;
}

async function analyzeFile(filepath: string, verbose: boolean): Promise<EmojiAnalysisResult | null> {
  try {
    const content = await readFile(filepath, 'utf8');
    
    // Determine file type and apply appropriate filtering
    let filteredContent: string;
    if (filepath.endsWith('.md')) {
      filteredContent = filterMarkdownContent(content, filepath);
    } else {
      filteredContent = content;
    }

    const detectedEmojis = detectEmojis(filteredContent);
    
    if (detectedEmojis.length === 0) {
      return null;
    }

    // Find line and column positions for each emoji
    const locations: EmojiAnalysisResult['locations'] = [];
    const lines = content.split('\n');
    
    // Create a map of filtered emoji positions to track which were kept
    const filteredEmojiPositions = new Set(detectedEmojis.map(e => e.index));
    
    for (const { emoji, index } of detectedEmojis) {
      let currentIndex = 0;
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const lineEndIndex = currentIndex + line.length;
        
        if (index >= currentIndex && index <= lineEndIndex) {
          const column = index - currentIndex;
          const context = line.trim().substring(0, 50);
          locations.push({
            line: lineNum + 1,
            column: column + 1,
            emoji,
            context
          });
          break;
        }
        currentIndex = lineEndIndex + 1; // +1 for newline
      }
    }

    return {
      filepath,
      count: detectedEmojis.length,
      emojis: detectedEmojis.map(e => e.emoji),
      locations
    };
  } catch (error: any) {
    if (verbose) {
      if (error.code === 'ENOENT') {
        console.error(colors.red(`Error: File not found: ${filepath}`));
      } else if (error.code === 'EACCES') {
        console.error(colors.red(`Error: Permission denied reading file: ${filepath}`));
      } else {
        console.error(colors.red(`Error reading file '${filepath}':`), error.message);
      }
    }
    return null;
  }
}

async function main(): Promise<void> {
  const args = parseArguments();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  let filesToCheck = args.files;
  
  if (args.staged) {
    filesToCheck = await getStagedFiles(args.types);
  }

  if (filesToCheck.length === 0) {
    if (args.staged) {
      if (args.verbose) {
        console.log(colors.gray('No staged files to check'));
      }
      process.exit(0);
    } else {
      console.error(colors.red('No files specified'));
      process.exit(1);
    }
  }

  const results: EmojiAnalysisResult[] = [];
  
  for (const filepath of filesToCheck) {
    const result = await analyzeFile(filepath, args.verbose);
    if (result) {
      results.push(result);
    }
  }

  const totalEmojis = results.reduce((sum, r) => sum + r.count, 0);
  const filesWithEmojis = results.filter(r => r.count > 0);

  if (totalEmojis === 0) {
    console.log(colors.green('✓ No problematic emojis found in analyzed files'));
    process.exit(0);
  }

  // Report findings
  console.log(`Total emojis found: ${colors.yellow(totalEmojis.toString())}`);
  console.log(`Files containing emojis: ${colors.yellow(filesWithEmojis.length.toString())}`);
  console.log();

  for (const result of filesWithEmojis) {
    console.log(`${colors.blue(result.filepath)}: ${colors.yellow(result.count.toString())} emoji${result.count > 1 ? 's' : ''}`);
    
    if (args.verbose) {
      for (const loc of result.locations) {
        console.log(colors.gray(`  Line ${loc.line}, Col ${loc.column}: "${loc.context}" (${loc.emoji})`));
      }
    } else {
      console.log(colors.gray(`  Emojis found: ${result.emojis.join(' ')}`));
    }
  }

  if (totalEmojis > args.threshold) {
    console.log();
    console.log(colors.yellow(`⚠ WARNING: Total emoji count (${totalEmojis}) exceeds threshold (${args.threshold})`));
    console.log(colors.gray('Consider reducing emoji usage to avoid diluting user attention.'));
    console.log();
    console.log(colors.gray('• Tip: Consider using alternative Unicode symbols that are less visually distracting:'));
    console.log(colors.gray('  ✓ ✗ → ← ↑ ↓ ⚠ ℹ ★ ☆ ◆ ◇ ● ○ ※ • ▪ ▫ ■ □ ▶ ▷ ◀ ◁ ⟳ ⟲ ✔ ✖ ➔ ➜ ➞ ➟'));
    console.log();
    console.log(colors.gray('This check can be bypassed with: git commit --no-verify'));
    
    if (!args.warningOnly) {
      process.exit(1);
    }
  }

  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error(colors.red('Unexpected error:'), error);
  process.exit(1);
});