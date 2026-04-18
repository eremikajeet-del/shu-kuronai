#!/bin/bash
cd /home/z/my-project
export PORT=3000
# Use exec to replace shell with next process - makes it PID 1 of process group
exec node node_modules/.bin/next dev -p 3000
