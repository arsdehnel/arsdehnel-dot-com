#!/bin/bash

for FILE in posts/**/*.excalidraw; do
  FRAMES=$(jq -r '.elements[] | select(.type == "frame") | .id' "$FILE")
  FRAME_COUNT=$(echo "$FRAMES" | grep -c .)

  if [ "$FRAME_COUNT" -eq 0 ]; then
    echo "🚨 No frame found in $FILE"
    continue
  fi

  if [ "$FRAME_COUNT" -gt 1 ]; then
    echo "🚨 Multiple frames found in $FILE"
    continue
  fi

  OUT="${FILE%.excalidraw}.png"
  if [ -f "$OUT" ] && [ "$OUT" -nt "$FILE" ]; then
    echo "Skipping $FILE (up to date)"
    continue
  fi
  pnpm dlx @excalidraw/cli render "$FILE" --frame-id "$FRAMES" --out "$OUT"
done
