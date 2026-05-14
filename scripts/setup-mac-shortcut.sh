#!/usr/bin/env bash
set -euo pipefail

OUT="$HOME/clean-shot.applescript"
CLEAN_SHOT_BIN="$(command -v clean-shot || true)"

if [ -z "$CLEAN_SHOT_BIN" ]; then
  echo "Error: clean-shot was not found in PATH. Install it first, then rerun this setup script." >&2
  exit 1
fi

cat > "$OUT" <<APPLESCRIPT
on run
  set theText to the clipboard
  set cleaned to do shell script "/usr/bin/env printf %s " & quoted form of theText & " | " & quoted form of "${CLEAN_SHOT_BIN}"
  set the clipboard to cleaned
end run
APPLESCRIPT

echo "✓ AppleScript written to: $OUT"
echo ""
echo "Bind it to ⌘⇧X:"
echo "  1. Open Automator → New → Quick Action"
echo "  2. Add 'Run AppleScript' and paste the contents of $OUT"
echo "  3. Save as 'Clean Shot'"
echo "  4. System Settings → Keyboard → Keyboard Shortcuts → Services"
echo "  5. Assign ⌘⇧X to 'Clean Shot'"
echo ""
echo "Or use the Shortcuts app: New Shortcut → Run Shell Script (clean-shot) on clipboard → set clipboard → assign ⌘⇧X."
