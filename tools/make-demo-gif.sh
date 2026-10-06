#!/bin/bash
# Rigenera le GIF del README (docs/demo-<lingua>-<tema>.gif) dalla demo
# (index.html?demo&tour), fotogramma per fotogramma con Chrome headless.
# Requisiti: Google Chrome e ffmpeg; gifsicle facoltativo (riduce il peso).
# Uso: tools/make-demo-gif.sh
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT=8947
STEPS=6  # fotogrammi: piano di default + i 5 clic di tools/demo-tour.js

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
WORK=$(mktemp -d)
trap 'kill $SERVER; rm -rf "$WORK"' EXIT
sleep 1
mkdir -p docs

for lang in it en; do
  for theme in light dark; do
    out="docs/demo-$lang-$theme.gif"
    for ((i = 0; i < STEPS; i++)); do
      png="$WORK/$lang-$theme-$i.png"
      "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
        --window-size=720,980 --force-device-scale-factor=1 \
        --user-data-dir="$WORK/profile-$lang-$theme-$i" \
        --virtual-time-budget=1000 \
        --screenshot="$png" \
        "http://127.0.0.1:$PORT/index.html?demo&tour&step=$i&lang=$lang&theme=$theme" >/dev/null 2>&1 &
      chrome_pid=$!
      # Chrome headless scrive lo screenshot ma non sempre esce da solo
      t=0
      while [[ ! -s "$png" && $t -lt 100 ]]; do sleep 0.2; t=$((t + 1)); done
      sleep 0.5
      kill "$chrome_pid" 2>/dev/null || true
      wait "$chrome_pid" 2>/dev/null || true
      [[ -s "$png" ]] || { echo "fotogramma mancante: $png" >&2; exit 1; }
    done
    # ultimo fotogramma ripetuto: la GIF si ferma un attimo prima di ricominciare
    last=$((STEPS - 1))
    for extra in 1 2; do
      cp "$WORK/$lang-$theme-$last.png" "$WORK/$lang-$theme-$((last + extra)).png"
    done
    ffmpeg -loglevel error -y -framerate 1.2 -i "$WORK/$lang-$theme-%d.png" \
      -vf "crop=648:930:36:24,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none" \
      -loop 0 "$out"
    if command -v gifsicle >/dev/null; then
      gifsicle -O3 --batch "$out"
    fi
    echo "$out $(du -k "$out" | cut -f1) KB"
  done
done
