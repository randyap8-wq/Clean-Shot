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

[![CI](https://github.com/randyap8-wq/Clean-Shot/actions/workflows/ci.yml/badge.svg)](https://github.com/randyap8-wq/Clean-Shot/actions/workflows/ci.yml)

## Install

From npm:

```bash
npm install -g clean-shot
```

From source:

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
npm run build      # compile to ./dist
npm run dev        # run index.ts directly via tsx (dry-run)
npm run typecheck  # type-check without emitting
```

`npm run dev` runs `index.ts` directly in dry-run mode with `tsx`.

## macOS global shortcut

Run the helper to generate an AppleScript that pipes the clipboard through `clean-shot`:

```bash
./scripts/setup-mac-shortcut.sh
```

The script prints instructions for binding it to ⌘⇧X via Automator or the Shortcuts app.

## Publishing

CI runs `npm run build` and a type-check on every push and PR to `main`. To release:

```bash
npm login
npm publish
```

`prepublishOnly` ensures the build runs before publish, and the published package includes the built `dist/` output along with standard metadata/docs files such as `README.md`, `LICENSE`, and `package.json`.

---

<p align="center">
  <a href="https://amalgafy.com">
    <img src="public/amalgafy-icon.svg" alt="Amalgafy" width="200" />
  </a>
</p>

<p align="center">
  Built by the <a href="https://amalgafy.com"><strong>Amalgafy</strong></a> team.
</p>
