#!/bin/sh
# Restart the preview server on $PORT (default 4173), tracking it with a pidfile.
cd "$(dirname "$0")"
PORT=${PORT:-4173}
[ -f .server.pid ] && kill "$(cat .server.pid)" 2>/dev/null
PORT=$PORT nohup node serve.js > .server.log 2>&1 &
echo $! > .server.pid
sleep 1
