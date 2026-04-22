#!/bin/bash

# Ensure data directory exists
mkdir -p /app/data

# Create symlinks to the served directory so Nginx can see the JSON files
# This allows us to persist /app/data with a volume
touch /app/data/status.json /app/data/history.json
ln -sf /app/data/status.json /usr/share/nginx/html/status.json
ln -sf /app/data/history.json /usr/share/nginx/html/history.json

# Start Nginx in the background
nginx -g "daemon on;"

echo "Starting NOC Monitor loop..."

# Run the monitor once immediately
# We set MONITOR_OUTPUT_DIR to /app/data so it writes to the persistent volume
export MONITOR_OUTPUT_DIR=/app/data
python3 monitor.py

# Loop every 5 minutes (300 seconds)
while true; do
    echo "Checking status at $(date)..."
    python3 monitor.py
    sleep 300
done
