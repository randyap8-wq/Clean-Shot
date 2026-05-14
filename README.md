# Clean-Shot

Clean-Shot is a fast Node/TypeScript CLI that turns clipboard (or piped) snippets into clean, share-ready Markdown code blocks.

## Features

- Capture from clipboard or `stdin`
- Sanitize automatically:
  - replaces absolute local paths with `./...`
  - masks leaked secrets like `API_KEY`, `TOKEN`, `SECRET`, `PASSWORD`
  - strips trailing whitespace
  - normalizes indentation to a 2-space style
- Detects likely language and wraps output in fenced Markdown with a language tag
- Uses a Tech-Noir terminal style with high-contrast success green (`#00FF41`)
- `--dry-run` preview mode that does not overwrite clipboard contents

## Install

```bash
npm install
npm run build
npm link
```

## Usage

### Clipboard input (default)

```bash
clean-shot
```

### Piped input

```bash
cat snippet.ts | clean-shot
```

### Dry run preview

```bash
clean-shot --dry-run
```

## Development

```bash
npm run build
npm run dev
```

`npm run dev` runs `index.ts` directly in dry-run mode with `tsx`.
