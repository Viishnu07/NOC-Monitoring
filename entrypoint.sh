#!/bin/bash
set -e

# Ensure persistent data directory exists
mkdir -p /app/data

# monitor.py writes to /app/public/ (ROOT_DIR/public)
# We mount /app/data as a Docker volume for persistence.
# Create /app/public and symlink the JSON files into it from the volume.
mkdir -p /app/public
touch /app/data/status.json /app/data/history.json
ln -sf /app/data/status.json /app/public/status.json
ln -sf /app/data/history.json /app/public/history.json

# Also expose the JSON files to Nginx so the frontend can fetch them
ln -sf /app/data/status.json /var/www/html/status.json
ln -sf /app/data/history.json /var/www/html/history.json

# Start Nginx in the background
nginx -g "daemon on;"

echo "Starting NOC Monitor loop..."

# Run the monitor once immediately on startup
python3 /app/monitor.py

# Loop every 5 minutes (300 seconds)
while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] Running monitor check..."
    python3 /app/monitor.py
    sleep 300
done
