#!/bin/bash
# Check if Next.js dev server is running, restart if not
if ! ss -tlnp 2>/dev/null | grep -q ":3000 "; then
  echo "[$(date)] Server not running, starting..." >> /home/z/my-project/watchdog.log
  cd /home/z/my-project
  nohup node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
  echo "[$(date)] Server started with PID $!" >> /home/z/my-project/watchdog.log
fi
