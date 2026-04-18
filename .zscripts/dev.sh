#!/bin/bash
# Custom dev script for Z.ai sandbox
# This keeps the dev server running persistently

cd /home/z/my-project

# Install dependencies if needed
echo "[DEV] Installing dependencies..."
bun install

# Push database schema
echo "[DEV] Setting up database..."
bun run db:push

# Seed the database with admin user
echo "[DEV] Seeding database..."
curl -s -X POST http://localhost:3000/api/seed 2>/dev/null || true

# Start the dev server with nohup to persist
echo "[DEV] Starting development server..."
nohup node node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
NEXT_PID=$!
echo "[DEV] Next.js dev server started with PID: $NEXT_PID"

# Wait for the server to be ready
for i in $(seq 1 60); do
  if curl -s --connect-timeout 2 --max-time 5 http://localhost:3000 > /dev/null 2>&1; then
    echo "[DEV] Next.js dev server is ready!"
    break
  fi
  sleep 1
done

# Health check
echo "[DEV] Performing health check..."
curl -s http://localhost:3000 > /dev/null 2>&1 || echo "[DEV] Health check warning"

# Keep the script running so the server stays alive
echo "[DEV] Dev server is running. Keeping script alive..."
echo $NEXT_PID > /tmp/next-dev.pid

# Wait indefinitely to keep the process alive
wait $NEXT_PID
