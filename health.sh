#!/bin/bash

# health.sh - Check the health of Green-Tech Inventory Assistant services

echo "Checking the health of Green-Tech Inventory system..."
echo "--------------------------------------------------------"

# Navigate to the project directory
cd "$(dirname "$0")"

# Function to check HTTP endpoints with retries
check_endpoint() {
    local name=$1
    local url=$2
    local max_retries=5
    local wait_time=3
    local attempt=1
    
    while [ $attempt -le $max_retries ]; do
        if curl -s -f -m 2 "$url" > /dev/null; then
            echo -e "✅ $name is UP ($url)"
            return 0
        fi
        attempt=$((attempt + 1))
        # Only print sleep message if it's going to retry
        if [ $attempt -le $max_retries ]; then
            sleep $wait_time
        fi
    done
    
    echo -e "❌ $name is DOWN or not responding ($url)"
    return 1
}

# 1. Check Docker Containers Status
echo "Docker Containers Status:"
docker compose ps
echo ""

# 2. Check HTTP Endpoints
echo "Service Endpoints:"
check_endpoint "FastAPI Backend" "http://localhost:8000/"
check_endpoint "React Frontend" "http://localhost:5173/"
check_endpoint "Airflow Webserver" "http://localhost:8080/health"
check_endpoint "MLflow Tracking" "http://localhost:5001/"
check_endpoint "Evidently Service" "http://localhost:8001/"

echo "--------------------------------------------------------"
echo "Note: If a container is running but the endpoint is down, it might still be initializing."
