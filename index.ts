#!/usr/bin/env node
import clipboard from 'clipboardy';
import prettier from 'prettier';

const SUCCESS_GREEN = '\x1b[38;2;0;255;65m';
const RESET = '\x1b[0m';

const parserMap: Record<string, prettier.BuiltInParserName> = {
  javascript: 'babel',
  typescript: 'babel-ts',
  json: 'json',
  css: 'css',
  html: 'html',
  markdown: 'markdown',
  yaml: 'yaml',
};

const toLines = (input: string) => input.split(/\r?\n/);
const fromLines = (lines: string[]) => lines.join('\n');

const readStdin = async (): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};

const captureInput = async (): Promise<string> =>
  process.stdin.isTTY ? clipboard.read() : readStdin();

const stripAbsolutePaths = (input: string): string =>
  input
    .replace(/(^|[\s('"`])((?:\/(?:Users|home|var|opt|tmp|private|Volumes)\/[\w./-]+))/g, '$1./...')
    .replace(/(^|[\s('"`])([A-Za-z]:\\(?:[^\\\s"')`]+\\)*[^\\\s"')`]*)/g, '$1./...');

const maskSecrets = (input: string): string =>
  input
    .replace(
      /(\b[A-Z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|ACCESS[_-]?KEY)[A-Z0-9_]*\b\s*[:=]\s*)(['"`]?)([^\n,'"`\s}]+|.+?)(\2)/gi,
      '$1[REDACTED]'
    )
    .replace(
      /(["']?(?:api[_-]?key|secret|token|password|access[_-]?key)["']?\s*:\s*)(["'])(.+?)(\2)/gi,
      '$1"[REDACTED]"'
    );

const normalizeIndentation = (input: string): string => {
  const trailingTrimmed = toLines(input).map((line) => line.replace(/[ \t]+$/g, ''));

  const measured = trailingTrimmed.map((line) => {
    const match = line.match(/^[ \t]+/);
    const originalIndent = match?.[0] ?? '';
    const content = line.slice(originalIndent.length);
    const normalizedCount = Math.floor(originalIndent.replace(/\t/g, '  ').length / 2) * 2;
    return { content, normalizedCount, isEmpty: content.length === 0 };
  });

  const nonEmptyIndents = measured
    .filter((line) => !line.isEmpty && line.normalizedCount > 0)
    .map((line) => line.normalizedCount);
  const baseIndent = nonEmptyIndents.length > 0 ? Math.min(...nonEmptyIndents) : 0;

  const normalized = measured.map(({ content, normalizedCount, isEmpty }) => {
    if (isEmpty) {
      return '';
    }
    const reducedIndent = Math.max(0, normalizedCount - baseIndent);
    return `${' '.repeat(reducedIndent)}${content}`;
  });

  return fromLines(normalized).trimEnd();
};

const detectLanguage = (code: string): string => {
  const trimmed = code.trim();

  if (/^\s*\{[\s\S]*\}\s*$/.test(trimmed) || /^\s*\[[\s\S]*\]\s*$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // ignore json parse failures
    }
  }

  if (/\b(interface|type|implements|enum)\b|:\s*[A-Z][A-Za-z0-9_<>,\[\]]*/.test(code)) {
    return 'typescript';
  }
  if (/\b(const|let|var|function)\b|=>/.test(code)) {
    return 'javascript';
  }
  if (/^\s*def\s+\w+\s*\(|\bimport\s+\w+|\bfrom\s+\w+\s+import\b/m.test(code)) {
    return 'python';
  }
  if (/^\s*package\s+main\b|\bfunc\s+\w+\s*\(/m.test(code)) {
    return 'go';
  }
  if (/^\s*#include\s+[<"]/m.test(code) || /\bstd::\w+/.test(code)) {
    return 'cpp';
  }
  if (/<[A-Za-z][\s\S]*?>[\s\S]*<\/[A-Za-z]+>/.test(code)) {
    return 'html';
  }
  if (/\bSELECT\b[\s\S]*\bFROM\b/i.test(code)) {
    return 'sql';
  }

  return 'text';
};

const formatForLanguage = async (code: string, language: string): Promise<string> => {
  const parser = parserMap[language];
  if (!parser) {
    return code;
  }

  try {
    return await prettier.format(code, { parser, tabWidth: 2, useTabs: false });
  } catch {
    return code;
  }
};

const wrapMarkdown = (code: string, language: string): string => `\`\`\`${language}\n${code.trimEnd()}\n\`\`\``;

const sanitizePipeline = (input: string): string =>
  [stripAbsolutePaths, maskSecrets, normalizeIndentation].reduce((acc, step) => step(acc), input);

const borderLine = (width: number) => `+${'-'.repeat(width - 2)}+`;
const pad = (value: string, width: number) => value + ' '.repeat(Math.max(0, width - value.length));

const printPanel = (title: string, body: string): void => {
  const bodyLines = toLines(body);
  const width = Math.max(title.length + 4, ...bodyLines.map((line) => line.length + 4), 16);

  console.log(borderLine(width));
  console.log(`| ${pad(title, width - 4)} |`);
  console.log(borderLine(width));
  bodyLines.forEach((line) => console.log(`| ${pad(line, width - 4)} |`));
  console.log(borderLine(width));
};

const showHelp = (): void => {
  console.log('clean-shot [--dry-run]');
  console.log('  --dry-run, -d   Preview sanitized markdown in terminal without writing clipboard');
};

const run = async (): Promise<void> => {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run') || args.has('-d');

  if (args.has('--help') || args.has('-h')) {
    showHelp();
    return;
  }

  let input = '';
  try {
    input = await captureInput();
  } catch (error) {
    console.error(
      `${SUCCESS_GREEN}[Clean-Shot]${RESET} Unable to read clipboard: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
    return;
  }
  if (!input.trim()) {
    console.error(`${SUCCESS_GREEN}[Clean-Shot]${RESET} No snippet found in stdin or clipboard.`);
    process.exitCode = 1;
    return;
  }

  const sanitized = sanitizePipeline(input);
  const language = detectLanguage(sanitized);
  const formatted = await formatForLanguage(sanitized, language);
  const markdown = wrapMarkdown(formatted, language);

  if (dryRun) {
    console.log(`${SUCCESS_GREEN}[Clean-Shot] DRY RUN${RESET}`);
    printPanel('Tech-Noir Preview', markdown);
    return;
  }

  try {
    await clipboard.write(markdown);
    console.log(`${SUCCESS_GREEN}[Clean-Shot] Copied sanitized markdown block to clipboard.${RESET}`);
  } catch (error) {
    console.error(
      `${SUCCESS_GREEN}[Clean-Shot]${RESET} Clipboard unavailable, previewing output instead: ${error instanceof Error ? error.message : String(error)}`
    );
    printPanel('Tech-Noir Preview', markdown);
  }
};

run().catch((error) => {
  console.error(`${SUCCESS_GREEN}[Clean-Shot]${RESET} ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
