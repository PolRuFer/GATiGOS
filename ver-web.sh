#!/bin/sh
# Vista previa local de GatYGos (macOS/Linux): ./ver-web.sh
cd "$(dirname "$0")/dev/preview" || exit 1
[ -d node_modules/liquidjs ] || npm install --no-save liquidjs
( sleep 1; open http://localhost:4173/index.html 2>/dev/null || xdg-open http://localhost:4173/index.html ) &
node serve.js
