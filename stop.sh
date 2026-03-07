#!/bin/bash
echo "Stopping Green-Tech Inventory Assistant"
cd "$(dirname "$0")"
docker compose down
echo "System stopped successfully."
